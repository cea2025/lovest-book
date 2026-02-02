'use client';

import { useState } from 'react';
import { FileDown, Globe, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportPanelProps {
  bookType: 'book' | 'booklet';
  chapterCount: number;
  wordCount: number;
}

type ExportStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ExportPanel({ bookType, chapterCount, wordCount }: ExportPanelProps) {
  const [title, setTitle] = useState(
    bookType === 'book' ? 'משיאים ושיטת Lovest' : 'חוברת הסברה - משיאים'
  );
  const [subtitle, setSubtitle] = useState(
    bookType === 'book' ? 'המדריך המלא' : 'מדריך מקוצר'
  );
  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle');
  const [webStatus, setWebStatus] = useState<ExportStatus>('idle');
  const [lastExport, setLastExport] = useState<{ type: string; filename: string } | null>(null);

  const handleExportPDF = async () => {
    setPdfStatus('loading');
    try {
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookType, title, subtitle }),
      });

      if (!response.ok) throw new Error('Failed to export PDF');

      const data = await response.json();
      setPdfStatus('success');
      setLastExport({ type: 'PDF', filename: data.filename });

      // Reset status after 3 seconds
      setTimeout(() => setPdfStatus('idle'), 3000);
    } catch (error) {
      console.error('PDF export failed:', error);
      setPdfStatus('error');
      setTimeout(() => setPdfStatus('idle'), 3000);
    }
  };

  const handleExportWeb = async () => {
    setWebStatus('loading');
    try {
      const response = await fetch('/api/export/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookType, title, subtitle }),
      });

      if (!response.ok) throw new Error('Failed to export web');

      const data = await response.json();
      setWebStatus('success');
      setLastExport({ type: 'אתר', filename: data.folder });

      setTimeout(() => setWebStatus('idle'), 3000);
    } catch (error) {
      console.error('Web export failed:', error);
      setWebStatus('error');
      setTimeout(() => setWebStatus('idle'), 3000);
    }
  };

  const getStatusIcon = (status: ExportStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div dir="rtl" className="p-6 bg-white rounded-lg border border-stone-200">
      <h2 className="text-xl font-bold text-stone-800 mb-4">ייצוא</h2>

      {/* Book info */}
      <div className="mb-6 p-4 bg-stone-50 rounded-lg">
        <p className="text-sm text-stone-600">
          <span className="font-medium">{bookType === 'book' ? 'ספר מלא' : 'חוברת'}:</span>{' '}
          {chapterCount} פרקים | {wordCount.toLocaleString('he-IL')} מילים
        </p>
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">כותרת</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">כותרת משנה</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Export buttons */}
      <div className="space-y-3">
        <button
          onClick={handleExportPDF}
          disabled={pdfStatus === 'loading' || chapterCount === 0}
          className={cn(
            'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
            pdfStatus === 'loading'
              ? 'bg-stone-200 text-stone-500 cursor-wait'
              : pdfStatus === 'success'
              ? 'bg-green-100 text-green-700'
              : pdfStatus === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          )}
        >
          {getStatusIcon(pdfStatus) || <FileDown className="w-5 h-5" />}
          {pdfStatus === 'loading'
            ? 'מייצא PDF...'
            : pdfStatus === 'success'
            ? 'PDF נוצר בהצלחה!'
            : pdfStatus === 'error'
            ? 'שגיאה בייצוא'
            : 'ייצוא ל-PDF'}
        </button>

        <button
          onClick={handleExportWeb}
          disabled={webStatus === 'loading' || chapterCount === 0}
          className={cn(
            'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
            webStatus === 'loading'
              ? 'bg-stone-200 text-stone-500 cursor-wait'
              : webStatus === 'success'
              ? 'bg-green-100 text-green-700'
              : webStatus === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {getStatusIcon(webStatus) || <Globe className="w-5 h-5" />}
          {webStatus === 'loading'
            ? 'מייצא אתר...'
            : webStatus === 'success'
            ? 'אתר נוצר בהצלחה!'
            : webStatus === 'error'
            ? 'שגיאה בייצוא'
            : 'ייצוא לאתר'}
        </button>
      </div>

      {/* Last export info */}
      {lastExport && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <p>
            ייצוא {lastExport.type} הושלם: <code className="bg-green-100 px-1 rounded">{lastExport.filename}</code>
          </p>
          <p className="text-xs text-green-600 mt-1">הקובץ נשמר בתיקיית output</p>
        </div>
      )}

      {chapterCount === 0 && (
        <p className="mt-4 text-sm text-amber-600 text-center">
          הוסף לפחות פרק אחד כדי לייצא
        </p>
      )}
    </div>
  );
}
