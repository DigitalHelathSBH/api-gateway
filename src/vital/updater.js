// src/vital/updater.js
import { getPool } from '../common/db.js';

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
    const pool = await getPool();
    const result = await pool.request().query(query);
    console.log(`✅ Batch update complete. Rows affected: ${result.rowsAffected}`);
  } catch (err) {
    console.error('❌ Batch update failed:', err.message);
    throw err;
  }
}