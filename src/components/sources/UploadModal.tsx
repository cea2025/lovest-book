'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { cn, getCategoryLabel } from '@/lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, category: string, tags: string[]) => Promise<void>;
}

const categories = ['notebooklm', 'docs', 'notes', 'website', 'other'] as const;

export default function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('docs');
  const [tags, setTags] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const parsedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      
      await onUpload(selectedFile, category, parsedTags);
      setSelectedFile(null);
      setTags('');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div dir="rtl" className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1 rounded hover:bg-stone-100"
        >
          <X className="w-5 h-5 text-stone-500" />
        </button>

        <h2 className="text-xl font-bold text-stone-800 mb-4">העלאת מקור</h2>

        {/* Drop zone */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-stone-300',
            selectedFile && 'border-green-500 bg-green-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="text-right">
                <p className="font-medium text-stone-800">{selectedFile.name}</p>
                <p className="text-sm text-stone-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded hover:bg-stone-200"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <p className="text-stone-600 mb-2">גרור קובץ לכאן</p>
              <p className="text-stone-400 text-sm mb-3">או</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                בחר קובץ
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.html"
            className="hidden"
          />
        </div>

        {/* Category */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-600 mb-2">
            קטגוריה
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-lg transition-colors',
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                )}
              >
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-stone-600 mb-2">
            תגיות (מופרדות בפסיק)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="לדוגמה: חשוב, פרק 1, ציטוטים"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg"
          >
            ביטול
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-stone-300 disabled:cursor-not-allowed"
          >
            {isUploading ? 'מעלה...' : 'העלה'}
          </button>
        </div>
      </div>
    </div>
  );
}
