import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'book.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize database schema
db.exec(`
  -- Chapters table
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Sources table
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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Versions table
  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    book_type TEXT NOT NULL CHECK(book_type IN ('book', 'booklet')),
    version_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    snapshot_path TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Quotes bank
  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    source_id TEXT,
    tags TEXT DEFAULT '[]',
    used_in_chapters TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES sources(id)
  );

  -- Writing sessions for tracking
  CREATE TABLE IF NOT EXISTS writing_sessions (
    id TEXT PRIMARY KEY,
    chapter_id TEXT,
    words_written INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 0,
    started_at TEXT DEFAULT CURRENT_TIMESTAMP,
    ended_at TEXT,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
  );

  -- Settings table
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Insert default settings
  INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('daily_word_goal', '1000'),
    ('auto_save_interval', '30'),
    ('theme', 'light'),
    ('font_size', '16'),
    ('pomodoro_duration', '25');
`);

export default db;

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
