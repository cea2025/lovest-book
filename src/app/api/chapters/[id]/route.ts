import { NextRequest, NextResponse } from 'next/server';
import db, { Chapter } from '@/lib/db';
import { countWords, generateSlug } from '@/lib/utils';

// GET - Get single chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chapter = db
      .prepare('SELECT * FROM chapters WHERE id = ?')
      .get(id) as Chapter | undefined;

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json({ error: 'Failed to fetch chapter' }, { status: 500 });
  }
}

// PUT - Update chapter
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, content, status, notes, order_index } = body;

    const existing = db
      .prepare('SELECT * FROM chapters WHERE id = ?')
      .get(id) as Chapter | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const updates: Partial<Chapter> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updates.title = title;
      updates.slug = generateSlug(title);
    }
    if (content !== undefined) {
      updates.content = content;
      updates.word_count = countWords(content);
    }
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (order_index !== undefined) updates.order_index = order_index;

    const setClauses = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), id];

    db.prepare(`UPDATE chapters SET ${setClauses} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM chapters WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating chapter:', error);
    return NextResponse.json({ error: 'Failed to update chapter' }, { status: 500 });
  }
}

// DELETE - Delete chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const existing = db
      .prepare('SELECT * FROM chapters WHERE id = ?')
      .get(id) as Chapter | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM chapters WHERE id = ?').run(id);

    // Reorder remaining chapters
    const remaining = db
      .prepare('SELECT id FROM chapters WHERE book_type = ? ORDER BY order_index ASC')
      .all(existing.book_type) as { id: string }[];

    remaining.forEach((chapter, index) => {
      db.prepare('UPDATE chapters SET order_index = ? WHERE id = ?').run(index, chapter.id);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
}
