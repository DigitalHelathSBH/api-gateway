// Fastify controller ของโปรเจกต์ sbhoncloud (ยิงผ่าน Kong + ดึง/บันทึก DB)
import runBatch from './sendForecast.js';

export default async function sbhoncloudRoutes(fastify) {
  // สั่งรัน batch ผ่าน HTTP (เช่น POST /sbhoncloud/run?limit=5)
  fastify.post('/run', async (req) => {
    const limit = Number(req.query?.limit ?? 10);
    const result = await runBatch(limit);
    return { statusCode: 200, message: 'ok', ...result };
  });
}
