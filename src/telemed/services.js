import { getPool } from '../common/db.js';
import sql from 'mssql';

export const getTelemedPayload = async (date) => {
  const pool = await getPool();

  const sqlUnified = `
    SELECT DISTINCT TOP 2
      HNAPPMNT.APPOINTMENTNO AS [appointmentno],
      HNAPPMNT.PROCEDURECODE AS [procedurecode],
      HNAPPMNT.CONFIRMSTATUSTYPE AS [confirmstatustype],
      HNAPPMNT.hn AS [hn],      
      ISNULL(HNAPPMNT.VN,'') AS [vn],
      HNAPPMNT.transaction_id AS [transaction_id],
      patientinfo.REF AS [patient_cid],
      PYREXT.IDCARD AS [doctor_cid],
      'แพทย์' AS [doctor_title],
      SSBDatabase.dbo.GetSSBName(PYREXT.FIRSTTHAINAME) AS [doctor_firstname],
      SSBDatabase.dbo.GetSSBName(PYREXT.LASTTHAINAME) AS [doctor_lastname],
      patientinfo.pname AS [account_title],
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
    WHERE
      CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, @date)
      --CONVERT(date, HNAPPMNT.APPOINTMENTDATETIME) < CONVERT(date, Getdate())  --Mock
      --CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, Getdate() - 1) --Mock
      --AND ClinicName.ClinicName LIKE '%Tele%'
      --CONVERT(date, HNAPPMNT.MAKEDATETIME) = CONVERT(date, '2025-11-19' ) --Mock 28/11/2025
      AND HNAPPMNT.PROCEDURECODE='T'       
  `;
  //console.log('date param:', date);
  //console.log('📅 getTelemedPayload SQL:', sqlUnified.replace(/\s+/g, ' '));
  const result = await pool.request().input('date', sql.Date, date).query(sqlUnified);
  if (!result?.recordset?.length) return [];

  return result.recordset.map(row => {
    const address = {
      province: row.province ?? null,   //MOCK
      district: row.district ?? null,
      sub_district: row.sub_district ?? null,
      road: row.road ?? '',
      moo: row.moo ?? '',
      house_no: row.house_no ?? '',
      zip_code: row.zip_code ?? '', //MOCK
      landmark: row.landmark ?? '',
      lat: row.lat ?? '',
      lng: row.lng ?? ''
    };

    return {
      appointmentno: row.appointmentno,
      procedurecode: row.procedurecode,
      confirmstatustype: row.confirmstatustype,
      transactionid: row.transaction_id,
      hn: row.hn,
      vn: row.vn ,            
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
      phone_number_other: '',      
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
  // แยกเบอร์ด้วย comma หรือช่องว่าง
  const parts = phone.split(/[, ]+/);
  // เอาเบอร์แรก แล้วกรองเฉพาะตัวเลข
  const first = parts[0] || '';
  return first.replace(/\D/g, '');
}

export function normalizeAccountTitle(pname) {
  if (['นักโทษชาย', 'น.ข.'].includes(pname)) return 'นาย';
  if (['นักโทษหญิง', 'น.ญ.'].includes(pname)) return 'นางสาว';
  return pname;
}

