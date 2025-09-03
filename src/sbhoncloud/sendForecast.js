import 'dotenv/config';
import axios from 'axios';

/**
 * ส่ง list ไปยัง FIRE API
 * @param {Array} list - [{EMPID, USERNAME, SECTIONNAME, POSITIONNAME, CALL}, ...]
 * @returns {Promise<{message: string, ...}>}
 */

export async function sendFire(list) {
  const url = process.env.FIRE_API_URL;
  const key = process.env.FIRE_API_KEY;

  const resp = await axios.post(url, list, {
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
      'X-Api-Key': key
    },
    // PHP เดิมปิด verify SSL; ใน axios ไม่ควรปิด ถ้าจำเป็นค่อยเพิ่ม agent
  });
  return resp.data; // { message: "DONE" | "ERROR", ... }
}
