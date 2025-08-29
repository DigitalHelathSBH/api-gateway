import { handleVitalRequestDate } from './controller.js';
import { vitalRequestSchema as vitalSchema } from './schema.js';

export default async function vitalRoutes(fastify, opts) {
  fastify.post('/vital', { schema: vitalSchema }, handleVitalRequestDate);
  //fastify.post('/vital', { schema: vitalSchema }, handleVitalRequestDateHn);
}