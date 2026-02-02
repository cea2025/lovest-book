'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import EditorToolbar from './EditorToolbar';
import MarkdownPreview from './MarkdownPreview';
import { countWords } from '@/lib/utils';
import { Chapter } from '@/lib/db';

// Dynamic import for WYSIWYG Editor (client-side only)
const WysiwygEditor = dynamic(() => import('./WysiwygEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-stone-100">
      <div className="text-stone-500">טוען עורך...</div>
    </div>
  ),
});

interface ChapterEditorProps {
  chapter: Chapter;
  onSave: (chapter: Partial<Chapter>) => Promise<void>;
}

export default function ChapterEditor({ chapter, onSave }: ChapterEditorProps) {
  const [content, setContent] = useState(chapter.content);
  const [title, setTitle] = useState(chapter.title);
  const [notes, setNotes] = useState(chapter.notes);
  const [showPreview, setShowPreview] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const wordCount = countWords(content);

  // Track changes
  useEffect(() => {
    const changed =
      content !== chapter.content ||
      title !== chapter.title ||
      notes !== chapter.notes;
    setHasChanges(changed);
  }, [content, title, notes, chapter]);

  // Auto-save
  useEffect(() => {
    if (hasChanges) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 30000); // 30 seconds
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, content, title, notes]);

  // Reset when chapter changes
  useEffect(() => {
    setContent(chapter.content);
    setTitle(chapter.title);
    setNotes(chapter.notes);
    setHasChanges(false);
    setLastSaved(null);
  }, [chapter.id]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        id: chapter.id,
        title,
        content,
        notes,
      });
      setLastSaved(new Date().toLocaleTimeString('he-IL'));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [chapter.id, title, content, notes, onSave, isSaving]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, focusMode]);

  const handleInsert = (before: string, after: string = '') => {
    // This is a placeholder - actual insertion is handled by Monaco Editor
    // We'd need to communicate with the editor through a ref
  };

  if (focusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900 flex flex-col">
        <EditorToolbar
          onInsert={handleInsert}
          onSave={handleSave}
          isSaving={isSaving}
          focusMode={true}
          onToggleFocusMode={() => setFocusMode(false)}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
          wordCount={wordCount}
          lastSaved={lastSaved || undefined}
        />
        <div className="flex-1 max-w-4xl mx-auto w-full">
          <WysiwygEditor
            value={content}
            onChange={setContent}
            focusMode={true}
            fontSize={18}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Title */}
      <div className="px-6 py-4 border-b border-stone-200 bg-white">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="כותרת הפרק"
          dir="rtl"
          className="w-full text-2xl font-bold text-stone-800 bg-transparent border-none outline-none placeholder:text-stone-300"
        />
        {hasChanges && (
          <span className="text-xs text-amber-600 mt-1">יש שינויים שלא נשמרו</span>
        )}
      </div>

      {/* Toolbar */}
      <EditorToolbar
        onInsert={handleInsert}
        onSave={handleSave}
        isSaving={isSaving}
        focusMode={false}
        onToggleFocusMode={() => setFocusMode(true)}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview(!showPreview)}
        wordCount={wordCount}
        lastSaved={lastSaved || undefined}
      />

      {/* Editor/Preview */}
      <div className="flex-1 flex overflow-hidden">
        <div className={showPreview ? 'w-1/2' : 'w-full'}>
          <WysiwygEditor
            value={content}
            onChange={setContent}
            focusMode={false}
          />
        </div>

        {showPreview && (
          <div className="w-1/2 border-r border-stone-200 overflow-y-auto bg-white">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* Notes panel */}
      <div className="border-t border-stone-200 bg-stone-50">
        <details className="group">
          <summary className="px-4 py-2 cursor-pointer text-sm font-medium text-stone-600 hover:text-stone-800">
            הערות עורך
          </summary>
          <div className="px-4 pb-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות פנימיות לפרק זה..."
              dir="rtl"
              className="w-full h-24 p-3 text-sm border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </details>
      </div>
    </div>
  );
}
