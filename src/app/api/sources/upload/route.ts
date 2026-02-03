import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { sql, Source, initDatabase } from '@/lib/db';

// Ensure database is initialized
let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDb();
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
    
    // Note: In serverless environment, we can't save files locally
    // The file data would need to be stored in blob storage (like Vercel Blob)
    // For now, we just create the database entry

    // Determine file type
    const fileType = getFileType(ext);

    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Create database entry
    const source: Source = {
      id: uuidv4(),
      filename: uniqueFilename,
      original_name: file.name,
      file_type: fileType,
      category: category as 'notebooklm' | 'docs' | 'notes' | 'website' | 'other',
      tags: parsedTags,
      highlights: [],
      linked_chapters: [],
      file_size: file.size,
      created_at: new Date().toISOString(),
    };

    await sql`
      INSERT INTO sources (id, filename, original_name, file_type, category, tags, highlights, linked_chapters, file_size, created_at)
      VALUES (${source.id}, ${source.filename}, ${source.original_name}, ${source.file_type}, ${source.category}, ${JSON.stringify(source.tags)}, ${JSON.stringify(source.highlights)}, ${JSON.stringify(source.linked_chapters)}, ${source.file_size}, ${source.created_at})
    `;

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
