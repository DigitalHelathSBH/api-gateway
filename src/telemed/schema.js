export const patientsRequestHnSchema = { 
  body: {
    type: 'object',
    required: ['date'],
    additionalProperties: false,
    properties: {
      date: { type: 'string' },      
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        status_code: { type: 'string' },
        statusDesc: { type: 'string' },
        Payload: { type: 'array' }
      }
    }
  }
};