import { getPool } from '../common/db.js';
import sql from 'mssql';

export const getVitalsPayload = async (startDate, endDate) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(
`SELECT TOP 10 ip,vn,datetime,weight,height
,bmi,temperature,systolic,diastolic,pulse
,updatedate,spo2,suffix,status,isnull(statusvital,'0') as statusvital,
  (
    SELECT TOP 1 VNMST_SUBQRY.hn
    FROM SSBDatabase.dbo.VNMST VNMST_SUBQRY
    WHERE VNMST_SUBQRY.vn = saintmed.vn
    ORDER BY VNMST_SUBQRY.VISITDATE DESC
  ) AS [hn]
FROM SSBDatabase.dbo.saintmed
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
      macAddress: med.macAddress ?? null,
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

export const getVitalsPayloadByHn = async (startDate, endDate, hn) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .input('hn', sql.VarChar, hn)
      .query(`
        SELECT saintmed.*
        FROM SSBDatabase.dbo.saintmed
        WHERE (statusvital is null OR statusvital = '' OR statusvital = '0') 
        AND  CONVERT(DATE, LEFT(datetime, 8)) BETWEEN @startDate AND @endDate
          AND EXISTS (
            SELECT 1 FROM SSBDatabase.dbo.VNMST
            WHERE VNMST.vn = saintmed.vn AND VNMST.hn = @hn
          )
        ORDER BY datetime DESC;
        --5021956
      `);

    if (!result.recordset?.length) {
      console.warn(`⚠️ No vitals data found for HN: ${hn} in given date range.`);
      return [];
    }

    return result.recordset.map(med => ({
      hn,
      vn: med.vn, 
      datetime: med.datetime,
      ip: med.ip,
      macAddress: med.macAddress ?? null,
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
    console.error(`❌ getVitalsPayloadByHn error for HN ${hn}:`, err.message);
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