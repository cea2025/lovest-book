import { NextRequest, NextResponse } from 'next/server';
import { sql, Source, initDatabase } from '@/lib/db';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - Get single source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const sources = await sql`SELECT * FROM sources WHERE id = ${id}`;
    const source = sources[0] as Source | undefined;

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const parsed = {
      ...source,
      tags: typeof source.tags === 'string' ? JSON.parse(source.tags) : source.tags || [],
      highlights: typeof source.highlights === 'string' ? JSON.parse(source.highlights) : source.highlights || [],
      linked_chapters: typeof source.linked_chapters === 'string' ? JSON.parse(source.linked_chapters) : source.linked_chapters || [],
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching source:', error);
    return NextResponse.json({ error: 'Failed to fetch source' }, { status: 500 });
  }
}

// PUT - Update source
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const body = await request.json();
    const { tags, highlights, linked_chapters } = body;

    const existingSources = await sql`SELECT * FROM sources WHERE id = ${id}`;
    const existing = existingSources[0] as Source | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const newTags = tags !== undefined ? JSON.stringify(tags) : (typeof existing.tags === 'string' ? existing.tags : JSON.stringify(existing.tags || []));
    const newHighlights = highlights !== undefined ? JSON.stringify(highlights) : (typeof existing.highlights === 'string' ? existing.highlights : JSON.stringify(existing.highlights || []));
    const newLinkedChapters = linked_chapters !== undefined ? JSON.stringify(linked_chapters) : (typeof existing.linked_chapters === 'string' ? existing.linked_chapters : JSON.stringify(existing.linked_chapters || []));

    await sql`
      UPDATE sources 
      SET tags = ${newTags}, highlights = ${newHighlights}, linked_chapters = ${newLinkedChapters}
      WHERE id = ${id}
    `;

    const updatedSources = await sql`SELECT * FROM sources WHERE id = ${id}`;
    const updated = updatedSources[0] as Source;
    const parsed = {
      ...updated,
      tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags || [],
      highlights: typeof updated.highlights === 'string' ? JSON.parse(updated.highlights) : updated.highlights || [],
      linked_chapters: typeof updated.linked_chapters === 'string' ? JSON.parse(updated.linked_chapters) : updated.linked_chapters || [],
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

// DELETE - Delete source
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    
    const existingSources = await sql`SELECT * FROM sources WHERE id = ${id}`;
    const existing = existingSources[0] as Source | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    await sql`DELETE FROM sources WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
