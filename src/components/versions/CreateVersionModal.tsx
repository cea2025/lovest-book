'use client';

import { useState } from 'react';
import { X, Save } from 'lucide-react';

interface CreateVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
  bookType: 'book' | 'booklet';
}

export default function CreateVersionModal({
  isOpen,
  onClose,
  onCreate,
  bookType,
}: CreateVersionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim(), description.trim());
      setName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Failed to create version:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const suggestedNames = [
    'טיוטה ראשונה',
    'גרסה לעריכה',
    'לאחר תיקונים',
    'גרסה סופית',
    `גרסה ${new Date().toLocaleDateString('he-IL')}`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded hover:bg-stone-100"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>

        <h2 className="flex items-center gap-2 text-xl font-bold text-stone-800 mb-2">
          <Save className="w-5 h-5" />
          שמירת גרסה
        </h2>
        <p className="text-sm text-stone-500 mb-4">
          {bookType === 'book' ? 'ספר מלא' : 'חוברת'} - צילום מצב נוכחי
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-stone-600 mb-2">
              שם הגרסה
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="לדוגמה: טיוטה ראשונה"
              autoFocus
              className="w-full px-4 py-3 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestedNames.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setName(suggestion)}
                  className="px-2 py-1 text-xs bg-stone-100 text-stone-600 rounded hover:bg-stone-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-600 mb-2">
              תיאור (אופציונלי)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="מה השתנה בגרסה זו?"
              rows={3}
              className="w-full px-4 py-3 border border-stone-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isCreating}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isCreating ? 'שומר...' : 'שמור גרסה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
