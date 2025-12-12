import { patientsRequestHnSchema } from './schema.js';
import { handlePatientsRequest } from './controller.js';

export default async function TelemedRoutes(fastify, opts) {
  // route เดิม
  fastify.post('/telemed/new/appointment', { schema: patientsRequestHnSchema }, handlePatientsRequest);
}
