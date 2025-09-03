import { handleVitalRequestDate  } from './controller.js';
import { vitalRequestDateSchema } from './schema.js';

export default async function vitalRoutes(fastify, opts) {
  //Receive and Send    2Way
  fastify.post('/vital/bydate', { schema: vitalRequestDateSchema }, handleVitalRequestDate);

}