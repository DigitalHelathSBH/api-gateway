export const getTokenPrepare = async (caseGet) => {
  const caseGetFinal = '1';
  if (caseGetFinal === '1') {
    const HLabUrlAuth = 'https://id-cortex.srbrhospital.com/realms/cortex/protocol/openid-connect/token';
    const HLabClient_id = 'vital-sign-saintmed';
    const HLabclient_secret = '9qfrCmH6d05vXlvgiijC3Z33zfcklgyK';

    const formBody = new URLSearchParams({
      client_id: HLabClient_id,
      client_secret: HLabclient_secret,
      grant_type: 'client_credentials' //,scope: 'emr-api-write'
      
    });

    const res = await fetch(HLabUrlAuth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString()
    });

    const tokenData = await res.json();
    //console.log('HLabToken 1 :', tokenData);

    if (!res.ok) throw new Error('Token fetch failed');
    return tokenData;
  } else {
    return { token: 'tesssssstTOKENexl1234645646466646466' };
  }
};

export const sendToOut = async (payload, tokenObj) => {
  const HLabUrlCorTex = 'https://cortex.srbrhospital.com/emr-api/patients/vital-signs/from-device';

  console.log('🔐 HLabToken:', tokenObj.access_token);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  const res = await fetch(HLabUrlCorTex, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      Authorization: `${tokenObj.token_type} ${tokenObj.access_token}`
    },
    body: JSON.stringify(payload)
  });

  const rawText = await res.text();
  const cleanedText = stripHtmlTags(rawText);
  console.log('📨 Response:', cleanedText);

  // ✅ ตรวจสอบ HTTP status ก่อน parse JSON
  if (res.status === 201) {
    return {
      status_code: '201',
      statusDesc: 'Success',
      Payload: {}
    };
  }

  if (res.status === 403) {
    console.error('🚫 403 Forbidden:', cleanedText);
    return {
      status_code: '403',
      statusDesc: `Forbidden: ${cleanedText}`,
      Payload: {}
    };
  }

  try {
    const json = JSON.parse(cleanedText);

    // ✅ รองรับ statusCode ที่อยู่ใน json หรือ json.res
    const statusCode = json.statusCode ?? json.res?.statusCode;

    if (String(statusCode) === '402') {
      return {
        status_code: '402',
        statusDesc: `Invalid Token or failed to send data (${cleanedText})`,
        Payload: {}
      };
    }

    if (String(statusCode) === '201') {
      return {
        status_code: '201',
        statusDesc: 'Success',
        Payload: {}
      };
    }

    return {
      status_code: String(statusCode ?? res.status),
      statusDesc: 'Response received but unrecognized status',
      Payload: json
    };
  } catch (err) {
    console.error('❌ JSON parse error:', err.message);
    return {
      status_code: String(res.status),
      statusDesc: 'Invalid JSON response from target (May be Out Port Error)',
      Payload: {}
    };
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
