require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Setup multer for file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY' });

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    let fileContent = '';

    // Handle both raw JSON payload (for backwards compatibility if frontend hasn't updated to multipart) and multipart form-data
    if (req.body && req.body.fileContent) {
        fileContent = req.body.fileContent;
    } else if (req.file) {
        fileContent = req.file.buffer.toString('utf8');
    } else {
        return res.status(400).json({ error: 'No file content provided' });
    }

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    res.json({ records });
  } catch (error) {
    console.error('Error parsing CSV:', error);
    res.status(500).json({ error: 'Error parsing CSV', details: error.message });
  }
});

app.post('/api/extract', async (req, res) => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Invalid records' });
    }

    const batchSize = 100;
    const extractedRecords = [];
    const skippedRecords = [];

    const prompt = `You are an AI assistant that maps raw CSV data into a strict CRM format.
Given a list of raw records, map them to the following fields:
- created_at: Lead creation date (must be convertible using JavaScript new Date()). Ensure output is a valid datetime string.
- name: Lead name
- email: Primary email
- country_code: Country code
- mobile_without_country_code: Mobile number
- company: Company name
- city: City
- state: State
- country: Country
- lead_owner: Lead owner
- crm_status: ONE OF (GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE). Leave empty if not match.
- crm_note: Notes, extra phone numbers, extra emails, anything else useful.
- data_source: ONE OF (leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots). Leave empty if not match.
- possession_time: Property possession time
- description: Additional description

RULES:
1. If multiple emails exist, use first as 'email', put rest in 'crm_note'.
2. If multiple mobiles exist, use first as 'mobile_without_country_code', put rest in 'crm_note'.
3. Skip records that have NEITHER email NOR mobile number. Return these skipped records in a separate array.

Respond strictly in JSON format matching this schema:
{
  "extracted": [ { ...fields } ],
  "skipped": [ { ...original_raw_record, reason: "No email or mobile" } ]
}
Do not include markdown blocks like \`\`\`json. Return ONLY the raw JSON string.

Raw records batch:
`;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt + JSON.stringify(batch)
      });
      
      let text = response.text || '';
      // clean markdown if present
      if (text.startsWith('```json')) {
        text = text.substring(7, text.length - 3);
      }
      if (text.startsWith('```')) {
        text = text.substring(3, text.length - 3);
      }
      
      const result = JSON.parse(text.trim());
      
      if (result.extracted) extractedRecords.push(...result.extracted);
      if (result.skipped) skippedRecords.push(...result.skipped);
    }

    res.json({ extracted: extractedRecords, skipped: skippedRecords });
  } catch (error) {
    console.error('AI Extraction Error:', error);
    if (error.status === 429 || (error.message && error.message.includes('429')) || (error.message && error.message.includes('quota'))) {
      return res.status(429).json({ error: 'Gemini API Rate Limit Exceeded. Please wait exactly 1 minute for the quota to reset, then try again.' });
    }
    res.status(500).json({ error: 'Failed to extract data using AI.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
