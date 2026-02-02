import { NextRequest, NextResponse } from 'next/server';
import db, { Source } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// GET - Get single source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .get(id) as Source | undefined;

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const parsed = {
      ...source,
      tags: JSON.parse(source.tags as unknown as string || '[]'),
      highlights: JSON.parse(source.highlights as unknown as string || '[]'),
      linked_chapters: JSON.parse(source.linked_chapters as unknown as string || '[]'),
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
    const { id } = await params;
    const body = await request.json();
    const { tags, highlights, linked_chapters } = body;

    const existing = db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .get(id) as Source | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const updates: Record<string, string> = {};
    if (tags !== undefined) updates.tags = JSON.stringify(tags);
    if (highlights !== undefined) updates.highlights = JSON.stringify(highlights);
    if (linked_chapters !== undefined) updates.linked_chapters = JSON.stringify(linked_chapters);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const setClauses = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), id];

    db.prepare(`UPDATE sources SET ${setClauses} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM sources WHERE id = ?').get(id) as Source;
    const parsed = {
      ...updated,
      tags: JSON.parse(updated.tags as unknown as string || '[]'),
      highlights: JSON.parse(updated.highlights as unknown as string || '[]'),
      linked_chapters: JSON.parse(updated.linked_chapters as unknown as string || '[]'),
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
    const { id } = await params;
    
    const existing = db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .get(id) as Source | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Delete the file
    const filePath = path.join(process.cwd(), 'sources', existing.category, existing.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM sources WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
