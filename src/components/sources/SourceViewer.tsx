'use client';

import { useState } from 'react';
import { X, Tag, Link2, Star, Copy, Check } from 'lucide-react';
import { Source, Chapter } from '@/lib/db';
import { cn, formatFileSize, getCategoryLabel, formatDate } from '@/lib/utils';

interface SourceViewerProps {
  source: Source;
  chapters: Chapter[];
  onClose: () => void;
  onUpdateTags: (tags: string[]) => void;
  onAddHighlight: (text: string) => void;
  onLinkChapter: (chapterId: string) => void;
}

export default function SourceViewer({
  source,
  chapters,
  onClose,
  onUpdateTags,
  onAddHighlight,
  onLinkChapter,
}: SourceViewerProps) {
  const [newTag, setNewTag] = useState('');
  const [newHighlight, setNewHighlight] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddTag = () => {
    if (newTag.trim()) {
      onUpdateTags([...source.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    onUpdateTags(source.tags.filter((t) => t !== tag));
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      onAddHighlight(newHighlight.trim());
      setNewHighlight('');
    }
  };

  const copyHighlight = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div dir="rtl" className="h-full flex flex-col bg-white border-r border-stone-200">
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-800">{source.original_name}</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
              <span className="px-2 py-0.5 bg-stone-100 rounded">
                {getCategoryLabel(source.category)}
              </span>
              <span>{formatFileSize(source.file_size)}</span>
              <span>•</span>
              <span>{formatDate(source.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100">
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Tags */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-stone-600 mb-2">
            <Tag className="w-4 h-4" />
            תגיות
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {source.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-amber-100 text-amber-700 text-sm rounded flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-amber-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="הוסף תגית..."
              className="flex-1 px-3 py-1.5 border border-stone-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:bg-stone-200"
            >
              הוסף
            </button>
          </div>
        </div>

        {/* Linked chapters */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-stone-600 mb-2">
            <Link2 className="w-4 h-4" />
            פרקים מקושרים
          </h3>
          <div className="space-y-1 mb-2">
            {source.linked_chapters.length === 0 ? (
              <p className="text-sm text-stone-400">אין פרקים מקושרים</p>
            ) : (
              source.linked_chapters.map((chapterId) => {
                const chapter = chapters.find((c) => c.id === chapterId);
                return chapter ? (
                  <div
                    key={chapterId}
                    className="flex items-center justify-between px-3 py-2 bg-stone-50 rounded"
                  >
                    <span className="text-sm text-stone-700">{chapter.title}</span>
                  </div>
                ) : null;
              })
            )}
          </div>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onLinkChapter(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-1.5 border border-stone-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">קשר לפרק...</option>
            {chapters
              .filter((c) => !source.linked_chapters.includes(c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
          </select>
        </div>

        {/* Highlights */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-medium text-stone-600 mb-2">
            <Star className="w-4 h-4" />
            קטעים מועדפים
          </h3>
          <div className="space-y-2 mb-2">
            {source.highlights.length === 0 ? (
              <p className="text-sm text-stone-400">אין קטעים מועדפים</p>
            ) : (
              source.highlights.map((highlight, i) => (
                <div
                  key={i}
                  className="relative group p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-stone-700"
                >
                  {highlight}
                  <button
                    onClick={() => copyHighlight(highlight, `h-${i}`)}
                    className="absolute top-2 left-2 p-1 rounded hover:bg-yellow-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="העתק"
                  >
                    {copiedId === `h-${i}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-col gap-2">
            <textarea
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              placeholder="הוסף קטע מועדף..."
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddHighlight}
              disabled={!newHighlight.trim()}
              className="self-end px-3 py-1.5 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:bg-stone-200"
            >
              הוסף קטע
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
