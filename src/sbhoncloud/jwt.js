import 'dotenv/config';
import crypto from 'crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64')
  .replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_');

export function buildJwt() {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    iss: process.env.JWT_ISS || 'geeks3',
    exp: Math.floor(Date.now()/1000) + 10*60
  };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const token = `${h}.${p}`;
  const sig = crypto.createHmac('sha256', process.env.JWT_SECRET)
    .update(token).digest();
  const s = b64url(sig);
  return `${token}.${s}`;
}
