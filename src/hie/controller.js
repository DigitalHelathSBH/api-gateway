import * as patientService from './services.js';

// GET /patients
export async function getPatients(req, reply) {
  const patients = await patientService.findAll();
  return { ok: true, data: patients };
}

// GET /patients/:hn
export async function getPatientByHn(req, reply) {
  const { hn } = req.params;
  const patient = await patientService.findByHn(hn);
  if (!patient) return reply.code(404).send({ ok: false, error: 'Not found' });
  return { ok: true, data: patient };
}

// POST /patients (by cid + hospcode)
export async function findPatientByCid(req, reply) {
  const { hospcode, cid } = req.body ?? {};
  let patient = {};

  if (!hospcode || hospcode !== '10661') {
    return { statusCode: '501', statusDesc: 'Error Hospcode', patient };
  }
  if (!cid) {
    return { statusCode: '500', statusDesc: 'Error Data', patient };
  }

  const exists = await patientService.existsRefCid(cid);
  if (!exists) {
    return { statusCode: '404', statusDesc: 'Not Found Data', patient };
  }

  const p = await patientService.findDetailByCid(cid);
  if (!p) {
    return { statusCode: '404', statusDesc: 'Not Found Data', patient };
  }

  patient = {
    cid: p.cid, pname: p.pname, fname: p.fname, lname: p.lname, hn: p.hn, tel: p.tel,
    gender: p.gender, birthday: p.birthday, address: p.address, moo: p.moo ?? '',
    tambon: p.tambon, ampur: p.ampur, chagwat: p.chagwat
  };

  return { statusCode: '200', statusDesc: 'Success', patient };
}

// POST /visits
export async function getVisit(req, reply) {
  const { cid, hn, vn, vstdate, hospcode, clinicId } = req.body ?? {};
  const visit = {};

  if (!hospcode || hospcode !== '10661') {
    return { statusCode: '501', statusDesc: 'Error Hospcode', visit };
  }
  if (!vn) {
    return { statusCode: '500', statusDesc: 'Error Data', visit };
  }

  try {
    const hasRef = cid ? await patientService.existsRefCid(cid) : true;
    if (!hasRef) return { statusCode: '404', statusDesc: 'Not Found Data', visit };

    const v = await patientService.findVisitRow({ vn, vstdate, clinicId });
    if (!v) return { statusCode: '404', statusDesc: 'Not Found Data', visit };

    const [allergy, diagnosis, drug, lab, procedure] = await Promise.all([
      patientService.getAllergy(hn),
      patientService.getDiagnosis({ vn: v.VN, vsdate: v.vsdate, suffix: v.SUFFIX }),
      patientService.getDrug({ vn: v.VN, vsdate: v.vsdate, suffix: v.SUFFIX }),
      patientService.getLab({ hn, vsdate: v.vsdate }),
      patientService.getProcedure({ vn: v.VN, vsdate: v.vsdate, suffix: v.SUFFIX })
    ]);

    let bmi = null;
    if (v.BODYWEIGHT > 0 && v.HEIGHT > 0) {
      bmi = Number((v.BODYWEIGHT / Math.pow(v.HEIGHT / 100, 2)).toFixed(1));
    }

    return {
      statusCode: '200',
      statusDesc: 'Success',
      visit: {
        cid, hn, vn,
        vsdate: v.vsdate,
        vstime: v.vstime,
        coverage: v.RightName,
        coverageNo: v.RIGHTCODE,
        division: v.ClinicName,
        type: v.type,
        statusVisit: v.CloseVSTypeN,
        doctor: v.doctor,
        weight: v.BODYWEIGHT,
        height: v.HEIGHT,
        temperature: v.TEMPERATURE,
        bps: v.bps,
        breathing: v.breathing,
        pulse: v.pulse,
        bmi,
        allergy, diagnosis, drug, lab, procedure
      }
    };
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ statusCode: '500', statusDesc: err.message, visit });
  }
}
