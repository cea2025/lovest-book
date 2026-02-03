import { neon } from '@neondatabase/serverless';

// Get database URL from environment
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
};

// Create SQL query function
export const sql = neon(getDatabaseUrl());

// Initialize database schema
export async function initDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      book_type TEXT NOT NULL CHECK(book_type IN ('book', 'booklet')),
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      content TEXT DEFAULT '',
      order_index INTEGER NOT NULL,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'editing', 'ready')),
      word_count INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('notebooklm', 'docs', 'notes', 'website', 'other')),
      tags TEXT DEFAULT '[]',
      highlights TEXT DEFAULT '[]',
      linked_chapters TEXT DEFAULT '[]',
      file_size INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      book_type TEXT NOT NULL CHECK(book_type IN ('book', 'booklet')),
      version_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      snapshot_path TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      source_id TEXT,
      tags TEXT DEFAULT '[]',
      used_in_chapters TEXT DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS writing_sessions (
      id TEXT PRIMARY KEY,
      chapter_id TEXT,
      words_written INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `;

  // Insert default settings
  await sql`
    INSERT INTO settings (key, value) VALUES 
      ('daily_word_goal', '1000'),
      ('auto_save_interval', '30'),
      ('theme', 'light'),
      ('font_size', '16'),
      ('pomodoro_duration', '25')
    ON CONFLICT (key) DO NOTHING
  `;
}

export type Chapter = {
  id: string;
  book_type: 'book' | 'booklet';
  title: string;
  slug: string;
  content: string;
  order_index: number;
  status: 'draft' | 'editing' | 'ready';
  word_count: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Source = {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  category: 'notebooklm' | 'docs' | 'notes' | 'website' | 'other';
  tags: string[];
  highlights: string[];
  linked_chapters: string[];
  file_size: number;
  created_at: string;
};

export type Version = {
  id: string;
  book_type: 'book' | 'booklet';
  version_name: string;
  description: string;
  snapshot_path: string;
  created_at: string;
};

export type Quote = {
  id: string;
  text: string;
  source_id: string | null;
  tags: string[];
  used_in_chapters: string[];
  created_at: string;
};
