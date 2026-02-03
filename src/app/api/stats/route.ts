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

// GET - Get statistics
export async function GET(request: NextRequest) {
  try {
    await ensureDb();
    const { searchParams } = new URL(request.url);
    const bookType = searchParams.get('bookType') || 'book';

    // Chapter stats
    const chapterStatsResult = await sql`
      SELECT 
        COUNT(*) as total_chapters,
        COALESCE(SUM(word_count), 0) as total_words,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count,
        SUM(CASE WHEN status = 'editing' THEN 1 ELSE 0 END) as editing_count,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready_count
      FROM chapters 
      WHERE book_type = ${bookType}
    `;
    const chapterStats = chapterStatsResult[0] || {
      total_chapters: 0,
      total_words: 0,
      draft_count: 0,
      editing_count: 0,
      ready_count: 0,
    };

    // Source stats
    const sourceStatsResult = await sql`
      SELECT 
        COUNT(*) as total_sources,
        COALESCE(SUM(file_size), 0) as total_size
      FROM sources
    `;
    const sourceStats = sourceStatsResult[0] || { total_sources: 0, total_size: 0 };

    // Quote stats
    const quoteStatsResult = await sql`
      SELECT COUNT(*) as total_quotes
      FROM quotes
    `;
    const quoteStats = quoteStatsResult[0] || { total_quotes: 0 };

    // Version stats
    const versionStatsResult = await sql`
      SELECT COUNT(*) as total_versions
      FROM versions
      WHERE book_type = ${bookType}
    `;
    const versionStats = versionStatsResult[0] || { total_versions: 0 };

    // Today's progress
    const today = new Date().toISOString().split('T')[0];
    const todayStatsResult = await sql`
      SELECT 
        COALESCE(SUM(words_written), 0) as words_today,
        COALESCE(SUM(duration_minutes), 0) as minutes_today
      FROM writing_sessions
      WHERE DATE(started_at) = ${today}
    `;
    const todayStats = todayStatsResult[0] || { words_today: 0, minutes_today: 0 };

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
