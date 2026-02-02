import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function countWords(text: string): number {
  if (!text) return 0;
  // Handle Hebrew and English text
  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
  return words.length;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-200 text-gray-700';
    case 'editing':
      return 'bg-yellow-200 text-yellow-800';
    case 'ready':
      return 'bg-green-200 text-green-800';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'טיוטה';
    case 'editing':
      return 'בעריכה';
    case 'ready':
      return 'מוכן';
    default:
      return status;
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'notebooklm':
      return 'NotebookLM';
    case 'docs':
      return 'מסמכים';
    case 'notes':
      return 'הערות';
    case 'website':
      return 'אתר';
    case 'other':
      return 'אחר';
    default:
      return category;
  }
}
