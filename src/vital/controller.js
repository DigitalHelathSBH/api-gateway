import { getVitalsPayload ,updateStatusvitalBatch  } from './services.js';
import { isValidDateString, getTokenPrepare, sendToOut ,stripHtmlTags} from './external.js';
import { getPool } from '../common/db.js';

function validateRequestKeys(body, allowedKeys) {
  const invalidKeys = Object.keys(body).filter(k => !allowedKeys.includes(k));
  return invalidKeys;
}

export async function handleVitalRequestDate(request, reply) {
  const response = {
    status_code: '201',
    statusDesc: 'Success.',
    Payload: []
  };

  const body = request.body || {};
  const { startDate, endDate } = body;

  const invalidKeys = validateRequestKeys(body, ['startDate', 'endDate']);
  if (invalidKeys.length > 0) {
    reply.status(400).send({ ...response, status_code: '400', statusDesc: `Invalid Fields: ${invalidKeys.join(', ')}` });
    return;
  }

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    reply.status(400).send({ ...response, status_code: '400', statusDesc: 'Invalid Date Format' });
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    reply.status(400).send({ ...response, status_code: '401', statusDesc: 'Invalid Date Range' });
    return;
  }

  try {

    const payloadFull = await getVitalsPayload(startDate, endDate);
    if (!Array.isArray(payloadFull) || payloadFull.length === 0) {
      reply.status(404).send({ ...response, status_code: '404', statusDesc: 'Not Found Data' });
      return;
    }      

    const tokenRec = await getTokenPrepare('0');
    if (!tokenRec.access_token) {
      reply.status(403).send({ ...response, status_code: '403', statusDesc: 'Invalid Token!(Controller)' });
      return;
    }
    const payload = payloadFull[0]; /* ตัดตัวArrayนอกสุุดออกเพื่อให้ได้ตามspec */
    //console.log(payload);
    let outResponseRaw = await sendToOut(payload, tokenRec);
    const outResponse = stripHtmlTags(outResponseRaw);
    if (String(outResponse.status_code) === '201') {
      await updateStatusvitalBatch(payloadFull);
      const pool = await getPool();
      console.log(`✅ Auto update complete`);
    }else{
      console.warn(`⚠️ Send failed: ${outResponse.status_code} - ${outResponse.statusDesc}`);
    }

    response.status_code = outResponse.status_code;
    response.statusDesc = outResponse.statusDesc;
    //response.Payload = response.status_code === '201' ? [] : payload;
    //response.Payload = payload;

    reply.status(201).send(response);
  } catch (err) {
    console.error('Vital Error:', err.message);
    const code = ['ETIMEOUT', 'ECONNREFUSED'].includes(err.code) ? '503' : '500';
    const desc = code === '503' ? 'Database Unavailable' : 'Server Error...';
    reply.status(Number(code)).send({ ...response, status_code: code, statusDesc: desc });
  }
}
