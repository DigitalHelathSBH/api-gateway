import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASS,
  server: process.env.SQLSERVER_HOST,
  port: Number(process.env.SQLSERVER_PORT || 1433),
  database: process.env.SQLSERVER_DB,
  options: { trustServerCertificate: true, enableArithAbort: true },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

let pool;
export async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}
export { sql };