import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// GET - Get statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookType = searchParams.get('bookType') || 'book';

    // Chapter stats
    const chapterStats = db.prepare(`
      SELECT 
        COUNT(*) as total_chapters,
        SUM(word_count) as total_words,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'editing' THEN 1 ELSE 0 END) as editing_count,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_count
      FROM chapters 
      WHERE book_type = ?
    `).get(bookType) as {
      total_chapters: number;
      total_words: number;
      draft_count: number;
      editing_count: number;
      ready_count: number;
    };

    // Source stats
    const sourceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_sources,
        SUM(file_size) as total_size
      FROM sources
    `).get() as {
      total_sources: number;
      total_size: number;
    };

    // Quote stats
    const quoteStats = db.prepare(`
      SELECT COUNT(*) as total_quotes
      FROM quotes
    `).get() as { total_quotes: number };

    // Version stats
    const versionStats = db.prepare(`
      SELECT COUNT(*) as total_versions
      FROM versions
      WHERE book_type = ?
    `).get(bookType) as { total_versions: number };

    // Today's progress
    const today = new Date().toISOString().split('T')[0];
    const todayStats = db.prepare(`
      SELECT 
        SUM(words_written) as words_today,
        SUM(duration_minutes) as minutes_today
      FROM writing_sessions
      WHERE DATE(started_at) = ?
    `).get(today) as { words_today: number | null; minutes_today: number | null };

    return NextResponse.json({
      chapters: chapterStats,
      sources: sourceStats,
      quotes: quoteStats,
      versions: versionStats,
      today: {
        words: todayStats.words_today || 0,
        minutes: todayStats.minutes_today || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
