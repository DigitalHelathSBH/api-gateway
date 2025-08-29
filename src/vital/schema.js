export const vitalRequestSchema = {
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