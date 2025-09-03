import { getPool } from '../common/db.js';

export async function findAll() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP 10 HN, dbo.GetFullNameWithTitle(HN) as FullName FROM dbo.PATIENT_REF
  `);
  return result.recordset;
}

export async function findByHn(hn) {
  const pool = await getPool();
  const result = await pool.request()
    .input('hn', hn)
    .query(`SELECT TOP 1 HN, dbo.GetFullNameWithTitle(HN) as FullName FROM dbo.PATIENT_REF WHERE HN=@hn`);
  return result.recordset[0];
}

export async function existsRefCid(cid) {
  const pool = await getPool();
  const result = await pool.request()
    .input('cid', cid)
    .query(`SELECT COUNT(*) AS num FROM dbo.PATIENT_REF WHERE REF=@cid AND REFTYPE='01'`);
  return Number(result.recordset?.[0]?.num ?? 0) > 0;
}

export async function findDetailByCid(cid) {
  const pool = await getPool();
  const result = await pool.request()
    .input('cid', cid)
    .query(`
      SELECT PR.REF AS cid, dbo.GetPname(PR.HN) as pname,
             dbo.GetNameWithoutTitle(PN.FIRSTNAME) as fname,
             dbo.GetNameWithoutTitle(PN.LASTNAME) as lname,
             PR.HN as hn, PA.TEL as tel,
             CASE WHEN PI.SEX=1 THEN N'ชาย' WHEN PI.SEX=2 THEN N'หญิง' END as gender,
             REPLACE(CONVERT(varchar, PI.BIRTHDATETIME,111),'/','-') as birthday,
             PA.ADDRESS as address, ISNULL(PA.MOO,'') as moo,
             dbo.Tambon(PR.HN) as tambon, dbo.Amphoe(PR.HN) as ampur, dbo.Province(PR.HN) as chagwat
      FROM dbo.PATIENT_REF PR
      JOIN dbo.PATIENT_INFO PI ON PR.HN=PI.HN
      LEFT JOIN dbo.PATIENT_NAME PN ON PR.HN=PN.HN AND PN.SUFFIX=0
      LEFT JOIN dbo.PATIENT_ADDRESS PA ON PR.HN=PA.HN AND PA.SUFFIX=1
      WHERE PR.REF=@cid AND PR.REFTYPE='01'
    `);
  return result.recordset[0];
}

export async function findVisitRow({ vn, vstdate, clinicId }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('vn', vn)
    .input('vstdate', vstdate)
    .input('clinicId', clinicId)
    .query(`
      SELECT 
          VNPRES.VN,
          CONVERT(varchar, VNPRES.VISITDATE, 111) as vsdate,
          CONVERT(varchar, REGINDATETIME, 108) as vstime,
          RightCodeView.RightName,
          VNPRES.RIGHTCODE,
          ClinicName.ClinicName,
          N'มารับบริการเอง' as type,
          CloseVSTypeN,
          dbo.GetUserFullName(DOCTOR) as doctor,
          BODYWEIGHT,
          HEIGHT,
          TEMPERATURE,
          CONVERT(varchar,BPHIGH)+'/'+CONVERT(varchar,BPLOW) as bps,
          RESPIRERATE as breathing,
          PULSERATE AS pulse,
          VNPRES.SUFFIX
      FROM dbo.VNPRES
      LEFT JOIN RightCodeView  ON VNPRES.RIGHTCODE = RightCodeView.RIGHTCODE
      LEFT JOIN ClinicName     ON VNPRES.CLINIC = ClinicName.CODE
      LEFT JOIN CloseVisitType ON VNPRES.CLOSEVISITTYPE = CloseVisitType.CloseVSType
      JOIN VNMST               ON VNPRES.VN = VNMST.VN AND VNPRES.VISITDATE = VNMST.VISITDATE
      WHERE VNPRES.VN = @vn 
        AND VNPRES.VISITDATE = @vstdate
        AND VNPRES.CLINIC = @clinicId
        AND (VNPRES.CLOSEVISITTYPE NOT IN (SELECT CloseVisitType FROM Saraburi.dbo.CloseVisitType) 
             OR VNPRES.CLOSEVISITTYPE IS NULL)
    `);

  return result.recordset[0];
}

export async function getAllergy(hn) {
  const pool = await getPool();
  const result = await pool.request()
    .input('hn', hn)
    .query(`
      SELECT A.HN, NULL AS category,
             RIGHT(ISNULL(S.ENGLISHNAME, S.THAINAME), LEN(ISNULL(S.ENGLISHNAME,S.THAINAME)) - 1) AS name
      FROM dbo.PATIENT_ALLERGIC A
      INNER JOIN dbo.STOCK_MASTER S ON A.MEDICINE = S.STOCKCODE
      WHERE A.HN = @hn
      UNION
      SELECT A1.HN,
             RIGHT(ISNULL(main.ENGLISHNAME, main.THAINAME), LEN(ISNULL(main.ENGLISHNAME, main.THAINAME)) - 1)
             + CASE WHEN ISNULL(sub.ENGLISHNAME, sub.THAINAME) IS NOT NULL 
                    THEN N' -> ' + RIGHT(ISNULL(sub.ENGLISHNAME, sub.THAINAME), LEN(ISNULL(sub.ENGLISHNAME, sub.THAINAME)) - 1) 
                    ELSE '' END AS category,
             NULL AS name
      FROM dbo.PATIENT_ALLERGIC A1
      INNER JOIN dbo.SYSCONFIG main ON A1.PHARMACOINDEX = main.CODE AND main.CTRLCODE = 20025
      LEFT JOIN dbo.SYSCONFIG sub
             ON A1.PHARMACOINDEX + SPACE(10 - LEN(A1.PHARMACOINDEX)) + A1.PHARMACOINDEXSUBCLASS = sub.CODE 
            AND sub.CTRLCODE = 20026
      WHERE A1.HN = @hn
    `);

  return result.recordset.map(x => ({
    category: x.category ?? null,
    name: x.name ?? null,
    symptom: null,
    seriousness: null
  }));
}

export async function getDiagnosis({ vn, vsdate, suffix }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('vn', vn)
    .input('vsdate', vsdate)
    .input('suffix', suffix)
    .query(`
      SELECT VNDIAG.ICDCODE, VNDIAG.TYPEOFTHISDIAG, 
             ICD_MASTER.THAINAME, ICD_MASTER.ENGLISHNAME
      FROM dbo.VNDIAG
      JOIN dbo.ICD_MASTER ON VNDIAG.ICDCODE = ICD_MASTER.ICDCODE
      WHERE VN = @vn AND VISITDATE = @vsdate AND SUFFIX = @suffix
        AND VNDIAG.ICDCODE NOT LIKE 'B%'
      ORDER BY SUBSUFFIX
    `);

  return result.recordset.map(x => ({
    icd10: x.ICDCODE,
    icd10NameTH: x.THAINAME,
    icd10NameENG: x.ENGLISHNAME,
    type: x.TYPEOFTHISDIAG
  }));
}

export async function getDrug({ vn, vsdate, suffix }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('vn', vn)
    .input('vsdate', vsdate)
    .input('suffix', suffix)
    .query(`
      SELECT drugname, [Usage] AS usageTxt, qty, amt
      FROM dbo.VNDrugUsage
      WHERE VN = @vn AND VISITDATE = @vsdate AND SUFFIX = @suffix
        AND (typeofcharge <> '3' OR typeofcharge IS NULL)
    `);

  return result.recordset.map(x => ({
    name: x.drugname,
    strength: null,
    shortlist: x.usageTxt,
    quantity: x.qty,
    sum_price: x.amt
  }));
}

export async function getLab({ hn, vsdate }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('hn', hn)
    .input('vsdate', vsdate)
    .query(`
      SELECT lab.ICD10TM as LabCode,
             main.LabName,
             main.result,
             main.NormalLimit
      FROM dbo.GetLabResult(@hn, @vsdate, @vsdate) as main
      JOIN MOPH.dbo.Ref_LabICD10TM lab on main.labcode = lab.labcode
      WHERE edmst = 3
      ORDER BY SSBLabCode
    `);

  return result.recordset.map(x => ({
    lab_items_code: x.LabCode,
    lab_items_name: x.LabName,
    lab_order_result: x.result,
    lab_items_normal_value: x.NormalLimit
  }));
}

export async function getProcedure({ vn, vsdate, suffix }) {
  const pool = await getPool();
  const result = await pool.request()
    .input('vn', vn)
    .input('vsdate', vsdate)
    .input('suffix', suffix)
    .query(`
      SELECT treatmentname, VNTREAT.AMT, QTY
      FROM dbo.VNTREAT
      JOIN dbo.TreatmentView ON VNTREAT.TREATMENTCODE = TreatmentView.treatmentcode
      WHERE VN = @vn AND VISITDATE = @vsdate AND SUFFIX = @suffix
        AND CXLBYUSERCODE IS NULL
    `);

  return result.recordset.map(x => ({
    procedure_name: x.treatmentname,
    procedure_qty: x.QTY,
    procedure_price: x.AMT
  }));
}