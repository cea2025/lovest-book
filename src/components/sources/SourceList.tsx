'use client';

import { useState } from 'react';
import { Search, Filter, Upload, FolderOpen, FileText, File, Trash2 } from 'lucide-react';
import { Source } from '@/lib/db';
import { cn, formatFileSize, getCategoryLabel } from '@/lib/utils';

interface SourceListProps {
  sources: Source[];
  selectedId: string | null;
  onSelect: (source: Source) => void;
  onDelete: (id: string) => void;
  onUpload: () => void;
  onSearch: (query: string) => void;
  onFilterCategory: (category: string | null) => void;
  activeCategory: string | null;
}

const categories = [
  { id: null, label: 'הכל', icon: FolderOpen },
  { id: 'notebooklm', label: 'NotebookLM', icon: FileText },
  { id: 'docs', label: 'מסמכים', icon: File },
  { id: 'notes', label: 'הערות', icon: FileText },
  { id: 'website', label: 'אתר', icon: FileText },
  { id: 'other', label: 'אחר', icon: File },
];

export default function SourceList({
  sources,
  selectedId,
  onSelect,
  onDelete,
  onUpload,
  onSearch,
  onFilterCategory,
  activeCategory,
}: SourceListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'word':
        return '📝';
      case 'markdown':
        return '📋';
      case 'text':
        return '📃';
      default:
        return '📁';
    }
  };

  return (
    <div dir="rtl" className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-800">מקורות</h2>
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            העלאה
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="חיפוש במקורות..."
            className="w-full pr-10 pl-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id || 'all'}
              onClick={() => onFilterCategory(cat.id)}
              className={cn(
                'px-3 py-1 text-sm rounded-full transition-colors',
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source list */}
      <div className="flex-1 overflow-y-auto p-2">
        {sources.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <p>אין מקורות</p>
            <button
              onClick={onUpload}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              העלה מקור ראשון
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className={cn(
                  'group p-3 rounded-lg border cursor-pointer transition-all',
                  selectedId === source.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-stone-200 hover:border-stone-300'
                )}
                onClick={() => onSelect(source)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getFileIcon(source.file_type)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-stone-800 truncate">
                      {source.original_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                      <span className="px-2 py-0.5 bg-stone-100 rounded">
                        {getCategoryLabel(source.category)}
                      </span>
                      <span>{formatFileSize(source.file_size)}</span>
                    </div>
                    {source.tags && source.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {source.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('האם למחוק את המקור?')) {
                        onDelete(source.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-3 border-t border-stone-200 bg-stone-50 text-sm text-stone-500 text-center">
        {sources.length} מקורות | {formatFileSize(sources.reduce((sum, s) => sum + s.file_size, 0))}
      </div>
    </div>
  );
}
