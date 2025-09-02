import { getTokenTest,sendToOut,stripHtmlTags} from './external.js';
import { getVitalsPayload } from './services.js';
import { updateStatusvitalBatch } from './updater.js';

export function startVitalTimer() {
  setInterval(async () => {
    const timestamp = new Date().toISOString();
    console.log(`⏱ Vital timer triggered at ${timestamp}`);

    try {
      const date = new Date();
      const today =
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0');

      const payloadFull = await getVitalsPayload(today, today);

      if (!Array.isArray(payloadFull) || payloadFull.length === 0) {
        console.log('📭 No new data to send');
        return;
      }

      const payload = payloadFull[0];
      //console.log('📦 vitalTimer.js \n', JSON.stringify(payload, null, 2));

      const tokenRec = await getTokenTest(); // หรือ getToken() สำหรับ production

      let outResponseRaw = await sendToOut(payload, tokenRec.token);
      const outResponse = stripHtmlTags(outResponseRaw);
      //console.log(`📨 vitalTimer.js.outResponse [${outResponse.status_code}] , ${outResponse.statusDesc}:\n\n`);
      if (String(outResponse.status_code) === '201') {
        await updateStatusvitalBatch(payloadFull);
        console.log(`✅ Auto update complete at ${timestamp}`);
      } else {
        console.warn(`⚠️ Send failed: ${outResponse.status_code} - ${outResponse.statusDesc}`);
      }
    } catch (err) {
      console.error(`❌ Vital timer error at ${timestamp}:`, err.message);
    }
  }, 10 * 60 * 1000); // ทุก 10 นาที
}