import { getPool } from '../common/db.js';
import sql from 'mssql';

export const getVitalsPayload = async (startDate, endDate) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(
`SELECT TOP 10 saintmed.ip,saintmed.vn,saintmed.datetime,saintmed.weight,saintmed.height
  ,saintmed.bmi,saintmed.temperature,saintmed.systolic,saintmed.diastolic,saintmed.pulse
  ,saintmed.updatedate,saintmed.spo2,saintmed.suffix,status,isnull(saintmed.statusvital,'0') as statusvital
  ,VNMST.hn AS [hn]
FROM SSBDatabase.dbo.saintmed
INNER JOIN SSBDatabase.dbo.VNMST
  ON VNMST.vn = saintmed.vn
  AND CONVERT(DATE, VNMST.VISITDATE) = CONVERT(DATE, LEFT(saintmed.datetime, 8))
WHERE (statusvital is null OR statusvital = '' OR statusvital = '0') 
AND CONVERT(DATE, LEFT(datetime, 8)) BETWEEN @startDate AND @endDate
ORDER BY datetime DESC;
`);

    if (!result.recordset?.length) {
      console.warn('⚠️ No vitals data found for given date range.');
      return [];
    }

    return result.recordset.map(med => ({
      hn: med.hn ?? 'ไม่พบ HN',
      vn: med.vn, 
      datetime: med.datetime,
      ip: med.ip,
      macAddress: med.ip ?? null,
      deviceId : null,
   results: [
        { name: 'WEIGHT', value: med.weight ?? null, valueType: 'float', unit: 'kg' },
        { name: 'HEIGHT', value: med.height ?? null, valueType: 'float', unit: 'cm' },
        { name: 'BMI', value: med.bmi ?? null, valueType: 'float', unit: '' },
        { name: 'TEMPERATURE', value: med.temperature ?? null, valueType: 'float', unit: '°C' },
        { name: 'SYSTOLIC', value: med.systolic ?? null, valueType: 'integer', unit: 'mmHg' },
        { name: 'DIASTOLIC', value: med.diastolic ?? null, valueType: 'integer', unit: 'mmHg' },
        { name: 'PULSE', value: med.pulse ?? null, valueType: 'integer', unit: 'bpm' },
        { name: 'SPO2', value: med.spo2 ?? null, valueType: 'integer', unit: '%' },
      ]
    }));

  } catch (err) {
    console.error('❌ getVitalsPayload error:', err.message);
    throw err;
  }
};

export async function updateStatusvitalBatch(payload) {
  if (!Array.isArray(payload) || payload.length === 0) return;

  const sanitize = str => str.replace(/'/g, "''");

  const conditions = payload
    .filter(item => item.vn && item.datetime)
    .map(item => `(vn = '${sanitize(item.vn)}' AND datetime = '${sanitize(item.datetime.trim())}')`)
    .join(' OR ');

  const query = `
    UPDATE SSBDatabase.dbo.saintmed
    SET statusvital = '1'
    WHERE ${conditions}
  `;

  try {
    const pool = await getPool(); // ✅ สร้างในนี้
    const result = await pool.request().query(query);
    console.log(`✅ Batch update complete. Rows affected: ${result.rowsAffected}`);
  } catch (err) {
    console.error('❌ Batch update failed:', err.message);
    throw err;
  }
}