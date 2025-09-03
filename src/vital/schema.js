export const vitalRequestDateSchema = {
  body: {
    type: 'object',
    required: ['startDate', 'endDate'],
    additionalProperties: false,
    properties: {
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        status_code: { type: 'string' },
        statusDesc: { type: 'string' },
        Payload: { type: 'array' }
      }
    }
  }
};

export const vitalRequestDateHnSchema = {
  body: {
    type: 'object',
    required: ['startDate', 'endDate', 'hn'],
    additionalProperties: false,
    properties: {
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      hn: { type: 'string' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        status_code: { type: 'string' },
        statusDesc: { type: 'string' },
        Payload: { type: 'array' }
      }
    }
  }
};
