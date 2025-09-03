export const getTokenPrepare = async (caseGet) => {
  if (caseGet === '1') {
    const res = await fetch('http://localhost:3000/api/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: 'client_id----', client_secret: 'client_secret---' })
    });

    if (!res.ok) throw new Error('Token fetch failed');
    return await res.json();
  }else{
    return { token: 'tesssssstTOKENexl1234645646466646466' };
  }
};

export const sendToOut = async (payload, token) => {
  const res = await fetch('http://10.0.1.154/vital/out/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload) //เข้ารหัสเป็น JSON
  });

  let rawText = await res.text();
  const cleanedText = stripHtmlTags(rawText);
  console.log('external.Response Text:', JSON.stringify(cleanedText));
  try {
    const json = JSON.parse(cleanedText);
    if (!res.ok || json.status_code === '402') {
      return { status_code: '402', statusDesc: `Invalid Token or failed to send data(${cleanedText})`, Payload: {} };
    }
    if (String(json.status_code) === '201') {
      return { status_code: '201', statusDesc: `Success`, Payload: {} };
    } 
    return json;
  } catch {
    return { status_code: '500', statusDesc: 'Invalid JSON response from target(For sendToOut:May Be Out Port Error)', Payload: {} };
  }
};

export function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function stripHtmlTags(str) {
  if (typeof str !== 'string') return str;
  // ล้าง HTML tag
  const cleaned = str.replace(/<[^>]*>/g, '');
  // ดึงเฉพาะ JSON object จากข้อความที่ปะปน
  const match = cleaned.match(/{.*}/s); // ใช้ regex ดึง {...} ตัวแรก
  return match ? match[0] : cleaned; // ถ้าเจอ JSON ให้คืน JSON string, ถ้าไม่เจอคืนข้อความที่ล้างแล้ว
}
