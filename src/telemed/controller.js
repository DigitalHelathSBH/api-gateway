import { getTelemedPayload  } from './services.js';
//import { isValidDateString, getTokenPrepare ,stripHtmlTags} from './external.js';
//import { getPool } from '../common/db.js';

function validateRequestKeys(body, allowedKeys) {
  const invalidKeys = Object.keys(body).filter(k => !allowedKeys.includes(k));
  return invalidKeys;
}

export async function handlePatientsRequest(request, reply) {
  const response = {
    status_code: '200',
    statusDesc: 'Success.',
    Payload: []
  };

  const body = request.body || {};
  const { date } = body;
  console.log('Patients Request Body:', body);
  try {
    const payloadFull = await getTelemedPayload(date);

    if (!Array.isArray(payloadFull) || payloadFull.length === 0) {
      reply.status(404).send({ ...response, status_code: '404', statusDesc: 'Not Found Data' });
      return;
    }

    const payload = payloadFull;

    // ✅ พิมพ์ JSON ออก console
    console.log('📦 JSON Payload:', JSON.stringify(payload, null, 2));

    // ✅ ส่งกลับใน response object
    response.Payload = payload;

    reply.status(200).send(response);

  } catch (err) {
    console.error('Patients Error:', err.message);
    const code = ['ETIMEOUT', 'ECONNREFUSED'].includes(err.code) ? '503' : '500';
    const desc = code === '503' ? 'Database Unavailable' : 'Server Error...';
    reply.status(Number(code)).send({ ...response, status_code: code, statusDesc: desc });
  }
}