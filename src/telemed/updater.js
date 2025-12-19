import { getPool } from '../common/db.js';
import { getTelemedPayload } from './services.js';
import { getTelemedPayloadStatusData } from './external.js';  
import sql from 'mssql';
 
export async function logTelemedTransaction(payload, response) {
  //console.log('payload object:', payload);
  // แสดง payload แบบ JSON string ที่อ่านง่าย
  //console.log('payload JSON:\n', JSON.stringify(payload, null, 2));

  const res = response?.Payload || response;  // ถ้ามี Payload ให้ใช้ Payload, ถ้าไม่มีใช้ response ตรง ๆ
  // ดึง transaction_id จากหลายระดับ
  let txid =
    res?.result?.transaction_id ||   // กรณีใหม่: อยู่ใน Payload.result.transaction_id
    res?.transaction_id ||           // กรณีเก่า: อยู่ตรง response.transaction_id
    response?.Payload?.result?.transaction_id || // เผื่อ response.Payload.result
    null;  

  if (!txid) {
    
    //txid = payload.appointmentno; //"BLOCK01" + getBangkokDateTimeCompact();
    console.warn('🔴🔴🔴🔴🔴 ไม่มี transaction_id ใน response 🔴🔴🔴🔴🔴 \ปัญาหานี้ส่วนใหญ่เกิดจากส่งค่าไปไม่ถูกรูปแบบตามที่ EndPoint ต้องการ? โปรตรวสอบ');
    //return;
  }

  const appointment_datetime = `${payload.appointment_date} ${payload.time_start}`.trim();

  const logEntry = {
    transaction_id: txid,
    hn: payload.hn,
    confirmstatustype: payload.confirmstatustype ?? 0,
    appointmentno: payload.appointmentno || null,
    appointment_datetime: payload.appointment_datetime,
    status: res?.status || 'unknown',
    status_code: res?.status_code || 'unknown',
    message: res?.message || res?.result?.message || null,
    doctor_url: res?.result?.doctor_url || null,
    patient_url: res?.result?.patient_url || null,
    last_error: res?.status === 'fail' ? res?.message : null
  };

  //console.log(`📝 Logging transaction: ${txid}\n  เตรียมเข้าสู updateTelemedCreateStatusPerRow() \n  payload.logEntry : ${logEntry} \n ${JSON.stringify(payload, null, 2)}`);
  await updateTelemedCreateStatusPerRow(logEntry);
}

export async function updateTelemedCreateStatusPerRow(payloadResponse) {
  //console.log("\n xxxxxxxxxxxxxx   updateTelemedCreateStatusPerRow Start Keep Status xxxxxxxxxxxxx  \n");
  // ✅ แปลง object เดี่ยวเป็น array
  const payloadArray = Array.isArray(payloadResponse) ? payloadResponse : [payloadResponse];
  if (payloadArray.length === 0) return;
  //console.log(`\n 📦📦📦📦Prepare For Loop  updateTelemedCreateStatusPerRow()  \n${JSON.stringify(payloadResponse, null, 2)}`);
  const pool = await getPool();
  //console.log(`\n 📦📦📦📦Prepare For Loop   payload count= ${payloadArray.length}`);
  let index_loop = 0;
  for (const item of payloadArray) {
    index_loop++;
    //console.log(`\n 📦📦📦📦In Loop  : ${index_loop}   `);
    //if (!item.transaction_id) continue;

    let txid = item.transaction_id ?? '';
    //const procedurecode = item.procedurecode; // 6:ยกเลิก , 7:แก้ไข , NULL : ให้เพิ่มใหม่
    const appointmentno = item.appointmentno ?? '';
    const confirmstatustype = item.confirmstatustype;
    let confirmStatusTypeNum = confirmstatustype === null ? null : Number(confirmstatustype);

    //console.log(`🔁 TXID in updater.js.updateTelemedCreateStatusPerRow(): ${item.transaction_id} , AppointmentNo: ${appointmentno} , confirmStatusTypeNum: ${confirmStatusTypeNum}`);
    //console.log(`\n 🔐🔐 Query appointmentNo${appointmentno} , confirmStatusTypeNum: ${confirmStatusTypeNum}`);

    //let sqlvalcheck = `UPDATE SSBDatabase.dbo.HNAPPMNT SET TelemedStatus = 'S', transaction_id = @txid  WHERE APPOINTMENTNO = @appointmentno`;
    //console.log(`\n 📦Log sql in loop ${index_loop} sql chekckupdate = ${sqlvalcheck}`);
    if (txid) {
      let sqlval = ``;      
      //6:ยกเลิก , 7:แก้ไข , NULL : ให้เพิ่มใหม่      
      switch (confirmStatusTypeNum) {
        case 0:
        case null: /* New */ 
          {
            sqlval = `UPDATE SSBDatabase.dbo.HNAPPMNT SET TelemedStatus = 'S', transaction_id = @txid  WHERE APPOINTMENTNO = @appointmentno`;
          }
          break;        
        case 6: /* cancel */ 
          {
            sqlval = `UPDATE SSBDatabase.dbo.HNAPPMNT SET TelemedStatus = 'C' WHERE APPOINTMENTNO = @appointmentno`;
          }
          break;
        case 7: /* edit */ 
         {
          sqlval = `UPDATE SSBDatabase.dbo.HNAPPMNT SET TelemedStatus = 'U' WHERE APPOINTMENTNO = @appointmentno`;
         } 
          break;
        default:  
          /* none */
          break;
      }
      if( confirmStatusTypeNum === 6 || confirmStatusTypeNum === 7 || (confirmStatusTypeNum === 0 || confirmStatusTypeNum === null))
      {
        try {
          const request = pool.request();
          if (confirmStatusTypeNum === 0 || confirmStatusTypeNum === null ) {
            request.input('txid', sql.NVarChar, txid);
          }
          request.input('appointmentno', sql.NVarChar, appointmentno);
          await request.query(sqlval);
          console.log(`✅ Upserted: transaction_id=${txid}, Status=${item.status}`);
        } catch (err) {
          console.error(`❌ Failed transaction_id=${txid} → ${err.message}`);
        }
       
      }

    }else{
      console.warn(`🔴🔴🔴🔴🔴 ไม่มี transaction_id ใน response : appointmentno = ${appointmentno} 🔴🔴🔴🔴🔴 \ปัญาหานี้ส่วนใหญ่เกิดจากส่งค่าไปไม่ถูกรูปแบบตามที่ EndPoint ต้องการ? โปรตรวสอบ`);
    }

  }
}

// ฟังก์ชันหลักที่เรียก API แล้วอัปเดต DB
export async function syncTelemedStatusFromPayload() {
  const timestamp = new Date().toISOString();
  console.log(`\n⏱ Start Telemed Sync Status (from payload) at ${timestamp}\n`);

  const date2 = new Date();
  date2.setDate(date2.getDate() - 1);
  const lastDate =
    date2.getFullYear() +
    '-' +
    String(date2.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date2.getDate()).padStart(2, '0');

  const payloads = await getTelemedPayload("STATUS", lastDate); /* วันที่ไม่ได้ใช้จริงใข้fixใน sql */
  if (!Array.isArray(payloads) || payloads.length === 0) {
    console.log("📭❓❓❓ ไม่พบข้อมูล STATUS ที่ต้อง sync เพื่อใช้วันที่ทั้งหมด ในการไปวนUpdate สถานะ ");
    return;
  }

  // ✅ สร้างชุดวันที่นัดที่ต้อง sync
  const uniqueDates = new Set();
  for (const item of payloads) {
    if (item.appointment_date) {
      uniqueDates.add(item.appointment_date);
    }
  }

  let totalSuccess = 0, totalFail = 0;
  for (const dateStr of uniqueDates) {
    console.log(`\n📅 Sync สถานะสำหรับวันที่: ${dateStr}`);
    const apiResponse = await getTelemedPayloadStatusData(dateStr);

    if (apiResponse.status_code !== '200') {
      console.warn(`⚠️ API ล้มเหลวสำหรับวันที่ ${dateStr}: ${apiResponse.statusDesc}`);
      continue;
    }

    const dataList = apiResponse.Payload?.data || [];
    if (!Array.isArray(dataList) || dataList.length === 0) {
      console.log(`📭 ไม่มีข้อมูลสถานะจาก API สำหรับวันที่ ${dateStr}`);
      continue;
    }

    for (const item of dataList) {
      const txid = item.transaction_id;
      const status = confirmstatusCovertToTelemedStatus(item.confirmation_contact_status);
      const statusAct = confirmstatusCovertToTelemedStatusAct(item.status_active);
      const pool = await getPool();
      if (txid) {
        try {
          await updateTelemedGetStatus(pool, txid, status, statusAct);
          totalSuccess++;
        } catch (err) {
          console.error(`❌ อัปเดตล้มเหลว TXID=${txid} → ${err.message}`);
          totalFail++;
        }
      }
    }
  }

  console.log("\n📊 Summary Report (Sync Status จาก Payload) 📊");
  console.log(`✅ อัปเดตสำเร็จ: ${totalSuccess}`);
  console.log(`⚠️ อัปเดตล้มเหลว: ${totalFail}`);
}

/* สถานะยืนยันเพื่อรับใช้บริการ */
export function confirmstatusCovertToTelemedStatus(appStatus) {
  /* แปลงค่าจาก confirmstatus ที่ได้จาก Telemed เป็นค่า TelemedStatus ที่จะอัปเดตใน DB */
  switch (appStatus) {
    case 'waiting_confirm':
      return 'S';   // รอยืนยัน
    case 'answered_not_available':
      return 'C';   // ไม่รับการทำ telemed → Cancel
    case 'answered_available':
      return 'Y';   // รับการทำ telemed → Yes
    default:
      return '';    // กรณีไม่ตรง mapping → คืนค่าว่าง
  }
}
/* สถาการใช้งานโทรจริงหรือไม่ */
export function confirmstatusCovertToTelemedStatusAct(appStatus) {
  switch (appStatus) {
    case 'pending':
      return 'P';   // กำลังดำเนินการ
    case 'waiting_conference':
      return 'S';   // รอ conference
    case 'complete ':
      return 'Y';   // เสร็จสิ้น
    case 'cancel':
      return 'C';   // ยกเลิก      
    default:
      return '';    // กรณีไม่ตรง mapping → คืนค่าว่าง
  }
}
// ฟังก์ชันอัปเดต TelemedStatus = 'U'
export async function updateTelemedGetStatus(pool, transaction_id, telemedStatus, telemedStatusAct) {
  const sqlshow = `UPDATE SSBDatabase.dbo.HNAPPMNT SET TelemedStatus = '${telemedStatus}', TelemedStatusAct = '${telemedStatusAct}' WHERE transaction_id = '${transaction_id}'`;
  //console.log(`\n 📦📦📦📦📦 updater.js.updateTelemedGetStatus() Log SQL : ${sqlshow} \n`);
  try {
    await pool.request()
      .input('transactionid', sql.NVarChar, transaction_id)
      .query(`
        UPDATE SSBDatabase.dbo.HNAPPMNT SET TelemedStatus = '${telemedStatus}', TelemedStatusAct = '${telemedStatusAct}' WHERE transaction_id = @transactionid
      `);

    console.log(`✅ Updated TelemedStatus=${telemedStatus}, TelemedStatusAct=${telemedStatusAct} for TXID=${transaction_id} [updater.js.updateTelemedGetStatus()]`);
  } catch (err) {
    console.error(`❌ Failed to update TXID=${transaction_id} → ${err.message} [updater.js.updateTelemedGetStatus()] \n[${sqlshow}]`);
  }
}

export function getBangkokDateTimeCompact() {
  const now = new Date();
  const bangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

  const yyyy = bangkok.getFullYear();
  const mm = String(bangkok.getMonth() + 1).padStart(2, '0');
  const dd = String(bangkok.getDate()).padStart(2, '0');
  const hh = String(bangkok.getHours()).padStart(2, '0');
  const min = String(bangkok.getMinutes()).padStart(2, '0');
  const ss = String(bangkok.getSeconds()).padStart(2, '0');
  const fff = String(bangkok.getMilliseconds()).padStart(3, '0');

  return `${yyyy}${mm}${dd}-${hh}${min}${ss}${fff}`;
}