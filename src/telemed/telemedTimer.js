import { getTokenPrepare, sendToOutForNew, sendToOutForEdit, sendToOutForCancel , stripHtmlTags } from './external.js';
import { getTelemedPayload } from './services.js';
import { logTelemedTransaction ,runTelemedSyncGetStatus} from './updater.js';
import { getPool } from '../common/db.js';

export async function startTelemedLoopData() {
  const timestamp = new Date().toISOString();
  console.log(`\n⏱ Start Telemed timer triggered at ${timestamp}\n`);
  try {
    const date2 = new Date();
    date2.setDate(date2.getDate() - 1);
    const lastDate =
      date2.getFullYear() +
      '-' +
      String(date2.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date2.getDate()).padStart(2, '0');

    let payloadFull = await getTelemedPayload("NEW", lastDate);
  
    if (!Array.isArray(payloadFull) || payloadFull.length === 0) {
      console.log('📭 No new data to send, ไม่มีข้อมูลตามเงื่อนไขเพื่อส่ง(Create:สร้างรายการนัดใหม่)');
      return;
    }

    // ✅ ตัวนับยอดรวม
    let newCount = 0, cancelCount = 0, editCount = 0, unknownCount = 0;
    let successCount = 0, failCount = 0;

    // ✅ เก็บรายการที่ fail แยกออกมา
    let failLogs = [];

    for (const payload of payloadFull) {
      //console.log('\n📦 telemedTimer.js \n', JSON.stringify(payload, null, 2));
      let confirmStatusTypeNum = payload.confirmstatustype === null ? null : Number(payload.confirmstatustype);
      
      //confirmStatusTypeNum = 6;  //MOCK
      switch (confirmStatusTypeNum) {
        case 0:
        case null: /* New */ {
          newCount++;
          let outResponse1 = await sendToOutForNew(payload);
          const statusCode = String(outResponse1.status_code).trim();
          const statusText = String(outResponse1.status).trim().toLowerCase();

          if (statusCode === '200' || statusCode === '201' || statusText === 'success') {
            console.log(`✅ Sent OK [${statusCode}] at ${timestamp}`);
            successCount++;
          } else {
            console.warn(`⚠️ Send failed(New) [${statusCode}] - ${outResponse1.statusDesc}`);
            failCount++;
            failLogs.push({
              case: "New",
              hn: payload.hn,
              appointment_date: payload.appointment_date,
              transaction_id: payload.transaction_id
            });
          }
          try { await logTelemedTransaction(payload, outResponse1); } catch (err) {}
          break;
        }

        case 6: /* Cancel */ {
          cancelCount++;
          let outResponse2 = await sendToOutForCancel(payload);
          const statusCode2 = String(outResponse2.status_code).trim();
          const statusText2 = String(outResponse2.status).trim().toLowerCase();

          if (statusCode2 === '200' || statusCode2 === '201' || statusText2 === 'success') {
            console.log(`✅ Sent OK [${statusCode2}] at ${timestamp}`);
            successCount++;
          } else {
            console.warn(`⚠️ Send failed(Cancel) [${statusCode2}] - ${outResponse2.statusDesc}`);
            failCount++;
            failLogs.push({
              case: "Cancel",
              hn: payload.hn,
              appointment_date: payload.appointment_date,
              transaction_id: payload.transaction_id
            });
          }
          try { await logTelemedTransaction(payload, outResponse2); } catch (err) {}
          break;
        }

        case 7: /* Edit */ {
          editCount++;
          let outResponse3 = await sendToOutForEdit(payload);
          const statusCode3 = String(outResponse3.status_code).trim();
          const statusText3 = String(outResponse3.status).trim().toLowerCase();

          if (statusCode3 === '200' || statusCode3 === '201' || statusText3 === 'success') {
            console.log(`✅ Sent OK [${statusCode3}] at ${timestamp}`);
            successCount++;
          } else {
            console.warn(`⚠️ Send failed(Edit) [${statusCode3}] - ${outResponse3.statusDesc}`);
            failCount++;
            failLogs.push({
              case: "Edit",
              hn: payload.hn,
              appointment_date: payload.appointment_date,
              transaction_id: payload.transaction_id
            });
          }
          try { await logTelemedTransaction(payload, outResponse3); } catch (err) {}
          break;
        }

        default:
          unknownCount++;
          console.log(`❌ None confirmStatusType : ${confirmStatusTypeNum}`);
          break;
      }
    }

    // ✅ สรุปยอดรวมหลัง loop
    //console.log('📨📨📨📨📨📨📨📨📨📨📨📨📨📨 Response JSON:', JSON.stringify(json, null, 2));
    console.log("\n📊 Summary Report(Create) 📊");
    console.log(`🆕 New count: ${newCount}`);
    console.log(`❌ Cancel count: ${cancelCount}`);
    console.log(`✏️ Edit count: ${editCount}`);
    console.log(`❓ Unknown count: ${unknownCount}`);
    console.log(`✅ Success sent: ${successCount}`);
    console.log(`⚠️ Failed sent: ${failCount}`);

    // ✅ แสดงรายละเอียดของรายการที่ fail
    if (failLogs.length > 0) {
      console.log("\n⚠️ รายการที่ส่งไม่สำเร็จ ⚠️");
      failLogs.forEach(f => {
        console.log(`Case=${f.case} | HN=${f.hn} | Date=${f.appointment_date} | TXID=${f.transaction_id}`);
      });
    }

  } catch (err) {
    console.error(`❌ Telemed timer error at ${timestamp}:`, err.message);
  }
}

export async function startTelemedUpdateVNPressLoopData() {
  const timestamp = new Date().toISOString();
  console.log(`\n⏱ Start Telemed Update VN Press timer triggered at ${timestamp}\n`);
  try {
    const date2 = new Date();
    date2.setDate(date2.getDate() );
    const lastDate =
      date2.getFullYear() +
      '-' +
      String(date2.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date2.getDate()).padStart(2, '0');

    let payloadFull = await getTelemedPayload("UPDATE", lastDate); //ส่งวันที่ไป แต่ไม่ได้ใช้ใน SQL เพราะใช้เงื่อนไขวันที่นัดหมายแทน
  
    if (!Array.isArray(payloadFull) || payloadFull.length === 0) {
      console.log('📭 No new vn press data to send, ไม่มีข้อมูลตามเงื่อนไขเพื่อส่ง()(Update:อัพเดท VN Press)');
      return;
    }

    // ✅ ตัวนับยอดรวม
    let editCount = 0, unknownCount = 0;
    let successCount = 0, failCount = 0;

    // ✅ เก็บรายการที่ fail แยกออกมา
    let failLogs = [];

    for (const payload of payloadFull) {
      console.log('\n📦 telemedTimer.js.startTelemedUpdateVNPressLoopData \n', JSON.stringify(payload, null, 2));
      let confirmStatusTypeNum = payload.confirmstatustype === null ? null : Number(payload.confirmstatustype);
      
      editCount++;
      let outResponse3 = await sendToOutForEdit(payload);
      const statusCode3 = String(outResponse3.status_code).trim();
      const statusText3 = String(outResponse3.status).trim().toLowerCase();

      if (statusCode3 === '200' || statusCode3 === '201' || statusText3 === 'success') {
        console.log(`✅ Sent OK [${statusCode3}] at ${timestamp}`);
        successCount++;
      } else {
        console.warn(`⚠️ Send failed(Update VN Press) [${statusCode3}] - ${outResponse3.statusDesc}`);
        failCount++;
        failLogs.push({
          case: "Edit",
          hn: payload.hn,
          appointment_date: payload.appointment_date,
          transaction_id: payload.transaction_id
        });
      }
      try { await logTelemedTransaction(payload, outResponse3); } catch (err) {}
      
    }

    // ✅ สรุปยอดรวมหลัง loop
    console.log("\n📊 Summary Report(Update VN Press) 📊");
    console.log(`✏️ Edit count: ${editCount}`);
    //console.log(`❓ Unknown count: ${unknownCount}`);
    console.log(`✅ Success sent: ${successCount}`);
    console.log(`⚠️ Failed sent: ${failCount}`);

    // ✅ แสดงรายละเอียดของรายการที่ fail
    if (failLogs.length > 0) {
      console.log("\n⚠️ รายการที่ส่งไม่สำเร็จ ⚠️");
      failLogs.forEach(f => {
        console.log(`Case=${f.case} | HN=${f.hn} | Date=${f.appointment_date} | TXID=${f.transaction_id}`);
      });
    }

  } catch (err) {
    console.error(`❌ Telemed VN Press timer error at ${timestamp}:`, err.message);
  }
}

export function startTelemedTimer() {
  const now = new Date();
  const nextRun = new Date();

  nextRun.setDate(now.getDate() + 1);
  nextRun.setHours(0, 1, 0, 0); // 00:01:00.000

  const delay = nextRun.getTime() - now.getTime();

  console.log(`🕰️ ตั้งเวลา Telemed job ครั้งถัดไป: ${nextRun.toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`);

  setTimeout(async () => {
    await startTelemedLoopData();  // ✅ เรียกฟังก์ชันหลัก
    await startTelemedUpdateVNPressLoopData();  // ✅ เรียกฟังก์ชัน VN Press หลัก เพื่ออัพเดทสถานะ VN Press
    await runTelemedSyncGetStatus(getPool);  // ✅ เรียกฟังก์ชันซิงค์ข้อมูล Telemed
    startTelemedTimer();       // ✅ ตั้งรอบถัดไป
  }, delay);
}

export function startTelemedTimer_interval() {
  setInterval(async () => {
    await startTelemedLoopData();  // ✅ เรียกฟังก์ชันหลัก
    await startTelemedUpdateVNPressLoopData();  // ✅ เรียกฟังก์ชัน VN Press หลัก เพื่ออัพเดทสถานะ VN Press
    await runTelemedSyncGetStatus(getPool);  // ✅ เรียกฟังก์ชันซิงค์ข้อมูล Telemed
  }, .1000 * 60 * 1000); // 10 * 60 * 1000) = ทุก 10 นาที
}

export function getYesterdayBangkokDateString() {
  const now = new Date();

  // แปลงเป็นเวลา Bangkok แล้วลบ 1 วัน
  const bangkokTime = new Date(
    new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
    ).getTime() - 24 * 60 * 60 * 1000
  );

  const yyyy = bangkokTime.getFullYear();
  const mm = String(bangkokTime.getMonth() + 1).padStart(2, '0');
  const dd = String(bangkokTime.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd}`;
}

export function getBangkokDateTime() {
  const now = new Date();
  const bangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));

  const yyyy = bangkok.getFullYear();
  const mm = String(bangkok.getMonth() + 1).padStart(2, '0');
  const dd = String(bangkok.getDate()).padStart(2, '0');
  const hh = String(bangkok.getHours()).padStart(2, '0');
  const min = String(bangkok.getMinutes()).padStart(2, '0');
  const ss = String(bangkok.getSeconds()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function getYesterdayBangkokDateTime() {
  const now = new Date();
  const bangkok = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
  bangkok.setDate(bangkok.getDate() - 1);
  bangkok.setHours(0, 0, 0, 0);

  const yyyy = bangkok.getFullYear();
  const mm = String(bangkok.getMonth() + 1).padStart(2, '0');
  const dd = String(bangkok.getDate()).padStart(2, '0');

  return `${yyyy}-${mm}-${dd} 00:00:00`;
}
 
export function jsonMockdata() {
  const jsonString =  `
  {
  "hn": "4817150",
  "vn": "",
  "appointmentno": "6811-30962",
  "patient_cid": "3199900192358",
  "doctor_cid": "1101700100081",
  "doctor_title": "แพทย์",
  "doctor_firstname": "ทัศน์วรรณ",
  "doctor_lastname": "สุริยะณรงค์ชัย",
  "account_title": "นาย",
  "first_name": "สมบูรณ์",
  "last_name": "กลางอรัญ",
  "birth_date": "1954-02-28",
  "phone_number": "0941416696",
  "phone_number_other": "",
  "appointment_date": "2025-12-08",
  "appointment_type_name": "Telemedicine",
  "hospital_code": "10661",
  "hospital_department_name": "อายุรกรรม ONCO (Telemed).",
  "hospital_name": "โรงพยาบาลสระบุรี",
  "hospital_room_name": "Telemedicine",
  "time_start": "09:00",
  "time_end": "10:00",
  "require_type": "patient",
  "address_detail": {
    "province": "สระบุรี",
    "district": "เมืองสระบุรี",
    "sub_district": "หนองโน",
    "road": "",
    "house_no": "111/2",
    "zip_code": "18000"
  }
}
    `;
  return JSON.parse(jsonString);  
}