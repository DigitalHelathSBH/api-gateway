import { getPool } from '../common/db.js';
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
    console.warn('⚠️ ไม่มี transaction_id ใน response');
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

  //console.log(`📝 Logging transaction: ${txid}\n  เตรียมเข้าสู updateTelemedStatusPerRow() \n  payload.logEntry : ${logEntry} \n ${JSON.stringify(payload, null, 2)}`);
  await updateTelemedStatusPerRow(logEntry);
}

export async function updateTelemedStatusPerRow(payloadResponse) {
  //console.log("\n xxxxxxxxxxxxxx   updateTelemedStatusPerRow Start Keep Status xxxxxxxxxxxxx  \n");
  // ✅ แปลง object เดี่ยวเป็น array
  const payloadArray = Array.isArray(payloadResponse) ? payloadResponse : [payloadResponse];
  if (payloadArray.length === 0) return;
  //console.log(`\n 📦📦📦📦Prepare For Loop  updateTelemedStatusPerRow()  \n${JSON.stringify(payloadResponse, null, 2)}`);
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

    //console.log(`🔁 TXID in updater.js.updateTelemedStatusPerRow(): ${item.transaction_id} , AppointmentNo: ${appointmentno} , confirmStatusTypeNum: ${confirmStatusTypeNum}`);
    //console.log(`\n 🔐🔐 Query appointmentNo${appointmentno} , confirmStatusTypeNum: ${confirmStatusTypeNum}`);

    let sqlvalcheck = `UPDATE SSBDatabase.dbo.HNAPPMNT SET transaction_id = ${txid} WHERE APPOINTMENTNO = ${appointmentno} `;
    //console.log(`\n 📦Log sql in loop ${index_loop} sql chekckupdate = ${sqlvalcheck}`);
    if (txid) {
      let sqlval = ``;      
      //6:ยกเลิก , 7:แก้ไข , NULL : ให้เพิ่มใหม่      
      switch (confirmStatusTypeNum) {
        case 0:
        case null: /* New */ 
        case 6: /* cancel */ 
        case 7: /* edit */ {
          sqlval = `
            UPDATE SSBDatabase.dbo.HNAPPMNT
            SET transaction_id = @txid
            WHERE APPOINTMENTNO = @appointmentno
          `;

          } 
          break;
        default:  
          /* none */
          break;
      }
      if( confirmStatusTypeNum === 6 || confirmStatusTypeNum === 7 || (confirmStatusTypeNum === 0 || confirmStatusTypeNum === null))
      {
        try {
          await pool.request()
            .input('txid', sql.NVarChar, txid)
            .input('appointmentno', sql.NVarChar, appointmentno)
            .query(sqlval);

          console.log(`✅ Upserted: transaction_id=${txid}, Status=${item.status}`);
        } catch (err) {
          console.error(`❌ Failed transaction_id=${txid} → ${err.message}`);
        }
      }

    }else{
      console.warn(`⚠️ ไม่มี transaction_id ใน response : appointmentno = ${appointmentno}`);
    }

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