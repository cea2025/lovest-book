import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// POST - Reorder chapters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chapters } = body; // Array of { id, order_index }

    if (!Array.isArray(chapters)) {
      return NextResponse.json({ error: 'Chapters array is required' }, { status: 400 });
    }

    const updateStmt = db.prepare('UPDATE chapters SET order_index = ?, updated_at = ? WHERE id = ?');
    const now = new Date().toISOString();

    const updateMany = db.transaction(() => {
      for (const chapter of chapters) {
        updateStmt.run(chapter.order_index, now, chapter.id);
      }
    });

    updateMany();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering chapters:', error);
    return NextResponse.json({ error: 'Failed to reorder chapters' }, { status: 500 });
  }
}
