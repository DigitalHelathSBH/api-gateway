import { getVitalsPayload, getTokenTest, sendToOut } from './external.js';
import { updateStatusvitalBatch } from './updater.js';

export function startVitalTimer() {
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`⏱ Vital timer triggered at ${timestamp}`);

    try {
      // ส่งวันที่วันนี้เป็น start/end
      const today = new Date().toISOString().slice(0, 10);
      const payload = await getVitalsPayload(today, today);

      if (!Array.isArray(payload) || payload.length === 0) {
        console.log('📭 No new data to send');
        return;
      }

      const tokenRec = await getTokenTest(); // หรือ getToken() สำหรับ production
      const outResponse = await sendToOut(payload, tokenRec.token);

      if (String(outResponse.status_code) === '201') {
        await updateStatusvitalBatch(payload);
        console.log(`✅ Auto update complete at ${timestamp}`);
      } else {
        console.warn(`⚠️ Send failed: ${outResponse.status_code} - ${outResponse.statusDesc}`);
        // คุณสามารถเพิ่ม retry logic ตรงนี้ได้ในอนาคต
      }
    } catch (err) {
      console.error(`❌ Vital timer error at ${timestamp}:`, err.message);
    }
  }, 1 * 60 * 1000); // ทุก 10 นาที
}