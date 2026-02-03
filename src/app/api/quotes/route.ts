import { NextRequest, NextResponse } from 'next/server';
import { sql, Quote, initDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - List all quotes
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let quotes: Quote[];
    
    if (search) {
      quotes = await sql`
        SELECT * FROM quotes 
        WHERE text LIKE ${'%' + search + '%'} OR tags LIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
      ` as Quote[];
    } else {
      quotes = await sql`SELECT * FROM quotes ORDER BY created_at DESC` as Quote[];
    }

    const parsed = quotes.map(q => ({
      ...q,
      tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : q.tags || [],
      used_in_chapters: typeof q.used_in_chapters === 'string' ? JSON.parse(q.used_in_chapters) : q.used_in_chapters || [],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

// POST - Create new quote
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { text, sourceId = null, tags = [] } = body;

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const quote: Quote = {
      id: uuidv4(),
      text,
      source_id: sourceId,
      tags,
      used_in_chapters: [],
      created_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO quotes (id, text, source_id, tags, used_in_chapters, created_at)
      VALUES (${quote.id}, ${quote.text}, ${quote.source_id}, ${JSON.stringify(quote.tags)}, ${JSON.stringify(quote.used_in_chapters)}, ${quote.created_at})
    `;

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
