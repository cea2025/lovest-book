'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
}

export default function AddChapterModal({ isOpen, onClose, onAdd }: AddChapterModalProps) {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded hover:bg-stone-100"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>

        <h2 className="text-xl font-bold text-stone-800 mb-4">פרק חדש</h2>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-stone-600 mb-2">
            כותרת הפרק
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="הזן כותרת לפרק..."
            autoFocus
            className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-stone-800"
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
            >
              הוסף פרק
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
