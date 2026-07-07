import { NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileContent } = body;

    if (!fileContent) {
      return NextResponse.json({ error: 'No file content provided' }, { status: 400 });
    }

    // Using sync API of csv-parse for easier async/await handling in Next.js routes
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    return NextResponse.json({ records });
  } catch (error: any) {
    console.error('Error parsing CSV:', error);
    return NextResponse.json({ error: 'Error parsing CSV', details: error.message }, { status: 500 });
  }
}
