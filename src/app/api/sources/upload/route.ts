import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;

    if (!file || !category) {
      return NextResponse.json({ error: 'File and category are required' }, { status: 400 });
    }

    const validCategories = ['notebooklm', 'docs', 'notes', 'website', 'other'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Generate unique filename
    const ext = path.extname(file.name);
    const uniqueFilename = `${uuidv4()}${ext}`;
    
    // Save file
    const uploadDir = path.join(process.cwd(), 'sources', category);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Determine file type
    const fileType = getFileType(ext);

    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Create database entry
    const source = {
      id: uuidv4(),
      filename: uniqueFilename,
      original_name: file.name,
      file_type: fileType,
      category,
      tags: parsedTags,
      highlights: [],
      linked_chapters: [],
      file_size: file.size,
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
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

function getFileType(ext: string): string {
  const extension = ext.toLowerCase();
  
  const types: Record<string, string> = {
    '.pdf': 'pdf',
    '.doc': 'word',
    '.docx': 'word',
    '.txt': 'text',
    '.md': 'markdown',
    '.rtf': 'rtf',
    '.odt': 'odt',
    '.html': 'html',
    '.htm': 'html',
  };

  return types[extension] || 'other';
}
