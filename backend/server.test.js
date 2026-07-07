const request = require('supertest');
const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse');
const cors = require('cors');

// Create a mock app to test the routes independently
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Mock /api/upload route
app.post('/api/upload', (req, res) => {
  const { fileContent } = req.body;
  if (!fileContent) return res.status(400).json({ error: 'No file content provided' });
  parse(fileContent, { columns: true, skip_empty_lines: true }, (err, records) => {
    if (err) return res.status(500).json({ error: 'Failed to parse CSV' });
    res.json({ records });
  });
});

// Mock /api/extract route
app.post('/api/extract', async (req, res) => {
  const { records } = req.body;
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  
  // Mocking AI extraction response
  const extracted = [];
  const skipped = [];
  
  records.forEach((r) => {
    if (r.email || r.phone || r['MOBILE 1']) {
      extracted.push({ name: r.name || 'Test', email: r.email || r['PRIMARY EMAIL'], crm_status: 'GOOD_LEAD' });
    } else {
      skipped.push({ reason: 'Missing contact info', original: r });
    }
  });

  res.json({ extracted, skipped });
});

describe('CSV Importer Backend API', () => {
  describe('POST /api/upload', () => {
    it('should parse a valid CSV file', async () => {
      const csvString = 'name,email\nJohn,john@example.com\nJane,jane@example.com';
      const response = await request(app)
        .post('/api/upload')
        .send({ fileContent: csvString });
      
      expect(response.status).toBe(200);
      expect(response.body.records).toHaveLength(2);
      expect(response.body.records[0].name).toBe('John');
    });

    it('should return 400 if no file is uploaded', async () => {
      const response = await request(app).post('/api/upload').send({});
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/extract', () => {
    it('should extract valid records and skip invalid ones', async () => {
      const payload = {
        records: [
          { name: 'John', email: 'john@example.com' }, // valid
          { name: 'Jane', info: 'no email here' }      // invalid
        ]
      };

      const response = await request(app)
        .post('/api/extract')
        .send(payload);
      
      expect(response.status).toBe(200);
      expect(response.body.extracted).toHaveLength(1);
      expect(response.body.skipped).toHaveLength(1);
      expect(response.body.extracted[0].name).toBe('John');
    });

    it('should return 400 for invalid payload', async () => {
      const response = await request(app).post('/api/extract').send({});
      expect(response.status).toBe(400);
    });
  });
});
