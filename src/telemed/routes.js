import { patientsRequestHnSchema } from './schema.js';
import { handlePatientsRequest } from './controller.js';
//import { testTelemedManual } from './telemedTimer.js';

export default async function TelemedRoutes(fastify, opts) {
  // route เดิม
  fastify.post('/telemed/new/appointment', { schema: patientsRequestHnSchema }, handlePatientsRequest);

  // route ใหม่สำหรับ manual test
 /* 
  fastify.post('/telemed/test', async (request, reply) => {
    const { date } = request.body;
    const result = await testTelemedManual(date);
    return reply.send(result);
  });
  */
}
