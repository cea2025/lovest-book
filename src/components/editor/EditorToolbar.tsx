'use client';

import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onSave: () => void;
  isSaving: boolean;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  wordCount: number;
  lastSaved?: string;
}

export default function EditorToolbar({
  onInsert,
  onSave,
  isSaving,
  focusMode,
  onToggleFocusMode,
  showPreview,
  onTogglePreview,
  wordCount,
  lastSaved,
}: EditorToolbarProps) {
  const buttons = [
    { icon: Bold, action: () => onInsert('**', '**'), title: 'מודגש (Ctrl+B)' },
    { icon: Italic, action: () => onInsert('*', '*'), title: 'נטוי (Ctrl+I)' },
    { icon: Underline, action: () => onInsert('<u>', '</u>'), title: 'קו תחתון (Ctrl+U)' },
    { type: 'divider' },
    { icon: Heading1, action: () => onInsert('# ', ''), title: 'כותרת 1' },
    { icon: Heading2, action: () => onInsert('## ', ''), title: 'כותרת 2' },
    { icon: Heading3, action: () => onInsert('### ', ''), title: 'כותרת 3' },
    { type: 'divider' },
    { icon: List, action: () => onInsert('- ', ''), title: 'רשימה' },
    { icon: ListOrdered, action: () => onInsert('1. ', ''), title: 'רשימה ממוספרת' },
    { icon: Quote, action: () => onInsert('> ', ''), title: 'ציטוט' },
    { type: 'divider' },
    { icon: Link, action: () => onInsert('[', '](url)'), title: 'קישור' },
    { icon: Image, action: () => onInsert('![תמונה](', ')'), title: 'תמונה' },
  ];

  return (
    <div
      dir="rtl"
      className={cn(
        'flex items-center justify-between px-4 py-2 border-b',
        focusMode ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'
      )}
    >
      <div className="flex items-center gap-1">
        {buttons.map((btn, index) =>
          btn.type === 'divider' ? (
            <div
              key={index}
              className={cn(
                'w-px h-6 mx-2',
                focusMode ? 'bg-stone-600' : 'bg-stone-300'
              )}
            />
          ) : (
            <button
              key={index}
              onClick={btn.action}
              title={btn.title}
              className={cn(
                'p-2 rounded hover:bg-opacity-80 transition-colors',
                focusMode
                  ? 'text-stone-300 hover:bg-stone-700'
                  : 'text-stone-600 hover:bg-stone-200'
              )}
            >
              {btn.icon && <btn.icon className="w-4 h-4" />}
            </button>
          )
        )}
      </div>

      <div className="flex items-center gap-4">
        <span
          className={cn(
            'text-sm',
            focusMode ? 'text-stone-400' : 'text-stone-500'
          )}
        >
          {wordCount.toLocaleString('he-IL')} מילים
        </span>

        {lastSaved && (
          <span
            className={cn(
              'text-xs',
              focusMode ? 'text-stone-500' : 'text-stone-400'
            )}
          >
            נשמר {lastSaved}
          </span>
        )}

        <button
          onClick={onTogglePreview}
          title={showPreview ? 'הסתר תצוגה מקדימה' : 'הצג תצוגה מקדימה'}
          className={cn(
            'p-2 rounded transition-colors',
            focusMode
              ? 'text-stone-300 hover:bg-stone-700'
              : 'text-stone-600 hover:bg-stone-200'
          )}
        >
          {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleFocusMode}
          title={focusMode ? 'יציאה ממצב מיקוד' : 'מצב מיקוד'}
          className={cn(
            'p-2 rounded transition-colors',
            focusMode
              ? 'text-stone-300 hover:bg-stone-700'
              : 'text-stone-600 hover:bg-stone-200'
          )}
        >
          {focusMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded font-medium transition-colors',
            isSaving
              ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </div>
  );
}
