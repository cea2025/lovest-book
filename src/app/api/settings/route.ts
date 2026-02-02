import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Get all settings
export async function GET() {
  try {
    const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
    
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
    const body = await request.json();

    const upsert = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    const updateMany = db.transaction(() => {
      for (const [key, value] of Object.entries(body)) {
        upsert.run(key, String(value));
      }
    });

    updateMany();

    const rows = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
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
