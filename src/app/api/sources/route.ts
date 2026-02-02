import { NextRequest, NextResponse } from 'next/server';
import db, { Source } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// GET - List all sources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = 'SELECT * FROM sources';
    const conditions: string[] = [];
    const params: string[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (search) {
      conditions.push('(original_name LIKE ? OR tags LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const sources = db.prepare(query).all(...params) as Source[];

    // Parse JSON fields
    const parsed = sources.map(s => ({
      ...s,
      tags: JSON.parse(s.tags as unknown as string || '[]'),
      highlights: JSON.parse(s.highlights as unknown as string || '[]'),
      linked_chapters: JSON.parse(s.linked_chapters as unknown as string || '[]'),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}

// POST - Create new source (metadata only, file upload handled separately)
export async function POST(request: NextRequest) {
  try {
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

    db.prepare(`
      INSERT INTO sources (id, filename, original_name, file_type, category, tags, highlights, linked_chapters, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      source.id,
      source.filename,
      source.original_name,
      source.file_type,
      source.category,
      JSON.stringify(source.tags),
      JSON.stringify(source.highlights),
      JSON.stringify(source.linked_chapters),
      source.file_size,
      source.created_at
    );

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
