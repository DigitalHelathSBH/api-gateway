import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import ajvCompiler from '@fastify/ajv-compiler';

import patientRoutes from './hie/routes.js';
import sbhoncloudRoutes from './sbhoncloud/controller.js';

import vitalRoutes from './vital/routes.js';
import { startVitalTimer } from './vital/vitalTimer.js';

import { startTelemedTimer } from './telemed/telemedTimer.js';

dotenv.config();

const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      strict: true,
      removeAdditional: false
    }
  }
});

async function start() {
  await app.register(cors, { origin: '*' });

  app.register(patientRoutes, { prefix: '/hie' });

  app.register(sbhoncloudRoutes, { prefix: '/sbhoncloud' });

  app.register(vitalRoutes, { prefix: '/vitalsign' });

  const port = process.env.PORT || 3002;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`✅ Server running on http://localhost:${port}`);

  //startVitalTimer(); 
  startTelemedTimer(); 
}

start().catch(err => {
  app.log.error(err);
  process.exit(1);
});