import { NextRequest, NextResponse } from 'next/server';
import { sql, Version, Chapter, initDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// GET - List all versions
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const bookType = searchParams.get('bookType') || 'book';

    const versions = await sql`
      SELECT * FROM versions WHERE book_type = ${bookType} ORDER BY created_at DESC
    ` as Version[];

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

// POST - Create new version snapshot (simplified - stores in DB only, no file system)
export async function POST(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();
    const { bookType = 'book', versionName, description = '' } = body;

    if (!versionName) {
      return NextResponse.json({ error: 'Version name is required' }, { status: 400 });
    }

    // Get all chapters
    const chapters = await sql`
      SELECT * FROM chapters WHERE book_type = ${bookType} ORDER BY order_index ASC
    ` as Chapter[];

    // Create snapshot path (stored as JSON in DB for serverless compatibility)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotPath = `snapshot_${timestamp}_${versionName}`;

    // Save to database
    const version: Version = {
      id: uuidv4(),
      book_type: bookType,
      version_name: versionName,
      description: description + '\n\n---SNAPSHOT---\n' + JSON.stringify(chapters),
      snapshot_path: snapshotPath,
      created_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO versions (id, book_type, version_name, description, snapshot_path, created_at)
      VALUES (${version.id}, ${version.book_type}, ${version.version_name}, ${version.description}, ${version.snapshot_path}, ${version.created_at})
    `;

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}
