//import { isValidDateString} from '../common/utils.js';
import { getVitalsPayload } from './services.js';
import { isValidDateString, getToken, getTokenTest, sendToOut} from './external.js';

export async function handleVitalRequest(request, reply) {
  const response = {
    status_code: '200',
    statusDesc: 'Success.',
    Payload: {}
  };

  const { startDate, endDate } = request.body || {};

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

    //const tokenRec = await getToken();
    const tokenRec = await getTokenTest();
    if (!tokenRec.token) {
      reply.status(403).send({ ...response, status_code: '403', statusDesc: 'Invalid Token!' });
      return;
    }

    const outResponse = await sendToOut(payload, tokenRec.token);
    response.status_code = outResponse.status_code;
    response.statusDesc = outResponse.statusDesc;
    response.Payload = payload;

    reply.status(200).send(response);
  } catch (err) {
    console.error('Vital Error:', err.message);
    const code = ['ETIMEOUT', 'ECONNREFUSED'].includes(err.code) ? '503' : '500';
    const desc = code === '503' ? 'Database Unavailable' : 'Server Error...';
    reply.status(Number(code)).send({ ...response, status_code: code, statusDesc: desc });
  }
}