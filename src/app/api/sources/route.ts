import { NextRequest, NextResponse } from 'next/server';
import { sql, Source, initDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - List all sources
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let sources: Source[];

    if (category && search) {
      sources = await sql`
        SELECT * FROM sources 
        WHERE category = ${category} AND (original_name LIKE ${'%' + search + '%'} OR tags LIKE ${'%' + search + '%'})
        ORDER BY created_at DESC
      ` as Source[];
    } else if (category) {
      sources = await sql`
        SELECT * FROM sources WHERE category = ${category} ORDER BY created_at DESC
      ` as Source[];
    } else if (search) {
      sources = await sql`
        SELECT * FROM sources 
        WHERE original_name LIKE ${'%' + search + '%'} OR tags LIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
      ` as Source[];
    } else {
      sources = await sql`SELECT * FROM sources ORDER BY created_at DESC` as Source[];
    }

    // Parse JSON fields
    const parsed = sources.map(s => ({
      ...s,
      tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags || [],
      highlights: typeof s.highlights === 'string' ? JSON.parse(s.highlights) : s.highlights || [],
      linked_chapters: typeof s.linked_chapters === 'string' ? JSON.parse(s.linked_chapters) : s.linked_chapters || [],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}

// POST - Create new source (metadata only)
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { filename, originalName, fileType, category, tags = [], fileSize = 0 } = body;

    if (!filename || !originalName || !fileType || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const source: Source = {
      id: uuidv4(),
      filename,
      original_name: originalName,
      file_type: fileType,
      category,
      tags,
      highlights: [],
      linked_chapters: [],
      file_size: fileSize,
      created_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO sources (id, filename, original_name, file_type, category, tags, highlights, linked_chapters, file_size, created_at)
      VALUES (${source.id}, ${source.filename}, ${source.original_name}, ${source.file_type}, ${source.category}, ${JSON.stringify(source.tags)}, ${JSON.stringify(source.highlights)}, ${JSON.stringify(source.linked_chapters)}, ${source.file_size}, ${source.created_at})
    `;

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
