import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import ajvCompiler from '@fastify/ajv-compiler';

import patientRoutes from './patients/routes.js';
import vitalRoutes from './vital/routes.js';
import { startVitalTimer } from './vital/vitalTimer.js';

dotenv.config();

// เปิด strict schema validation กำหนดฟิลด์ที่อนุญาตมาเท่านั้น
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

  app.register(patientRoutes);
  app.register(vitalRoutes);

  const port = process.env.PORT || 3002;
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`✅ Server running on http://localhost:${port}`);

  startVitalTimer(); 
}

start().catch(err => {
  app.log.error(err);
  process.exit(1);
});