import { getPool } from '../common/db.js';
import sql from 'mssql';
 
export const getTelemedPayload = async (modeType,date) => {
  const pool = await getPool();
  modeType = modeType.toUpperCase();

  let sql_SubWhere = ` AND CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, @date) AND (HNAPPMNT.TelemedStatus is null OR HNAPPMNT.TelemedStatus = '') 
                       AND (HNAPPMNT.transaction_id is null OR HNAPPMNT.transaction_id = '')`; //์Default  NEW
  let sql_sortBy = ` ORDER BY HNAPPMNT.MAKEDATETIME ASC `;                    
  if(modeType === 'N' || modeType === 'NEW') { //NEW สร้างเอกสารเพื่อส่งไปTelemed ใหม่
    sql_SubWhere = sql_SubWhere;    
  }else if(modeType === 'E' || modeType === 'EDIT' ) { //Edit แก้ไขในทุุกกรณ๊ ยังไม่เอาไปใช้ ยังไม่มี Case นะตอนนี้สร้างเผื่อไว้
    sql_SubWhere = " ";
  }else if(modeType === 'U' || modeType === 'UPDATE') { //Update  ปรับปรุงเฉพาะ VN ที่ห้องบัตรGenให้หลังจากAPI ส่งการนัดหมายแล้ว ระบบจะมองหาข้อมูลที่มี transaction_id แล้วเท่านั้น 3วันก่อนวันนัดหมาย(เพื่อลดภาระการส่งข้อมูล) 
    //+4วันเพราะระบบเราสั่งประมวลผลทุภหลังเทียงคืนของวันนัดหมาย ก่อนวันนัดหมายจริง 3 วัน เราก็ต้องย้อนกลับไปอีก 1 วัน เลยต้องเป็น 4 วัน
    //sql_SubWhere = " AND CONVERT(date, DATEADD(DAY, +4, GETDATE())) = CONVERT(date, HNAPPMNT.APPOINTMENTDATETIME) AND (HNAPPMNT.transaction_id is not null ) AND HNAPPMNT.TelemedStatus not in('C','Y') ";
    sql_SubWhere = ` AND CONVERT(date, HNAPPMNT.APPOINTMENTDATETIME) BETWEEN CONVERT(date, DATEADD(DAY, -1, GETDATE())) AND CONVERT(date, DATEADD(DAY, 3, GETDATE())) 
                     AND (HNAPPMNT.transaction_id is not null ) AND HNAPPMNT.TelemedStatus not in('C','Y') `;
  }else if(modeType === 'C' || modeType === 'CANCEL') { //Cancel ยกเลิกการนัดหมาย ตอนนี้ยังไม่เอาไปใช้ ตอนนี้ใการ UPdate สถานะเป็น C แทน
    sql_SubWhere = ` AND HNAPPMNT.transaction_id = '?' `; //ยังไม่ได้ใช้
  }else if(modeType === 'S' || modeType === 'STATUS') { //ดึงข้อมูลมาเช็คสถานะการนัดหมายทุกครั้ง (ใช้ในกรณีที่ต้องการเช็คสถานะการนัดหมายที่ส่งไปแล้ว) ดูช่วงวันนัดหมายล่วงหน้า 15 วัน แต่ก่อนใช้3 วันไม่พอ
    sql_SubWhere = ` AND CONVERT(date, HNAPPMNT.APPOINTMENTDATETIME) BETWEEN CONVERT(date, DATEADD(DAY, -1, GETDATE())) AND CONVERT(date, DATEADD(DAY, 14, GETDATE()))                      
                     AND (HNAPPMNT.transaction_id is not null ) AND HNAPPMNT.TelemedStatus not in('C') AND HNAPPMNT.TelemedStatusACT not in('C','Y') `;
                     /* --AND CONVERT(date, HNAPPMNT.APPOINTMENTDATETIME) = '2025-12-22' --mock */
  }else{ 
    sql_SubWhere = sql_SubWhere;
  }

  const sqlUnified = `
    SELECT DISTINCT TOP 2000
      HNAPPMNT.MAKEDATETIME AS [makedatetime],
      HNAPPMNT.APPOINTMENTNO AS [appointmentno],
      HNAPPMNT.PROCEDURECODE AS [procedurecode],
      HNAPPMNT.CONFIRMSTATUSTYPE AS [confirmstatustype],
      HNAPPMNT.hn AS [hn],      
      ISNULL(HNAPPMNT.VN,'') AS [vn],
      ISNULL(VNPRES.VN,'') AS [vn_press],
      HNAPPMNT.transaction_id AS [transaction_id],
      patientinfo.REF AS [patient_cid],
      PYREXT.IDCARD AS [doctor_cid],
      'แพทย์' AS [doctor_title],
      SSBDatabase.dbo.GetSSBName(PYREXT.FIRSTTHAINAME) AS [doctor_firstname],
      SSBDatabase.dbo.GetSSBName(PYREXT.LASTTHAINAME) AS [doctor_lastname],
      CASE 
        WHEN patientinfo.pname = 'น.ส.' THEN 'นางสาว' 
        WHEN patientinfo.pname = 'น.ช.' THEN 'นาย' 
        WHEN patientinfo.pname = 'น.ญ.' THEN 'นางสาว' 
        ELSE patientinfo.pname  
      END AS [account_title],
      patientinfo.fname AS [first_name],
      patientinfo.lname AS [last_name],
      FORMAT(PATIENT_INFO.Birthdatetime, 'yyyy-MM-dd') AS [birth_date],
      PATIENT_ADDRESS.TEL AS [phone_number],
      '' AS [phone_number_other],
      SSBDatabase.dbo.Province(HNAPPMNT.HN) AS [province],
      SSBDatabase.dbo.Amphoe(HNAPPMNT.HN) AS [district],
      SSBDatabase.dbo.Tambon(HNAPPMNT.HN) AS [sub_district],
      '' AS [road],
      PATIENT_ADDRESS.MOO AS [moo],
      PATIENT_ADDRESS.ADDRESS AS [house_no],
      PATIENT_ADDRESS.POSTALCODE AS [zip_code],
      '' AS [landmark],
      '' AS [lat],
      '' AS [lng],
      FORMAT(HNAPPMNT.APPOINTMENTDATETIME, 'yyyy-MM-dd') AS [appointment_date],
      'Telemedicine' AS [appointment_type_name],
      '10661' AS [hospital_code],
      ClinicName.ClinicName AS [hospital_department_name],
      'โรงพยาบาลสระบุรี' AS [hospital_name],
      'Telemedicine' AS [hospital_room_name],
      FORMAT(HNAPPMNT.APPOINTMENTDATETIME, 'HH:mm') AS [time_start],
      CONVERT(VARCHAR(5), DATEADD(MINUTE, HNAPPMNT.NOMINUTESALLOWANCELATE, HNAPPMNT.APPOINTMENTDATETIME), 108) AS [time_end],
      'patient' AS [require_type],
      '' AS [sub_hospital_name],
      '' AS [sub_hospital_code]
      
    FROM SSBDatabase.dbo.HNAPPMNT
      INNER JOIN SSBDatabase.dbo.PATIENT_INFO ON PATIENT_INFO.HN = HNAPPMNT.HN
      INNER JOIN SSBDatabase.dbo.patientinfo ON patientinfo.HN = HNAPPMNT.HN
      INNER JOIN SSBDatabase.dbo.PYREXT ON HNAPPMNT.APPOINTMENTWITHDOCTOR = PYREXT.PAYROLLNO
      INNER JOIN SSBDatabase.dbo.ClinicName ON ClinicName.CODE = HNAPPMNT.APPOINTMENTWITHCLINIC
      INNER JOIN SSBDatabase.dbo.PATIENT_ADDRESS ON PATIENT_ADDRESS.HN = HNAPPMNT.HN AND PATIENT_ADDRESS.SUFFIX = '1'
      LEFT JOIN SSBDatabase.dbo.VNPRES ON VNPRES.APPOINTMENTNO = HNAPPMNT.APPOINTMENTNO
    WHERE
      HNAPPMNT.PROCEDURECODE='T'   
      ${sql_SubWhere}  -- ใช้จริง
    ${sql_sortBy}
  `;
  /*
    --AND CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, '2025-12-15' ) AND (HNAPPMNT.transaction_id is null OR HNAPPMNT.transaction_id = '') --Mock
    --AND (HNAPPMNT.transaction_id is null OR HNAPPMNT.transaction_id = '') 
    --AND (HNAPPMNT.TelemedStatus is null OR HNAPPMNT.TelemedStatus = '') AND (HNAPPMNT.transaction_id is null OR HNAPPMNT.transaction_id = '')
    --AND CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, @date)
    --AND CONVERT(date, HNAPPMNT.APPOINTMENTDATETIME) < CONVERT(date, Getdate())  --Mock
    --AND CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, Getdate() - 1) --Mock
    --AND ClinicName.ClinicName LIKE '%Tele%'
    --AND CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, '2025-12-04' ) --Mock 28/11/2025               
  */
  console.log('date param:', date);
  console.log('📅 getTelemedPayload SQL:', sqlUnified.replace(/\s+/g, ' '));
  const request = pool.request();
  // ✅ ใส่ date เฉพาะโหมด NEW
  if (modeType === 'NEW') {
    request.input('date', sql.Date, date);
  }
  const result = await request.query(sqlUnified);
  if (!result?.recordset?.length) return [];

  return result.recordset.map(row => {
    const address = {
      province: row.province ?? null,   
      district: row.district ?? null,
      sub_district: row.sub_district ?? null,
      road: row.road ?? '',
      moo: row.moo ?? '',
      house_no: row.house_no ?? '',
      zip_code: row.zip_code ?? '', 
      landmark: row.landmark ?? '',
      lat: row.lat ?? '',
      lng: row.lng ?? ''
    };

    let vn_final = row.vn;
    if(modeType === 'N' || modeType === 'NEW') { //Edit แก้ไขในทุุกกรณ๊
      vn_final == vn_final;    
    }else if(modeType === 'E' || modeType === 'EDIT' ) { //Edit แก้ไขในทุุกกรณ๊
      vn_final = row.vn_press;
    }else if(modeType === 'U' || modeType === 'UPDATE') { //Update  ปรับปรุงเฉพาะ VN ที่ห้องบัตรGenให้หลังAPI ส่งการนัดหมายแล้ว
      vn_final = row.vn_press;    
    }else if(modeType === 'C' || modeType === 'CANCEL') { //Cancel ยกเลิกการนัดหมาย
      vn_final = row.vn_press;
    }else{
      vn_final = vn_final;
    }

    return {
      makedatetime: row.makedatetime,
      appointmentno: row.appointmentno,
      procedurecode: row.procedurecode,
      confirmstatustype: row.confirmstatustype,
      transactionid: row.transaction_id,
      hn: row.hn,
      vn: vn_final ,            
      patient_cid: row.patient_cid,
      account_title: normalizeAccountTitle(row.account_title),
      first_name: row.first_name,
      last_name: row.last_name,
      doctor_cid: row.doctor_cid,
      doctor_title: row.doctor_title,
      doctor_firstname: row.doctor_firstname,
      doctor_lastname: row.doctor_lastname,      
      birth_date: row.birth_date,
      phone_number: extractFirstPhoneNumber(row.phone_number),
      phone_number_other: extractSecondPhoneNumber(row.phone_number),      
      appointment_date: row.appointment_date,
      appointment_type_name: row.appointment_type_name,
      hospital_code: row.hospital_code,
      hospital_name: row.hospital_name,
      hospital_department_name: row.hospital_department_name,      
      hospital_room_name: row.hospital_room_name,
      time_start: row.time_start,
      time_end: row.time_end,
      require_type: 'patient', // row.require_type, 
      address_detail: address
      //address_detail_health_rider: row.require_type === 'rider' ? address : {},
      //sub_hospital_name: row.require_type === 'station' ? row.sub_hospital_name : null,
      //sub_hospital_code: row.require_type === 'station' ? row.sub_hospital_code : null
    };
  });
};

export function extractFirstPhoneNumber(phone) {
  if (typeof phone !== 'string') return '';
  // ✅ แยกเบอร์ด้วยตัวแบ่งที่พบบ่อย เช่น comma, slash, backslash, pipe, semicolon
  const parts = phone.split(/[,/\\|;]+/);
  let firstPart = parts[0] || '';
  // ✅ ลบทุกตัวที่ไม่ใช่ตัวเลขออก เช่น ช่องว่าง, ขีดกลาง, วงเล็บ, ตัวอักษร
  const digitsOnly = firstPart.replace(/\D/g, '');
  return digitsOnly;
}

export function extractSecondPhoneNumber(phone) {
  if (typeof phone !== 'string') return '';
  
  // ✅ แยกเบอร์ด้วยตัวแบ่งที่พบบ่อย เช่น comma, slash, backslash, pipe, semicolon
  const parts = phone.split(/[,/\\|;]+/);
  let secondPart = parts[1] || ''; // เลือกเบอร์ลำดับที่ 2 ถ้ามี
  
  // ✅ ลบทุกตัวที่ไม่ใช่ตัวเลขออก เช่น ช่องว่าง, ขีดกลาง, วงเล็บ, ตัวอักษร
  const digitsOnly = secondPart.replace(/\D/g, '');
  return digitsOnly;
}

export function normalizeAccountTitle(pname) {
  if (['นักโทษชาย', 'น.ข.'].includes(pname)) return 'นาย';
  if (['นักโทษหญิง', 'น.ญ.'].includes(pname)) return 'นางสาว';
  return pname;
}

