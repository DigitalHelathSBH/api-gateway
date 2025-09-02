import { handleVitalRequestDate, handleVitalRequestDateHn } from './controller.js';
import { vitalRequestDateSchema, vitalRequestDateHnSchema } from './schema.js';

export default async function vitalRoutes(fastify, opts) {
  //Receive and Send    2Way
  fastify.post('/vital/bydate', { schema: vitalRequestDateSchema }, handleVitalRequestDate);
  fastify.post('/vital/byhn', { schema: vitalRequestDateHnSchema }, handleVitalRequestDateHn);

}