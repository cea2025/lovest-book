'use client';

import { useState } from 'react';
import { History, Plus, Download, FolderOpen, Clock, FileText } from 'lucide-react';
import { Version } from '@/lib/db';
import { formatDate } from '@/lib/utils';

interface VersionListProps {
  versions: Version[];
  onCreateVersion: () => void;
  onViewVersion: (version: Version) => void;
  bookType: 'book' | 'booklet';
}

export default function VersionList({
  versions,
  onCreateVersion,
  onViewVersion,
  bookType,
}: VersionListProps) {
  return (
    <div dir="rtl" className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
            <History className="w-5 h-5" />
            גרסאות
          </h2>
          <button
            onClick={onCreateVersion}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            שמור גרסה
          </button>
        </div>
        <p className="text-sm text-stone-500">
          {bookType === 'book' ? 'ספר מלא' : 'חוברת'}
        </p>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto p-4">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין גרסאות שמורות</p>
            <p className="text-sm mt-1">שמור גרסה כדי לעקוב אחר ההתקדמות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="p-4 border border-stone-200 rounded-lg hover:border-stone-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-stone-800 flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-700 rounded text-sm font-bold">
                        {versions.length - index}
                      </span>
                      {version.version_name}
                    </h3>
                    {version.description && (
                      <p className="text-sm text-stone-500 mt-1">{version.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(version.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onViewVersion(version)}
                    className="p-2 rounded hover:bg-stone-100"
                    title="צפה בגרסה"
                  >
                    <FolderOpen className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
