//Refer Kong Gateway : http://10.0.120.17:8000/api/createPatientVitalNextjs
//import { getConnection, sql } from '../../lib/db';
//import { isValidDateString } from '../../shared/function'
import { getPool } from '../common/db.js';

//const validKey = 'PHRYR7K163vO50c!fb51d5@EM32b41ebd6d5jhDSa&6e6PeL9c68';

// ฟังก์ชันขอ Token จากระบบภายนอก
const getToken = async () => {
  const tokenRes = await fetch('http://localhost:3000/api/getToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: 'client_id----',
      client_secret: 'client_secret---'
    })
  });

  if (!tokenRes.ok) {
    const errorData = await tokenRes.json();
    throw new Error(`Token fetch failed: ${errorData.error || 'Unknown error'}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData; // หรือ access_token ถ้า API ใช้ชื่อนั้น
};

//ฟังก์ชันส่งข้อมูล Payload ไปยังปลายทาง
const sendToOut = async (Json_payLoad, token) => {
  const outRes = await fetch('http://10.0.120.17/api/out/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'vital': '01',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(Json_payLoad)
  });

  const text = await outRes.text();
  try {
    const resultJson = JSON.parse(text);
    //console.log('ผลลัพธ์จากปลายทาง:', resultJson);

    if (!outRes.ok || !resultJson || resultJson.status_code === '402') {
      return {
        status_code: '402',
        statusDesc: 'Invalid Token or failed to send data',
        Payload: {}
      };
    }

    return resultJson;
  } catch (err) {
    console.error('ปลายทางไม่ใช่ JSON:', text);
    return {
      status_code: '500',
      statusDesc: 'Invalid JSON response from target',
      Payload: {}
    };
  }

  return resultJson;
};

//ฟังก์ชันส่งข้อมูล Payload ไปยังปลายทาง ตัวทดสอบ
const sendToOutForTestOnly = async (Json_payLoad) => {
  const outRes = await fetch('http://172.16.11.32:3000//api/validateJsonResult', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Json_payLoad)
  });
  if (!outRes.ok) throw new Error('Failed(Json payLoad Send) to send data to out Target');

  //return await outRes.json(); 
};

export default async function handler(req, res) {
    const response = {
    status_code: '200',
    statusDesc: 'Success.',
    //token: '',
    Payload: {}
  };

  if (req.method !== 'POST') {
    return res.status(405).json({ ...response, status_code: '405', statusDesc: 'Method Not Allowed' });
  }
  
  const apiKey = req.headers['x-api-key'];
  const { startDate, endDate } = req.body || {};

  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    return res.status(400).json({
      ...response,
      status_code: '400',
      statusDesc: 'Invalid Date Format',
    });
  }
  if (new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({
      ...response,
      status_code: '401',
      statusDesc: 'Invalid Date Range',
    });
  }

  //if (apiKey !== validKey) {
  //  return res.status(405).json({ ...response, status_code: '405', statusDesc: 'X-API-Key Incorrect' });
  //}

  try {
    const pool = await getConnection();

    const vitalResult = await pool.request()
      //.input('hn', sql.VarChar, hn) //ยังไม่ได้ใช้ hn
      .input('startDate', sql.Date, startDate)
      .input('endDate', sql.Date, endDate)
      .query(
`SELECT TOP 50 
    saintmed.*,
    (
        SELECT TOP 1 VNMST_SUBQRY.hn
        FROM SSBDatabase.dbo.VNMST VNMST_SUBQRY
        WHERE VNMST_SUBQRY.vn = saintmed.vn
        ORDER BY VNMST_SUBQRY.VISITDATE DESC
    ) AS [hn]
FROM 
    SSBDatabase.dbo.saintmed
WHERE 
    CONVERT(DATE, LEFT(datetime, 8)) BETWEEN @startDate AND @endDate
ORDER BY 
    datetime DESC;`
      ); 
      //JOIN เพื่อให้ได้ HN จาก VNMST

    if (vitalResult.recordset.length === 0) {
      return res.status(404).json({ ...response, status_code: '404', statusDesc: 'Not Found Data' });
    }

    const Payload = vitalResult.recordset.map(med => ({
      hn: med.hn,
      //vn: med.vn,
      datetime: med.datetime,
      ip: med.ip,
      macAddress: med.macAddress ?? null,
      //suffix: med.suffix, 
      //status: med.status,
      //updatedate: med.updatedate, 
      results: [
        { name: 'WEIGHT', value: med.weight, valueType: 'float', unit: 'kg' },
        { name: 'HEIGHT', value: med.height, valueType: 'float', unit: 'cm' },
        { name: 'BMI', value: med.bmi, valueType: 'float', unit: '' },
        { name: 'TEMPERATURE', value: med.temperature, valueType: 'float', unit: '°C' },
        { name: 'SYSTOLIC', value: med.systolic, valueType: 'integer', unit: 'mmHg' },
        { name: 'DIASTOLIC', value: med.diastolic, valueType: 'integer', unit: 'mmHg' },
        { name: 'PULSE', value: med.pulse, valueType: 'integer', unit: 'bpm' },
        { name: 'SPO2', value: med.spo2, valueType: 'integer', unit: '%' },
      ]
    }));

    //ขอ Token และ ส่งข้อมูลไปยังปลายทาง
    const tokenRec = await getToken();  //ใช้จริง
    if (!tokenRec.token ) {
      return res.status(403).json({
        ...response,
        status_code: '403',
        statusDesc: 'Invalid Token!'
      });
    }
    else
    {

      //console.log('Last Token : ' + tokenRec.token);
      const outResponse = await sendToOut(Payload, tokenRec.token);  //ใช้จริง v.2
      //console.log(outResponse);
      response.status_code = outResponse.status_code;
      response.statusDesc = outResponse.statusDesc;
      //response.token = outResponse.token;
      //response.Payload = outResponse.Payload || Payload;

      return res.status(200).json(response);
      //const outResponse = await sendToOutForTestOnly(finalStringJson); //For Test
    }

  } catch (err) {
    console.error('SQL Error:', err.message);

    if (err.code === 'ETIMEOUT' || err.code === 'ECONNREFUSED') {
      return res.status(503).json({ ...response ,status_code: '503', statusDesc: 'Database Unavailable' });
    }

    return res.status(500).json({ ...response, status_code: '500', statusDesc: 'Server Error' });
  }
}