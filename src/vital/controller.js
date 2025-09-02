import { getVitalsPayload, getVitalsPayloadByHn ,updateStatusvitalBatch  } from './services.js';
import { isValidDateString, getTokenTest, sendToOut } from './external.js';
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
    const payload = await getVitalsPayload(startDate, endDate);
    if (!payload.length) {
      reply.status(404).send({ ...response, status_code: '404', statusDesc: 'Not Found Data' });
      return;
    }

    const tokenRec = await getTokenTest();
    if (!tokenRec.token) {
      reply.status(403).send({ ...response, status_code: '403', statusDesc: 'Invalid Token!' });
      return;
    }
    //console.log(payload);
    const outResponse = await sendToOut(payload, tokenRec.token);
    if (String(outResponse.status_code) === '201') {
      await updateStatusvitalBatch(payload);
      const pool = await getPool(); // ✅ ต้องมี

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

export async function handleVitalRequestDateHn(request, reply) {
  const response = {
    status_code: '201',
    statusDesc: 'Success.',
    Payload: []
  };

  const body = request.body || {};
  const { startDate, endDate, hn } = body;

  const invalidKeys = validateRequestKeys(body, ['startDate', 'endDate', 'hn']);
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
    const payload = await getVitalsPayloadByHn(startDate, endDate, hn);
    if (!payload.length) {
      reply.status(404).send({ ...response, status_code: '404', statusDesc: 'Not Found Data' });
      return;
    }

    const tokenRec = await getTokenTest();
    if (!tokenRec.token) {
      reply.status(403).send({ ...response, status_code: '403', statusDesc: 'Invalid Token!' });
      return;
    }

    const outResponse = await sendToOut(payload, tokenRec.token);
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
