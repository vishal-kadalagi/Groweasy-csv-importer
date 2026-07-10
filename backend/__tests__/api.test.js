const request = require('supertest');
const app = require('../server');

describe('Backend API Tests', () => {

  describe('POST /api/upload', () => {
    it('should parse a valid CSV file correctly', async () => {
      const csvData = 'name,email\nJohn Doe,john@example.com\nJane Doe,jane@example.com';
      
      const response = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from(csvData), 'test.csv');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('records');
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0]).toEqual({ name: 'John Doe', email: 'john@example.com' });
    });

    it('should return 400 if no file is provided', async () => {
      const response = await request(app)
        .post('/api/upload');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'No file content provided');
    });
  });

  describe('POST /api/extract', () => {
    it('should return 400 if records are missing or invalid', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({}); // Missing records array

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid records');
    });

    it('should return 200 with empty arrays if records array is empty', async () => {
      const response = await request(app)
        .post('/api/extract')
        .send({ records: [] });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('extracted', []);
      expect(response.body).toHaveProperty('skipped', []);
    });
  });

});
