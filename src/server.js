import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import ajvCompiler from '@fastify/ajv-compiler';

import patientRoutes from './patients/routes.js';

dotenv.config();

const app = Fastify({ logger: true });

async function start() {
  await app.register(cors, { origin: '*' });

  app.register(patientRoutes);

  const port = process.env.PORT || 3002;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`✅ Server running on http://localhost:${port}`);
}

start().catch(err => {
  app.log.error(err);
  process.exit(1);
});