import 'dotenv/config';
import axios from 'axios';
import { buildJwt } from './jwt.js';
import { fetchPendingMonths, markMonthSent, saveResponse } from './db.js';

const http = axios.create({
  baseURL: process.env.KONG_BASE,
  timeout: Number(process.env.API_TIMEOUT_MS || 8000),
  headers: { 'Content-Type': 'application/json' }
});

async function sendOne(month) {
  const jwt = buildJwt();
  const url = process.env.KONG_PATH_MAIN || '/result_data/main/';
  const resp = await http.post(url, { processing_month: month }, {
    headers: { Authorization: `Bearer ${jwt}`, geeks: 'result' }
  });
  return resp;
}

// รันแบบ one-off (ใช้กับ cron/pm2 ได้)
export default async function runBatch(limit = 10) {
  const months = await fetchPendingMonths(limit);
  if (months.length === 0) return { ok: true, processed: 0 };

  let ok = 0;
  for (const m of months) {
    try {
      const resp = await sendOne(m);
      await saveResponse(m, resp.status, JSON.stringify(resp.data));
      await markMonthSent(m);
      ok++;
    } catch (e) {
      const st = e?.response?.status || 0;
      const body = e?.response?.data || { error: e.message };
      await saveResponse(m, st, JSON.stringify(body));
    }
  }
  return { ok: true, processed: ok };
}
