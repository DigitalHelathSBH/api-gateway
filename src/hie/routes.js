import { getPatients, getPatientByHn, findPatientByCid, getVisit } from './controller.js';
import { patientSchema, patientByHnSchema, patientFindByCidSchema, visitSchema } from './schema.js';

export default async function patientRoutes(app) {
  app.get('/ping', async () => ({ ok: true, message: 'pong' }));

  app.get('/patients', { schema: patientSchema }, getPatients);
  app.get('/patients/:hn', { schema: patientByHnSchema }, getPatientByHn);

  app.post('/patients', { schema: patientFindByCidSchema }, findPatientByCid);

  app.post('/visits', { schema: visitSchema }, getVisit);
}
