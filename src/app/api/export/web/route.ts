import { NextRequest, NextResponse } from 'next/server';
import db, { Chapter } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookType = 'book', title, subtitle } = body;

    // Get chapters
    const chapters = db
      .prepare('SELECT * FROM chapters WHERE book_type = ? ORDER BY order_index ASC')
      .all(bookType) as Chapter[];

    if (chapters.length === 0) {
      return NextResponse.json({ error: 'No chapters to export' }, { status: 400 });
    }

    // Create output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const folderName = `${bookType}-web-${timestamp}`;
    const outputDir = path.join(process.cwd(), 'output', 'web', folderName);
    fs.mkdirSync(outputDir, { recursive: true });

    const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);

    // Generate index.html
    const indexHTML = generateIndexHTML(chapters, title, subtitle, bookType, totalWords);
    fs.writeFileSync(path.join(outputDir, 'index.html'), indexHTML, 'utf-8');

    // Generate chapter pages
    chapters.forEach((chapter, index) => {
      const chapterHTML = generateChapterHTML(
        chapter,
        index,
        chapters.length,
        title,
        chapters[index - 1],
        chapters[index + 1]
      );
      fs.writeFileSync(
        path.join(outputDir, `chapter-${index + 1}.html`),
        chapterHTML,
        'utf-8'
      );
    });

    // Generate styles.css
    const css = generateCSS();
    fs.writeFileSync(path.join(outputDir, 'styles.css'), css, 'utf-8');

    return NextResponse.json({
      success: true,
      folder: folderName,
      path: outputDir,
      files: chapters.length + 2, // chapters + index + css
    });
  } catch (error) {
    console.error('Error generating web export:', error);
    return NextResponse.json({ error: 'Failed to generate web export' }, { status: 500 });
  }
}

function generateIndexHTML(
  chapters: Chapter[],
  title: string,
  subtitle: string,
  bookType: string,
  totalWords: number
): string {
  const tocHTML = chapters
    .map(
      (chapter, index) => `
      <li>
        <a href="chapter-${index + 1}.html" class="toc-item">
          <span class="toc-number">${index + 1}</span>
          <span class="toc-title">${chapter.title}</span>
          <span class="toc-words">${chapter.word_count.toLocaleString('he-IL')} מילים</span>
        </a>
      </li>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'משיאים ושיטת Lovest'}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="hero">
      <h1>${title || 'משיאים ושיטת Lovest'}</h1>
      <p class="subtitle">${subtitle || (bookType === 'booklet' ? 'חוברת הסברה' : 'המדריך המלא')}</p>
      <div class="meta">
        <span>${chapters.length} פרקים</span>
        <span>•</span>
        <span>${totalWords.toLocaleString('he-IL')} מילים</span>
      </div>
    </header>
    
    <nav class="toc">
      <h2>תוכן עניינים</h2>
      <ol>
        ${tocHTML}
      </ol>
    </nav>
    
    <footer>
      <p>נוצר עם מערכת כתיבת ספר Lovest</p>
    </footer>
  </div>
</body>
</html>`;
}

function generateChapterHTML(
  chapter: Chapter,
  index: number,
  totalChapters: number,
  bookTitle: string,
  prevChapter: Chapter | undefined,
  nextChapter: Chapter | undefined
): string {
  const contentHTML = markdownToHTML(chapter.content);

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>פרק ${index + 1}: ${chapter.title} | ${bookTitle}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header class="chapter-header">
      <a href="index.html" class="back-link">← חזרה לתוכן עניינים</a>
      <span class="chapter-number">פרק ${index + 1} מתוך ${totalChapters}</span>
    </header>
    
    <article class="chapter">
      <h1>${chapter.title}</h1>
      <div class="chapter-meta">
        <span>${chapter.word_count.toLocaleString('he-IL')} מילים</span>
      </div>
      <div class="chapter-content">
        ${contentHTML}
      </div>
    </article>
    
    <nav class="chapter-nav">
      ${prevChapter ? `<a href="chapter-${index}.html" class="nav-prev">← ${prevChapter.title}</a>` : '<span></span>'}
      ${nextChapter ? `<a href="chapter-${index + 2}.html" class="nav-next">${nextChapter.title} →</a>` : '<span></span>'}
    </nav>
    
    <footer>
      <p>נוצר עם מערכת כתיבת ספר Lovest</p>
    </footer>
  </div>
</body>
</html>`;
}

function generateCSS(): string {
  return `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --text: #1a1a1a;
  --text-light: #64748b;
  --bg: #ffffff;
  --bg-alt: #f8fafc;
  --border: #e2e8f0;
  --accent: #f59e0b;
}

body {
  font-family: 'Noto Sans Hebrew', sans-serif;
  font-size: 18px;
  line-height: 1.8;
  color: var(--text);
  background: var(--bg);
  direction: rtl;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

/* Hero */
.hero {
  text-align: center;
  padding: 60px 20px;
  margin-bottom: 40px;
}

.hero h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 10px;
}

.hero .subtitle {
  font-size: 1.25rem;
  color: var(--text-light);
  margin-bottom: 20px;
}

.hero .meta {
  display: flex;
  justify-content: center;
  gap: 15px;
  color: var(--text-light);
  font-size: 0.9rem;
}

/* TOC */
.toc {
  background: var(--bg-alt);
  border-radius: 12px;
  padding: 30px;
}

.toc h2 {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: var(--text);
}

.toc ol {
  list-style: none;
}

.toc-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: var(--bg);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text);
  transition: all 0.2s;
  border: 1px solid var(--border);
}

.toc-item:hover {
  border-color: var(--primary);
  transform: translateX(-5px);
}

.toc-number {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  margin-left: 15px;
}

.toc-title {
  flex: 1;
  font-weight: 500;
}

.toc-words {
  font-size: 0.85rem;
  color: var(--text-light);
}

/* Chapter */
.chapter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.back-link {
  color: var(--primary);
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

.chapter-number {
  font-size: 0.9rem;
  color: var(--text-light);
}

.chapter h1 {
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 10px;
}

.chapter-meta {
  color: var(--text-light);
  font-size: 0.9rem;
  margin-bottom: 30px;
}

.chapter-content {
  text-align: justify;
}

.chapter-content p {
  margin-bottom: 20px;
}

.chapter-content h2 {
  font-size: 1.5rem;
  margin: 40px 0 20px;
  color: var(--text);
}

.chapter-content h3 {
  font-size: 1.25rem;
  margin: 30px 0 15px;
  color: var(--text);
}

.chapter-content ul,
.chapter-content ol {
  margin: 20px 0 20px 30px;
}

.chapter-content li {
  margin-bottom: 10px;
}

.chapter-content blockquote {
  margin: 25px 0;
  padding: 20px;
  background: var(--bg-alt);
  border-right: 4px solid var(--accent);
  font-style: italic;
  color: var(--text-light);
}

.chapter-content code {
  background: var(--bg-alt);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}

.chapter-content pre {
  background: #1e293b;
  color: #e2e8f0;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 20px 0;
}

.chapter-content pre code {
  background: none;
  color: inherit;
}

.chapter-content strong {
  font-weight: 600;
}

.chapter-content a {
  color: var(--primary);
}

.chapter-content hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 40px 0;
}

/* Chapter Navigation */
.chapter-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid var(--border);
}

.chapter-nav a {
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.chapter-nav a:hover {
  text-decoration: underline;
}

/* Footer */
footer {
  text-align: center;
  margin-top: 60px;
  padding-top: 30px;
  border-top: 1px solid var(--border);
  color: var(--text-light);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 600px) {
  body {
    font-size: 16px;
  }
  
  .hero h1 {
    font-size: 1.75rem;
  }
  
  .chapter h1 {
    font-size: 1.5rem;
  }
  
  .toc-item {
    flex-wrap: wrap;
  }
  
  .toc-words {
    width: 100%;
    margin-top: 5px;
    margin-right: 50px;
  }
}
`;
}

function markdownToHTML(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/^---$/gim, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  html = '<p>' + html + '</p>';
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/<p><br><\/p>/g, '');
  html = html.replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>');
  html = html.replace(/<\/ul><ul>/g, '');

  return html;
}
