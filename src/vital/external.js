
export const getToken = async () => {
  const res = await fetch('http://localhost:3000/api/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: 'client_id----', client_secret: 'client_secret---' })
  });

  if (!res.ok) throw new Error('Token fetch failed');
  return await res.json();
};

export const getTokenTest = async () => {
  return { token: 'tesssssstTOKENexl1234645646466646466' };
};

export const sendToOut = async (payload, token) => {
  const res = await fetch('http://10.0.1.154/vital/out/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'vital': '01',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok || json.status_code === '402') {
      return { status_code: '402', statusDesc: `Invalid Token or failed to send data(${text})`, Payload: {} };
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

export async function getVitalsPayload() {
  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    startDate: today,
    endDate: today
  };

  //const port = process.env.PORT || 3002;
  //await app.listen({ port, host: '0.0.0.0' });
  const res = await fetch(`http://localhost:3002/vital/bydate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Failed to fetch vitals: ${res.status} - ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}