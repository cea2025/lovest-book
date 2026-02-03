import { NextRequest, NextResponse } from 'next/server';
import { sql, Chapter, initDatabase } from '@/lib/db';
import { countWords, generateSlug } from '@/lib/utils';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - Get single chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDb();
    const { id } = await params;
    const chapters = await sql`SELECT * FROM chapters WHERE id = ${id}`;
    const chapter = chapters[0] as Chapter | undefined;

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
    await ensureDb();
    const { id } = await params;
    const body = await request.json();
    const { title, content, status, notes, order_index } = body;

    const existingChapters = await sql`SELECT * FROM chapters WHERE id = ${id}`;
    const existing = existingChapters[0] as Chapter | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const updatedAt = new Date().toISOString();
    const newTitle = title !== undefined ? title : existing.title;
    const newSlug = title !== undefined ? generateSlug(title) : existing.slug;
    const newContent = content !== undefined ? content : existing.content;
    const newWordCount = content !== undefined ? countWords(content) : existing.word_count;
    const newStatus = status !== undefined ? status : existing.status;
    const newNotes = notes !== undefined ? notes : existing.notes;
    const newOrderIndex = order_index !== undefined ? order_index : existing.order_index;

    await sql`
      UPDATE chapters 
      SET title = ${newTitle}, 
          slug = ${newSlug}, 
          content = ${newContent}, 
          word_count = ${newWordCount}, 
          status = ${newStatus}, 
          notes = ${newNotes}, 
          order_index = ${newOrderIndex}, 
          updated_at = ${updatedAt}
      WHERE id = ${id}
    `;

    const updatedChapters = await sql`SELECT * FROM chapters WHERE id = ${id}`;
    return NextResponse.json(updatedChapters[0]);
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
    await ensureDb();
    const { id } = await params;
    
    const existingChapters = await sql`SELECT * FROM chapters WHERE id = ${id}`;
    const existing = existingChapters[0] as Chapter | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    await sql`DELETE FROM chapters WHERE id = ${id}`;

    // Reorder remaining chapters
    const remaining = await sql`
      SELECT id FROM chapters WHERE book_type = ${existing.book_type} ORDER BY order_index ASC
    ` as { id: string }[];

    for (let i = 0; i < remaining.length; i++) {
      await sql`UPDATE chapters SET order_index = ${i} WHERE id = ${remaining[i].id}`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
}
