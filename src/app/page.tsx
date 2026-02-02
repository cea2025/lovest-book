'use client';

import { useState, useEffect, useCallback } from 'react';
import { Book, BookOpen, FileText, FolderOpen, Download, Settings, BarChart3 } from 'lucide-react';
import ChapterList from '@/components/chapters/ChapterList';
import ChapterEditor from '@/components/editor/ChapterEditor';
import AddChapterModal from '@/components/chapters/AddChapterModal';
import SourceList from '@/components/sources/SourceList';
import UploadModal from '@/components/sources/UploadModal';
import SourceViewer from '@/components/sources/SourceViewer';
import VersionList from '@/components/versions/VersionList';
import CreateVersionModal from '@/components/versions/CreateVersionModal';
import ExportPanel from '@/components/export/ExportPanel';
import { Chapter, Source, Version } from '@/lib/db';
import { cn } from '@/lib/utils';

type Tab = 'editor' | 'sources' | 'versions' | 'export';
type BookType = 'book' | 'booklet';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const [bookType, setBookType] = useState<BookType>('book');
  
  // Chapters state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  
  // Sources state
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [sourceCategory, setSourceCategory] = useState<string | null>(null);
  const [sourceSearch, setSourceSearch] = useState('');
  
  // Versions state
  const [versions, setVersions] = useState<Version[]>([]);
  const [showCreateVersion, setShowCreateVersion] = useState(false);

  // Fetch chapters
  const fetchChapters = useCallback(async () => {
    try {
      const res = await fetch(`/api/chapters?bookType=${bookType}`);
      const data = await res.json();
      setChapters(data);
      
      // Select first chapter if none selected
      if (data.length > 0 && !selectedChapter) {
        setSelectedChapter(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch chapters:', error);
    }
  }, [bookType]);

  // Fetch sources
  const fetchSources = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sourceCategory) params.append('category', sourceCategory);
      if (sourceSearch) params.append('search', sourceSearch);
      
      const res = await fetch(`/api/sources?${params}`);
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  }, [sourceCategory, sourceSearch]);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/versions?bookType=${bookType}`);
      const data = await res.json();
      setVersions(data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  }, [bookType]);

  useEffect(() => {
    fetchChapters();
  }, [fetchChapters]);

  useEffect(() => {
    if (activeTab === 'sources') {
      fetchSources();
    }
  }, [activeTab, fetchSources]);

  useEffect(() => {
    if (activeTab === 'versions') {
      fetchVersions();
    }
  }, [activeTab, fetchVersions]);

  // Reset selected chapter when book type changes
  useEffect(() => {
    setSelectedChapter(null);
  }, [bookType]);

  // Chapter handlers
  const handleAddChapter = async (title: string) => {
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, bookType }),
      });
      const newChapter = await res.json();
      setChapters([...chapters, newChapter]);
      setSelectedChapter(newChapter);
    } catch (error) {
      console.error('Failed to add chapter:', error);
    }
  };

  const handleSaveChapter = async (updates: Partial<Chapter>) => {
    if (!updates.id) return;
    
    try {
      const res = await fetch(`/api/chapters/${updates.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const updated = await res.json();
      
      setChapters(chapters.map(c => c.id === updated.id ? updated : c));
      if (selectedChapter?.id === updated.id) {
        setSelectedChapter(updated);
      }
    } catch (error) {
      console.error('Failed to save chapter:', error);
    }
  };

  const handleDeleteChapter = async (id: string) => {
    try {
      await fetch(`/api/chapters/${id}`, { method: 'DELETE' });
      const filtered = chapters.filter(c => c.id !== id);
      setChapters(filtered);
      
      if (selectedChapter?.id === id) {
        setSelectedChapter(filtered[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error);
    }
  };

  const handleReorderChapters = async (updates: { id: string; order_index: number }[]) => {
    try {
      await fetch('/api/chapters/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: updates }),
      });
      
      // Update local state with new order
      const reordered = [...chapters].sort((a, b) => {
        const aOrder = updates.find(u => u.id === a.id)?.order_index ?? a.order_index;
        const bOrder = updates.find(u => u.id === b.id)?.order_index ?? b.order_index;
        return aOrder - bOrder;
      });
      setChapters(reordered);
    } catch (error) {
      console.error('Failed to reorder chapters:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'editing' | 'ready') => {
    await handleSaveChapter({ id, status });
  };

  // Source handlers
  const handleUpload = async (file: File, category: string, tags: string[]) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tags));

    try {
      await fetch('/api/sources/upload', {
        method: 'POST',
        body: formData,
      });
      fetchSources();
    } catch (error) {
      console.error('Failed to upload:', error);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      setSources(sources.filter(s => s.id !== id));
      if (selectedSource?.id === id) {
        setSelectedSource(null);
      }
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const handleUpdateSourceTags = async (tags: string[]) => {
    if (!selectedSource) return;
    try {
      const res = await fetch(`/api/sources/${selectedSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      const updated = await res.json();
      setSources(sources.map(s => s.id === updated.id ? updated : s));
      setSelectedSource(updated);
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const handleAddHighlight = async (text: string) => {
    if (!selectedSource) return;
    const highlights = [...selectedSource.highlights, text];
    try {
      const res = await fetch(`/api/sources/${selectedSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlights }),
      });
      const updated = await res.json();
      setSources(sources.map(s => s.id === updated.id ? updated : s));
      setSelectedSource(updated);
    } catch (error) {
      console.error('Failed to add highlight:', error);
    }
  };

  const handleLinkChapter = async (chapterId: string) => {
    if (!selectedSource) return;
    const linked = [...selectedSource.linked_chapters, chapterId];
    try {
      const res = await fetch(`/api/sources/${selectedSource.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linked_chapters: linked }),
      });
      const updated = await res.json();
      setSources(sources.map(s => s.id === updated.id ? updated : s));
      setSelectedSource(updated);
    } catch (error) {
      console.error('Failed to link chapter:', error);
    }
  };

  // Version handlers
  const handleCreateVersion = async (name: string, description: string) => {
    try {
      await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookType, versionName: name, description }),
      });
      fetchVersions();
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const totalWords = chapters.reduce((sum, c) => sum + c.word_count, 0);

  const tabs = [
    { id: 'editor' as Tab, label: 'עריכה', icon: FileText },
    { id: 'sources' as Tab, label: 'מקורות', icon: FolderOpen },
    { id: 'versions' as Tab, label: 'גרסאות', icon: Book },
    { id: 'export' as Tab, label: 'ייצוא', icon: Download },
  ];

  return (
    <div className="h-screen flex flex-col bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              מערכת כתיבת ספר
            </h1>
            
            {/* Book type toggle */}
            <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1">
              <button
                onClick={() => setBookType('book')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  bookType === 'book'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-stone-600 hover:text-stone-800'
                )}
              >
                ספר מלא
              </button>
              <button
                onClick={() => setBookType('booklet')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  bookType === 'booklet'
                    ? 'bg-white shadow text-blue-600'
                    : 'text-stone-600 hover:text-stone-800'
                )}
              >
                חוברת
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-stone-600">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              {chapters.length} פרקים
            </span>
            <span>{totalWords.toLocaleString('he-IL')} מילים</span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1 mt-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-stone-100 text-blue-600 border-b-2 border-blue-600'
                  : 'text-stone-600 hover:text-stone-800 hover:bg-stone-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <div className="h-full flex">
            {/* Chapter list */}
            <div className="w-72 flex-shrink-0">
              <ChapterList
                chapters={chapters}
                selectedId={selectedChapter?.id || null}
                onSelect={setSelectedChapter}
                onReorder={handleReorderChapters}
                onAdd={() => setShowAddChapter(true)}
                onDelete={handleDeleteChapter}
                onStatusChange={handleStatusChange}
              />
            </div>

            {/* Editor */}
            <div className="flex-1 bg-white">
              {selectedChapter ? (
                <ChapterEditor
                  chapter={selectedChapter}
                  onSave={handleSaveChapter}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-stone-400">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>בחר פרק לעריכה או צור פרק חדש</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="h-full flex">
            <div className="w-96 flex-shrink-0">
              <SourceList
                sources={sources}
                selectedId={selectedSource?.id || null}
                onSelect={setSelectedSource}
                onDelete={handleDeleteSource}
                onUpload={() => setShowUpload(true)}
                onSearch={setSourceSearch}
                onFilterCategory={setSourceCategory}
                activeCategory={sourceCategory}
              />
            </div>
            
            {selectedSource && (
              <div className="w-96 flex-shrink-0">
                <SourceViewer
                  source={selectedSource}
                  chapters={chapters}
                  onClose={() => setSelectedSource(null)}
                  onUpdateTags={handleUpdateSourceTags}
                  onAddHighlight={handleAddHighlight}
                  onLinkChapter={handleLinkChapter}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="h-full max-w-2xl mx-auto p-6">
            <VersionList
              versions={versions}
              onCreateVersion={() => setShowCreateVersion(true)}
              onViewVersion={(v) => {
                // Open folder in file explorer
                console.log('View version:', v.snapshot_path);
              }}
              bookType={bookType}
            />
          </div>
        )}

        {activeTab === 'export' && (
          <div className="h-full max-w-2xl mx-auto p-6">
            <ExportPanel
              bookType={bookType}
              chapterCount={chapters.length}
              wordCount={totalWords}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AddChapterModal
        isOpen={showAddChapter}
        onClose={() => setShowAddChapter(false)}
        onAdd={handleAddChapter}
      />

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      <CreateVersionModal
        isOpen={showCreateVersion}
        onClose={() => setShowCreateVersion(false)}
        onCreate={handleCreateVersion}
        bookType={bookType}
      />
    </div>
  );
}
