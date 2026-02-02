'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import ChapterItem from './ChapterItem';
import { Chapter } from '@/lib/db';
import { Plus } from 'lucide-react';

interface ChapterListProps {
  chapters: Chapter[];
  selectedId: string | null;
  onSelect: (chapter: Chapter) => void;
  onReorder: (chapters: { id: string; order_index: number }[]) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'draft' | 'editing' | 'ready') => void;
}

export default function ChapterList({
  chapters,
  selectedId,
  onSelect,
  onReorder,
  onAdd,
  onDelete,
  onStatusChange,
}: ChapterListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = chapters.findIndex((c) => c.id === active.id);
      const newIndex = chapters.findIndex((c) => c.id === over.id);

      const reordered = arrayMove(chapters, oldIndex, newIndex);
      const updates = reordered.map((chapter, index) => ({
        id: chapter.id,
        order_index: index,
      }));

      onReorder(updates);
    }
  };

  const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);
  const readyCount = chapters.filter((c) => c.status === 'ready').length;

  return (
    <div dir="rtl" className="h-full flex flex-col bg-white border-l border-stone-200">
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-stone-800">פרקים</h2>
          <button
            onClick={onAdd}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            title="הוסף פרק"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between text-sm text-stone-500">
          <span>{chapters.length} פרקים</span>
          <span>{totalWords.toLocaleString('he-IL')} מילים</span>
        </div>
        <div className="mt-2 bg-stone-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${chapters.length > 0 ? (readyCount / chapters.length) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1 text-center">
          {readyCount} מתוך {chapters.length} מוכנים
        </p>
      </div>

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto p-2">
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <p>אין פרקים עדיין</p>
            <button
              onClick={onAdd}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              הוסף פרק ראשון
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={chapters.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {chapters.map((chapter, index) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  isSelected={chapter.id === selectedId}
                  onSelect={() => onSelect(chapter)}
                  onDelete={() => onDelete(chapter.id)}
                  onStatusChange={(status) => onStatusChange(chapter.id, status)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
