import { getVitalsPayload } from './services.js';
import { isValidDateString, getTokenTest, sendToOut } from './external.js';

export async function handleVitalRequestDate(request, reply) {
  const response = {
    status_code: '200',
    statusDesc: 'Success.',
    Payload: []
  };

  const body = request.body || {};
  const { startDate, endDate } = body;

  // 🔒 ตรวจสอบว่าไม่มี key เกินจากที่ schema กำหนด
  const allowedKeys = ['startDate', 'endDate'];
  const invalidKeys = Object.keys(body).filter(k => !allowedKeys.includes(k));
  if (invalidKeys.length > 0) {
    reply.status(400).send({
      ...response,
      status_code: '400',
      statusDesc: `Invalid Fields: ${invalidKeys.join(', ')}`,
      Payload: []
    });
    return;
  }

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    reply.status(400).send({
      ...response,
      status_code: '400',
      statusDesc: 'Invalid Date Format',
      Payload: []
    });
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    reply.status(400).send({
      ...response,
      status_code: '401',
      statusDesc: 'Invalid Date Range',
      Payload: []
    });
    return;
  }

  try {
    const payload = await getVitalsPayload(startDate, endDate);
    if (!payload.length) {
      reply.status(404).send({
        ...response,
        status_code: '404',
        statusDesc: 'Not Found Data',
        Payload: []
      });
      return;
    }

    const tokenRec = await getTokenTest();
    if (!tokenRec.token) {
      reply.status(403).send({
        ...response,
        status_code: '403',
        statusDesc: 'Invalid Token!',
        Payload: []
      });
      return;
    }

    const outResponse = await sendToOut(payload, tokenRec.token);
    response.status_code = outResponse.status_code;
    response.statusDesc = outResponse.statusDesc;

    response.Payload = response.status_code === '200' ? [] : payload;

    reply.status(200).send(response);
  } catch (err) {
    console.error('Vital Error:', err.message);
    const code = ['ETIMEOUT', 'ECONNREFUSED'].includes(err.code) ? '503' : '500';
    const desc = code === '503' ? 'Database Unavailable' : 'Server Error...';
    reply.status(Number(code)).send({
      ...response,
      status_code: code,
      statusDesc: desc,
      Payload: []
    });
  }
}