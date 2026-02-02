'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, MoreVertical } from 'lucide-react';
import { Chapter } from '@/lib/db';
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface ChapterItemProps {
  chapter: Chapter;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'draft' | 'editing' | 'ready') => void;
}

export default function ChapterItem({
  chapter,
  index,
  isSelected,
  onSelect,
  onDelete,
  onStatusChange,
}: ChapterItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group mb-2 rounded-lg border transition-all',
        isDragging ? 'opacity-50 shadow-lg' : '',
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-stone-200 bg-white hover:border-stone-300'
      )}
    >
      <div className="flex items-center p-3">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-stone-100 cursor-grab active:cursor-grabbing ml-2"
        >
          <GripVertical className="w-4 h-4 text-stone-400" />
        </button>

        {/* Chapter number */}
        <span className="w-6 h-6 flex items-center justify-center bg-stone-100 rounded text-sm font-medium text-stone-600 ml-3">
          {index + 1}
        </span>

        {/* Chapter info */}
        <button
          onClick={onSelect}
          className="flex-1 text-right min-w-0"
        >
          <h3 className="font-medium text-stone-800 truncate">
            {chapter.title || 'ללא כותרת'}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xs px-2 py-0.5 rounded', getStatusColor(chapter.status))}>
              {getStatusLabel(chapter.status)}
            </span>
            <span className="text-xs text-stone-400">
              {chapter.word_count.toLocaleString('he-IL')} מילים
            </span>
          </div>
        </button>

        {/* Actions menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-stone-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-stone-400" />
          </button>

          {showMenu && (
            <div className="absolute left-0 top-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-10 min-w-[150px]">
              <div className="p-1">
                <p className="px-2 py-1 text-xs font-medium text-stone-400">שנה סטטוס</p>
                {(['draft', 'editing', 'ready'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusChange(status);
                      setShowMenu(false);
                    }}
                    className={cn(
                      'w-full text-right px-2 py-1.5 text-sm rounded hover:bg-stone-100',
                      chapter.status === status && 'bg-stone-100'
                    )}
                  >
                    <span className={cn('inline-block w-2 h-2 rounded-full ml-2', {
                      'bg-gray-400': status === 'draft',
                      'bg-yellow-400': status === 'editing',
                      'bg-green-400': status === 'ready',
                    })} />
                    {getStatusLabel(status)}
                  </button>
                ))}
              </div>
              <div className="border-t border-stone-200 p-1">
                <button
                  onClick={() => {
                    if (confirm('האם למחוק את הפרק?')) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full text-right px-2 py-1.5 text-sm text-red-600 rounded hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק פרק
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
