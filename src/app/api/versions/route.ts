import { NextRequest, NextResponse } from 'next/server';
import db, { Version } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// GET - List all versions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookType = searchParams.get('bookType') || 'book';

    const versions = db
      .prepare('SELECT * FROM versions WHERE book_type = ? ORDER BY created_at DESC')
      .all(bookType) as Version[];

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

// POST - Create new version snapshot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookType = 'book', versionName, description = '' } = body;

    if (!versionName) {
      return NextResponse.json({ error: 'Version name is required' }, { status: 400 });
    }

    // Create version directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const versionDir = path.join(process.cwd(), 'versions', `${timestamp}_${versionName}`);
    fs.mkdirSync(versionDir, { recursive: true });

    // Copy all chapters
    const chapters = db
      .prepare('SELECT * FROM chapters WHERE book_type = ? ORDER BY order_index ASC')
      .all(bookType);

    const chaptersDir = path.join(versionDir, 'chapters');
    fs.mkdirSync(chaptersDir, { recursive: true });

    chapters.forEach((chapter: any, index: number) => {
      const chapterFile = path.join(chaptersDir, `${String(index + 1).padStart(2, '0')}-${chapter.slug}.md`);
      const content = `---
title: ${chapter.title}
status: ${chapter.status}
word_count: ${chapter.word_count}
notes: |
${chapter.notes.split('\n').map((line: string) => '  ' + line).join('\n')}
---

${chapter.content}
`;
      fs.writeFileSync(chapterFile, content, 'utf-8');
    });

    // Save metadata
    const metadata = {
      bookType,
      versionName,
      description,
      createdAt: new Date().toISOString(),
      chapterCount: chapters.length,
      totalWords: chapters.reduce((sum: number, c: any) => sum + c.word_count, 0),
    };
    fs.writeFileSync(path.join(versionDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');

    // Save to database
    const version: Version = {
      id: uuidv4(),
      book_type: bookType,
      version_name: versionName,
      description,
      snapshot_path: versionDir,
      created_at: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO versions (id, book_type, version_name, description, snapshot_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      version.id,
      version.book_type,
      version.version_name,
      version.description,
      version.snapshot_path,
      version.created_at
    );

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}
