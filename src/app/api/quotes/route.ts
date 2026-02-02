import { NextRequest, NextResponse } from 'next/server';
import db, { Quote } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// GET - List all quotes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = 'SELECT * FROM quotes';
    const params: string[] = [];

    if (search) {
      query += ' WHERE text LIKE ? OR tags LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const quotes = db.prepare(query).all(...params) as Quote[];

    const parsed = quotes.map(q => ({
      ...q,
      tags: JSON.parse(q.tags as unknown as string || '[]'),
      used_in_chapters: JSON.parse(q.used_in_chapters as unknown as string || '[]'),
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

    db.prepare(`
      INSERT INTO quotes (id, text, source_id, tags, used_in_chapters, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      quote.id,
      quote.text,
      quote.source_id,
      JSON.stringify(quote.tags),
      JSON.stringify(quote.used_in_chapters),
      quote.created_at
    );

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
