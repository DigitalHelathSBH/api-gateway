const mainUrlCorTex = 'https://telepharma.one.th/management/api'; //Direct for Real
const hospitalKey = 'KOVIE5I-YC5EJ5A-ROBJKQI-CMAFA4A'; //REal
//const mainUrlCorTex = 'https://uat-hpd-vhv.one.th/management/api'; //Direct for Test
//const hospitalKey = 'G3UGXCQ-UGJEWII-UYJPKEA-2543UUI';

//const mainUrlCorTex = 'http://10.0.1.154'; // Kong Gateway IP
//const UrlCorTex = mainUrlCorTex + '/telemed/create/';
//const mainUrlCorTex = 'http://10.0.120.18:8000'; // Kong Gateway IP
//const UrlCorTex = mainUrlCorTex + '/telemed/create/';
const jwtToken = '32860055b6dd1b5c0c7d99302a29136e';

export const sendToOutForNew = async (payload) => {
  const UrlCorTex = mainUrlCorTex + '/telemed-center/register-appointment'; //Direct
  //const UrlCorTex = mainUrlCorTex + '/telemed/create/'; ---Kong Gateway
  console.log("\n📦 เริ่มการส่งไป N Point : สร้าการนัดใหม่");
  console.log('TelemedUrlCorTex:', UrlCorTex);
  console.log('🔐 hospitalkey:', hospitalKey);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  //แบบ ผ่านKong JWT
  try {
    const res = await fetch(UrlCorTex, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        hospitalkey: hospitalKey,
        //Authorization: `Bearer ${jwtToken}`, // ถ้ามี JWT
        JF: 'gh#v@fo1'
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json(); // ✅ parse JSON ตรง ๆ
    //console.log('📨 HTTP Status:', res.status);
    //console.log('📨📨📨📨📨📨📨📨📨📨📨📨📨📨 Response JSON:', JSON.stringify(json, null, 2));

    const statusCode = String(json.status_code || json.statusCode || res.status);

    if (statusCode === '200' || statusCode === '201') {
      return {
        status_code: statusCode,
        statusDesc: json.message || 'Success',
        Payload: json
      };
    }

    if (statusCode === '403') {
      return {
        status_code: '403',
        statusDesc: `Forbidden: ${json.message || 'Forbidden'}`,
        Payload: json
      };
    }

    if (statusCode === '402') {
      return {
        status_code: '402',
        statusDesc: `Invalid hospitalkey or failed to send data`,
        Payload: json
      };
    }

    return {
      status_code: statusCode,
      statusDesc: 'Response received but unrecognized status',
      Payload: json
    };
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return {
      status_code: '500',
      statusDesc: 'Network or unexpected error',
      Payload: {}
    };
  }
};

export const sendToOutForNew_bk = async (payload) => {
  const UrlCorTex = mainUrlCorTex + '/telemed-center/register-appointment'; //Direct

  //console.log("\n📦 เริ่มการส่งไป N Point : สร้าการนัดใหม่");
  //console.log('TelemedUrlCorTex:', UrlCorTex);
  //console.log('🔐 hospitalkey:', hospitalKey);
  //console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(UrlCorTex, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        hospitalkey: hospitalKey        
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json(); // ✅ parse JSON ตรง ๆ
    //console.log('📨 HTTP Status:', res.status);
    //console.log('📨📨📨📨📨📨📨📨📨📨📨📨📨📨 Response JSON:', JSON.stringify(json, null, 2));

    const statusCode = String(json.status_code || json.statusCode || res.status);

    if (statusCode === '200' || statusCode === '201') {
      return {
        status_code: statusCode,
        statusDesc: json.message || 'Success',
        Payload: json
      };
    }

    if (statusCode === '403') {
      return {
        status_code: '403',
        statusDesc: `Forbidden: ${json.message || 'Forbidden'}`,
        Payload: json
      };
    }

    if (statusCode === '402') {
      return {
        status_code: '402',
        statusDesc: `Invalid hospitalkey or failed to send data`,
        Payload: json
      };
    }

    return {
      status_code: statusCode,
      statusDesc: 'Response received but unrecognized status',
      Payload: json
    };
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return {
      status_code: '500',
      statusDesc: 'Network or unexpected error',
      Payload: {}
    };
  }
};

export const sendToOutForEdit = async (payload) => {
  const transactionid = payload.transactionid; //from HNAPPMNT.transaction_id

  const UrlCorTex = mainUrlCorTex + `/telemed-center/appointment/${transactionid}`; //Direct
  //console.log("\n📦 เริ่มการส่งไป N Point (แก้ไข):");
  //console.log('TelemedUrlCorTex:', UrlCorTex);
  //console.log('🔐 hospitalkey:', hospitalKey);
  //console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(UrlCorTex, {
      method: 'PUT',   // ✅ ใช้ PUT สำหรับแก้ไข
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        hospitalkey: hospitalKey,
        //Authorization: `Bearer ${jwtToken}`, // ถ้ามี JWT
        JF: 'gh#v@fo1'
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    //console.log('📨 HTTP Status:', res.status);
    //console.log('📨 Response JSON:', JSON.stringify(json, null, 2));

    const statusCode = String(json.status_code || json.statusCode || res.status);

    if (statusCode === '200' || statusCode === '201') {
      return {
        status_code: statusCode,
        statusDesc: json.message || 'Success',
        transaction_id: json?.result?.transaction_id || null,  // ✅ คืนค่า transaction_id ตรงตาม spec
        Payload: json
      };
    }

    if (statusCode === '403') {
      return {
        status_code: '403',
        statusDesc: `Forbidden: ${json.message || 'Forbidden'}`,
        Payload: json
      };
    }

    if (statusCode === '402') {
      return {
        status_code: '402',
        statusDesc: `Invalid hospitalkey or failed to send data`,
        Payload: json
      };
    }

    return {
      status_code: statusCode,
      statusDesc: 'Response received but unrecognized status',
      Payload: json
    };
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return {
      status_code: '500',
      statusDesc: 'Network or unexpected error',
      Payload: {}
    };
  }
};

export const sendToOutForCancel = async (payload) => {
  const transactionid = payload.transactionid; //from HNAPPMNT.transaction_id

  const UrlCorTex = mainUrlCorTex + `/telemed-center/appointment/${transactionid}`; //Direct
  //console.log("\n📦 เริ่มการส่งไป N Point (Cancel): ยกเลิกการนัด");
  //console.log('TelemedUrlCorTex:', UrlCorTex);
  //console.log('🔐 hospitalkey:', hospitalKey);
  //console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(UrlCorTex, {
      method: 'DELETE',   // ✅ ใช้ DELETE สำหรับยกเลิก
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        hospitalkey: hospitalKey,
        //Authorization: `Bearer ${jwtToken}`, // ถ้ามี JWT
        JF: 'gh#v@fo1'
      },
      body: JSON.stringify(payload)     // บาง API ต้องส่ง payload เช่น transaction_id, CancelReason
    });

    const json = await res.json();
    //console.log('📨 HTTP Status:', res.status);
    //console.log('📨 Response JSON:', JSON.stringify(json, null, 2));

    const statusCode = String(json.status_code || json.statusCode || res.status);

    if (statusCode === '200' || statusCode === '201') {
      return {
        status_code: statusCode,
        statusDesc: json.message || 'Cancel Success',
        transaction_id: json?.result?.transaction_id || null,  // ✅ คืนค่า transaction_id ที่ถูกยกเลิก
        Payload: json
      };
    }

    if (statusCode === '403') {
      return {
        status_code: '403',
        statusDesc: `Forbidden: ${json.message || 'Forbidden'}`,
        Payload: json
      };
    }

    if (statusCode === '402') {
      return {
        status_code: '402',
        statusDesc: `Invalid hospitalkey or failed to send data`,
        Payload: json
      };
    }

    return {
      status_code: statusCode,
      statusDesc: 'Response received but unrecognized status',
      Payload: json
    };
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return {
      status_code: '500',
      statusDesc: 'Network or unexpected error',
      Payload: {}
    };
  }
};

export const getTelemedPayloadStatusData = async (appointment_date, transaction_id = null) => {
  // ✅ ตรวจสอบว่า appointment_date ถูกต้อง
  if (!appointment_date || typeof appointment_date !== 'string') {
    return {
      status_code: '400',
      statusDesc: 'Invalid appointment_date',
      Payload: {}
    };
  }

  // ✅ สร้าง URL พร้อม query string
  let UrlCorTex = mainUrlCorTex + '/telemed-center/conference-list';
  const queryParams = new URLSearchParams({ appointment_date });
  if (transaction_id) {
    queryParams.append('transaction_id', transaction_id);
  }
  UrlCorTex += `?${queryParams.toString()}`;

  console.log("\n📦 เริ่มการดึงข้อมูล สถานะ Telemed Conference เพื่อมาอัปเดต [external.js.getTelemedPayloadStatusData()]");
  console.log('TelemedUrlCorTex:', UrlCorTex);
  console.log('🔐 hospitalkey:', hospitalKey);

  try {
    const res = await fetch(UrlCorTex, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        hospitalkey: hospitalKey,
        // Authorization: `Bearer ${jwtToken}`, // ถ้ามี JWT
        JF: 'gh#v@fo1'
      }
    });

    const json = await res.json();
    const statusCode = String(json.status_code || res.status);

    if (statusCode === '200') {
      //console.log("📦📦📦 external.js(getTelemedPayloadStatusData()) Payload ต้นทาง JSON Result:", JSON.stringify(json.result, null, 2));
      return {
        status_code: statusCode,
        statusDesc: json.message || 'Success',
        Payload: json.result || {}
      };
    }

    if (statusCode === '400') {
      return {
        status_code: '400',
        statusDesc: json.message || 'กรุณาระบุวันที่นัดหมาย',
        Payload: {}
      };
    }

    if (statusCode === '401') {
      return {
        status_code: '401',
        statusDesc: json.message || 'authorization not found',
        Payload: {}
      };
    }

    if (statusCode === '403') {
      return {
        status_code: '403',
        statusDesc: `Forbidden: ${json.message || 'Forbidden'}`,
        Payload: {}
      };
    }

    if (statusCode === '500') {
      return {
        status_code: '500',
        statusDesc: json.error || 'Internal Server Error',
        Payload: {}
      };
    }

    return {
      status_code: statusCode,
      statusDesc: 'Response received but unrecognized status',
      Payload: json
    };
  } catch (err) {
    console.error('❌ Fetch error:', err.message);
    return {
      status_code: '500',
      statusDesc: 'Network or unexpected error',
      Payload: {}
    };
  }
};

/* getTokenPrepare ยังไม่ได้ใช้ในโปรเจคนี้นะ */
export const getTokenPrepare = async (caseGet) => {
  /* ยังไม่ได้ใช้เพราะ ระบบFixไปเลยได้ */
  const caseGetFinal = '1';

  if (caseGetFinal === '1') {
    const UrlAuth = 'https://id-cortex.srbrhospital.com/realms/cortex/protocol/openid-connect/token';
    const Client_id = 'vital-sign-saintmed';
    const client_secret = 'G3UGXCQ-UGJEWII-UYJPKEA-2543UUI';

    const formBody = new URLSearchParams({
      client_id: HLabClient_id,
      client_secret: HLabclient_secret,
      grant_type: 'client_credentials'
    });

    try {
      const res = await fetch(UrlAuth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString()
      });

      const tokenData = await res.json();
      if (!res.ok || !tokenData?.access_token || !tokenData?.token_type) {
        throw new Error(tokenData.error_description || 'Token fetch failed');
      }

      return tokenData;
    } catch (err) {
      console.error('❌ Token fetch error:', err.message);
      throw err;
    }
  } else {
    return { token: 'tesssssstTOKENexl1234645646466646466' };
  }
};

export function stripHtmlTags(str) {
  if (typeof str !== 'string') return str;
  const cleaned = str.replace(/<[^>]*>/g, '');
  const match = cleaned.match(/{.*}/s);
  return match ? match[0] : cleaned;
}

export function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}