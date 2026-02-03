import { NextRequest, NextResponse } from 'next/server';
import { sql, Chapter, initDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { countWords, generateSlug } from '@/lib/utils';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - List all chapters
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const bookType = searchParams.get('bookType') || 'book';

    const chapters = await sql`
      SELECT * FROM chapters 
      WHERE book_type = ${bookType} 
      ORDER BY order_index ASC
    ` as Chapter[];

    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}

// POST - Create new chapter
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { title, bookType = 'book', content = '' } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Get max order index
    const maxOrderResult = await sql`
      SELECT MAX(order_index) as max FROM chapters WHERE book_type = ${bookType}
    `;
    const maxOrder = maxOrderResult[0]?.max ?? -1;

    const chapter: Chapter = {
      id: uuidv4(),
      book_type: bookType,
      title,
      slug: generateSlug(title),
      content,
      order_index: maxOrder + 1,
      status: 'draft',
      word_count: countWords(content),
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO chapters (id, book_type, title, slug, content, order_index, status, word_count, notes, created_at, updated_at)
      VALUES (${chapter.id}, ${chapter.book_type}, ${chapter.title}, ${chapter.slug}, ${chapter.content}, ${chapter.order_index}, ${chapter.status}, ${chapter.word_count}, ${chapter.notes}, ${chapter.created_at}, ${chapter.updated_at})
    `;

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}
