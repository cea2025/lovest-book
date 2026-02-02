const fs = require('fs');
const path = require('path');

const chapters = [
  { title: 'שער', file: '01-שער.md' },
  { title: 'הבעיה - האתגר של 1.6 מיליון', file: '02-הבעיה.md' },
  { title: 'שני כשלים', file: '03-שני-כשלים.md' },
  { title: 'הפתרון - שיטת Lovest', file: '04-הפתרון.md' },
  { title: 'איך זה עובד - 4 שלבים', file: '05-ארבעה-שלבים.md' },
  { title: 'המספרים - דוגמה מעשית', file: '06-המספרים.md' },
  { title: 'השוואה - לבד מול משיאים', file: '07-טבלת-השוואה.md' },
  { title: 'שאלות ותשובות', file: '08-שאלות-ותשובות.md' },
  { title: 'מי עומד מאחורי', file: '09-מי-עומד-מאחורי.md' },
  { title: 'הסימולטור - איך מתחילים', file: '10-הסימולטור.md' },
  { title: 'סיום', file: '11-סיום.md' },
];

async function importChapters() {
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const filePath = path.join(__dirname, 'content', 'booklet', ch.file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const response = await fetch('http://localhost:3000/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: ch.title,
        bookType: 'booklet',
        content: content,
        orderIndex: i
      })
    });
    
    const result = await response.json();
    console.log(`Added: ${ch.title}`, result.id ? 'OK' : 'ERROR');
  }
}

importChapters().then(() => console.log('Done!')).catch(console.error);
