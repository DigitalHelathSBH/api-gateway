import 'dotenv/config';
import sql from 'mssql';

const cfg = {
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 10, min: 1, idleTimeoutMillis: 30000 }
};

let pool;
async function getPool() { pool ??= await sql.connect(cfg); return pool; }

export async function fetchPendingMonths(limit = 10) {
  const p = await getPool();
  const res = await p.request().input('limit', sql.Int, limit).query(`
    SELECT TOP (@limit) processing_month
    FROM dbo.ProcessingMonthQueue WITH (READPAST, ROWLOCK)
    WHERE status='PENDING'
    ORDER BY created_at DESC
  `);
  return res.recordset.map(r => r.processing_month);
}

export async function markMonthSent(month) {
  const p = await getPool();
  await p.request().input('m', sql.VarChar(7), month).query(`
    UPDATE dbo.ProcessingMonthQueue
    SET status='SENT', updated_at=SYSUTCDATETIME()
    WHERE processing_month=@m
  `);
}

export async function saveResponse(month, httpStatus, jsonStr) {
  const p = await getPool();
  await p.request()
    .input('m', sql.VarChar(7), month)
    .input('s', sql.Int, httpStatus)
    .input('j', sql.NVarChar(sql.MAX), jsonStr)
    .query(`
      INSERT INTO dbo.SBHoncloudResponses(processing_month, http_status, response_json, created_at)
      VALUES(@m, @s, @j, SYSUTCDATETIME())
    `);
}
