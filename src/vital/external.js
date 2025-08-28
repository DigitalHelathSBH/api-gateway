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
  const jsn = {
    token: 'tesssssstTOKENexl1234645646466646466'
  };
  return jsn;
};

export const sendToOut = async (payload, token) => {
  const res = await fetch('http://10.0.120.17/api/out/', {
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
      return { status_code: '402', statusDesc: 'Invalid Token or failed to send data', Payload: {} };
    }
    return json;
  } catch {
    return { status_code: '500', statusDesc: 'Invalid JSON response from target', Payload: {} };
  }
};

export function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}
