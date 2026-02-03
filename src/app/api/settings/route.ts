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

// GET - Get all settings
export async function GET() {
  try {
    await ensureDb();
    const rows = await sql`SELECT * FROM settings` as { key: string; value: string }[];
    
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update settings
export async function PUT(request: NextRequest) {
  try {
    await ensureDb();
    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await sql`
        INSERT INTO settings (key, value) VALUES (${key}, ${String(value)})
        ON CONFLICT(key) DO UPDATE SET value = ${String(value)}
      `;
    }

    const rows = await sql`SELECT * FROM settings` as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
