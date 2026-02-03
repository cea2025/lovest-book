import { NextRequest, NextResponse } from 'next/server';
import { sql, Chapter, initDatabase } from '@/lib/db';

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
    const body = await request.json();
    const { bookType = 'book', title, subtitle } = body;

    // Get chapters
    const chapters = await sql`
      SELECT * FROM chapters WHERE book_type = ${bookType} ORDER BY order_index ASC
    ` as Chapter[];

    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters to export' }, { status: 400 });
    }

    // Generate HTML content for print
    const html = generateBookHTML(chapters, title, subtitle, bookType);

    // Return HTML that can be printed to PDF by the browser
    return NextResponse.json({
      success: true,
      html,
      chapterCount: chapters.length,
      totalWords: chapters.reduce((sum, c) => sum + c.word_count, 0),
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

function generateBookHTML(
  chapters: Chapter[],
  title: string,
  subtitle: string,
  bookType: string
): string {
  const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);

  const chaptersHTML = chapters
    .map(
      (chapter, index) => `
      <div class="chapter" style="page-break-before: always;">
        <h2 class="chapter-title">
          <span class="chapter-number">פרק ${index + 1}</span>
          ${chapter.title}
        </h2>
        <div class="chapter-content">
          ${markdownToHTML(chapter.content)}
        </div>
      </div>
    `
    )
    .join('');

  const tocHTML = chapters
    .map(
      (chapter, index) => `
      <li>
        <span class="toc-number">פרק ${index + 1}:</span>
        <span class="toc-title">${chapter.title}</span>
      </li>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Noto Sans Hebrew', 'David', serif;
          font-size: 12pt;
          line-height: 1.8;
          color: #1a1a1a;
          direction: rtl;
          text-align: right;
        }
        
        .cover {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          page-break-after: always;
        }
        
        .cover h1 { font-size: 32pt; font-weight: 700; color: #2563eb; margin-bottom: 20px; }
        .cover .subtitle { font-size: 18pt; color: #64748b; margin-bottom: 40px; }
        .cover .meta { font-size: 12pt; color: #94a3b8; }
        
        .toc { page-break-after: always; }
        .toc h2 { font-size: 24pt; color: #1e3a5f; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; }
        .toc ul { list-style: none; }
        .toc li { padding: 10px 0; border-bottom: 1px dotted #e2e8f0; display: flex; gap: 10px; }
        .toc-number { color: #2563eb; font-weight: 600; }
        
        .chapter { margin-top: 40px; }
        .chapter-title { font-size: 20pt; color: #1e3a5f; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #2563eb; }
        .chapter-number { display: block; font-size: 12pt; color: #2563eb; font-weight: 600; margin-bottom: 5px; }
        .chapter-content { text-align: justify; }
        .chapter-content p { margin-bottom: 15px; text-indent: 20px; }
        .chapter-content h3 { font-size: 14pt; color: #334155; margin: 25px 0 15px 0; }
        .chapter-content ul, .chapter-content ol { margin: 15px 30px 15px 0; }
        .chapter-content li { margin-bottom: 8px; }
        .chapter-content blockquote { margin: 20px 0; padding: 15px 20px; background: #f8fafc; border-right: 4px solid #f59e0b; font-style: italic; color: #475569; }
        .chapter-content strong { font-weight: 700; color: #0f172a; }
        .chapter-content em { font-style: italic; }
        .chapter-content a { color: #2563eb; text-decoration: underline; }
        .chapter-content hr { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
        
        @media print {
          body { font-size: 11pt; }
          .chapter { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="cover">
        <h1>${title || 'משיאים ושיטת Lovest'}</h1>
        <p class="subtitle">${subtitle || (bookType === 'booklet' ? 'חוברת הסברה' : 'המדריך המלא')}</p>
        <p class="meta">${chapters.length} פרקים | ${totalWords.toLocaleString('he-IL')} מילים</p>
      </div>
      
      <div class="toc">
        <h2>תוכן עניינים</h2>
        <ul>${tocHTML}</ul>
      </div>
      
      ${chaptersHTML}
    </body>
    </html>
  `;
}

function markdownToHTML(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul><ul>/g, '');

  return html;
}
