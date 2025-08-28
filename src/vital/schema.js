export const patientSchema = {
  response: {
    200: {
      type: 'object',
      properties: { ok: { type: 'boolean' }, data: { type: 'array' } }
    }
  }
};

export const patientByHnSchema = {
  params: { type: 'object', properties: { hn: { type: 'string' } }, required: ['hn'] },
  response: {
    200: { type: 'object', properties: { ok: { type: 'boolean' }, data: { type: 'object' } } }
  }
};

export const patientFindByCidSchema = {
  body: {
    type: 'object',
    properties: { hospcode: { type: 'string' }, cid: { type: 'string' } },
    required: ['hospcode', 'cid']
  }
};

export const visitSchema = {
  body: {
    type: 'object',
    properties: {
      cid: { type: 'string' },
      hn: { type: 'string' },
      vn: { type: 'string' },
      vstdate: { type: 'string' },
      hospcode: { type: 'string' },
      clinicId: { type: 'string' }
    },
    required: ['vn', 'vstdate','hospcode','clinicId']
  }
};
