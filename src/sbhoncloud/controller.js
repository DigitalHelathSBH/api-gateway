import { fetchFireList, insertApiLog } from './db.js';
import { sendFire } from './sendForecast.js';

export default async function sbhoncloudRoutes(fastify) {
  // POST /sbhoncloud/fire  → ดึงจาก DB → ส่งไป FIRE → ถ้า DONE ก็ log → ตอบกลับ
  fastify.post('/fire', async (req, reply) => {
    // หาต้นทาง IP (รองรับ reverse proxy)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.ip
           || '';

    const list = await fetchFireList();
    if (!list || list.length === 0) {
      return { result: 0, message: 'NO_DATA' };
    }

    const data = await sendFire(list); // call external API

    if (data?.message === 'DONE') {
      await insertApiLog(ip);
      return { result: 1 };
    } else {
      return { result: 0, message: data?.message || 'ERROR' };
    }
  });
}
