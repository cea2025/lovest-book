import { NextRequest, NextResponse } from 'next/server';
import { sql, initDatabase } from '@/lib/db';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// POST - Reorder chapters
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { chapters } = body; // Array of { id, order_index }

    if (!Array.isArray(chapters)) {
      return NextResponse.json({ error: 'Chapters array is required' }, { status: 400 });
    }

    const now = new Date().toISOString();

    for (const chapter of chapters) {
      await sql`
        UPDATE chapters 
        SET order_index = ${chapter.order_index}, updated_at = ${now} 
        WHERE id = ${chapter.id}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering chapters:', error);
    return NextResponse.json({ error: 'Failed to reorder chapters' }, { status: 500 });
  }
}
