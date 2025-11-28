import { patientsRequestHnSchema } from './schema.js';
import { handlePatientsRequest } from './controller.js';
 
export { patientsRequestHnSchema };
 
export default async function TelemedRoutes(fastify, opts) {
  //fastify.post('/POST/telemed/appointment/bydate', { schema: patientsRequestHnSchema }, handlePatientsRequest);
  fastify.post('/telemed/new/appointment', { schema: patientsRequestHnSchema }, handlePatientsRequest);
  
}