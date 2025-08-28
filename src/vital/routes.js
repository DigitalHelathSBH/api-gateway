// vital/routes.js
import { handleVitalRequest } from './controller.js';

export default async function vitalRoutes(fastify, opts) {
  fastify.post('/vital', handleVitalRequest);
}