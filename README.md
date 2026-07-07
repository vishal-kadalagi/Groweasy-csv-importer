# GrowEasy CSV Importer

An AI-powered CSV Importer that extracts CRM lead information from any valid CSV format. 
Built as part of the GrowEasy Software Developer assignment.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, Multer, CSV-Parse
- **AI**: Google Gemini (`@google/genai`)

## Setup Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install dependencies (if not already installed):
   \`\`\`bash
   npm install
   \`\`\`
3. Create a `.env` file in the `backend` directory and add your Gemini API Key:
   \`\`\`env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3001
   \`\`\`
4. Start the backend server:
   \`\`\`bash
   node server.js
   \`\`\`
   The backend will run on \`http://localhost:3001\`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   \`\`\`bash
   cd frontend
   \`\`\`
2. Install dependencies (if not already installed):
   \`\`\`bash
   npm install
   \`\`\`
3. Start the Next.js development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open your browser and navigate to \`http://localhost:3000\`.

## Features
- **Intelligent Field Mapping**: Maps varying column names to strict CRM fields using Gemini AI.
- **Modern UI**: Dark-themed, glassmorphic design built with Tailwind CSS.
- **Drag & Drop**: Easily upload CSV files.
- **Data Preview**: Review data before confirming the import.
- **Extraction Results**: Separate views for successfully mapped records and skipped records (missing required email/mobile fields).

## Evaluation Focus
- Handled AI prompt engineering to ensure correct JSON output structure and fallback strategies.
- Provided a fully responsive React table with horizontal/vertical scrolling and sticky headers.
- Graceful error handling across frontend and backend.
