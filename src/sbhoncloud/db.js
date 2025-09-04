import { getPool, sql } from '../common/db.js';

export async function fetchFireList() {
  const pool = await getPool();
  const q = `
    SELECT 
      Register.EmpID as EMPID,
      SSBDatabase.dbo.GetSSBName(PYREXT.FIRSTTHAINAME)+' '+SSBDatabase.dbo.GetSSBName(PYREXT.LASTTHAINAME) as USERNAME,
      REPLACE(section.ThaiName,'(????)','') as SECTIONNAME,
      Position.PositionName as POSITIONNAME,
      FIRE.call
    FROM Saraburi.dbo.FIRE
    JOIN Saraburi.dbo.Register ON FIRE.EmpID = Register.EmpID
    LEFT JOIN SSBDatabase.dbo.sectioncode section ON Register.Section = section.Code
    LEFT JOIN SSBDatabase.dbo.PositionView Position ON Register.nPosition = Position.PositionCode
    LEFT JOIN SSBDatabase.dbo.PYREXT PYREXT ON PYREXT.PAYROLLNO = FIRE.EmpID
    WHERE Register.nDate = CONVERT(date, GETDATE())
      AND nPeriod = (
        SELECT CASE
          WHEN CONVERT(time, GETDATE()) BETWEEN '08:30:00' AND '16:30:59' THEN 1
          WHEN CONVERT(time, GETDATE()) BETWEEN '16:31:00' AND '23:59:59' THEN 2
          ELSE 3
        END
      )
    ORDER BY PYREXT.FIRSTTHAINAME
  `;
  const rs = await pool.request().query(q);

  const list = rs.recordset.map(r => ({
    EMPID: r.EMPID,
    USERNAME: r.USERNAME,
    SECTIONNAME: r.SECTIONNAME,
    POSITIONNAME: r.POSITIONNAME,
    CALL: r.call
  }));
  return list;
}

export async function insertApiLog(ip) {
  const pool = await getPool();
  // host เดิมใน PHP เขียนค่าคงที่ไว้:
  const host = 'http://10.0.120.13/covid_api/SBHOnCloudFIRE.php';
  const q = `
    INSERT INTO Saraburi.dbo.API_log (IP, Makedate, apiwork, host)
    VALUES (@ip, GETDATE(), 'FIRE OnCloud', @host)
  `;
  await pool.request()
    .input('ip', sql.VarChar(64), ip || '')
    .input('host', sql.VarChar(255), host)
    .query(q);
}
