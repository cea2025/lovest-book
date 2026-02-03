'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignRight,
  AlignCenter,
  AlignLeft,
} from 'lucide-react';

interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  focusMode?: boolean;
  fontSize?: number;
}

// Convert Markdown to HTML for initial load
function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered list
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .split('\n\n')
    .map(block => {
      if (block.startsWith('<h') || block.startsWith('<blockquote') || block.startsWith('<hr') || block.startsWith('<li')) {
        return block;
      }
      if (block.trim()) {
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
      }
      return '';
    })
    .join('');
  
  // Wrap consecutive li elements in ul
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  
  return html;
}

// Convert HTML back to Markdown for saving
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  
  let markdown = html
    // Headers
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    // Bold
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    // Italic
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    // Underline (keep as HTML since markdown doesn't support it)
    .replace(/<u>(.*?)<\/u>/gi, '<u>$1</u>')
    // Blockquote
    .replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n\n')
    .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
    // Lists
    .replace(/<ul>[\s\S]*?<\/ul>/gi, (match) => {
      return match.replace(/<li>(.*?)<\/li>/gi, '- $1\n') + '\n';
    })
    .replace(/<ol>[\s\S]*?<\/ol>/gi, (match) => {
      let index = 1;
      return match.replace(/<li>(.*?)<\/li>/gi, () => `${index++}. $1\n`) + '\n';
    })
    // Horizontal rule
    .replace(/<hr\s*\/?>/gi, '---\n\n')
    // Paragraphs and breaks
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return markdown;
}

export default function WysiwygEditor({
  value,
  onChange,
  readOnly = false,
  focusMode = false,
  fontSize = 16,
}: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Placeholder.configure({
        placeholder: 'התחל לכתוב כאן...',
      }),
    ],
    content: markdownToHtml(value),
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-full',
        dir: 'rtl',
        style: `font-size: ${fontSize}px; line-height: 1.8;`,
      },
    },
  });

  // Update content when value changes externally
  useEffect(() => {
    if (editor && value !== htmlToMarkdown(editor.getHTML())) {
      editor.commands.setContent(markdownToHtml(value));
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-stone-500">טוען עורך...</div>
      </div>
    );
  }

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-stone-100 transition-colors ${
        active ? 'bg-blue-100 text-blue-600' : 'text-stone-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`h-full flex flex-col ${focusMode ? 'bg-stone-900' : 'bg-white'}`}>
      {/* Toolbar */}
      {!focusMode && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-stone-200 bg-stone-50">
          {/* Undo/Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="בטל"
          >
            <Undo size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="חזור"
          >
            <Redo size={18} />
          </ToolbarButton>

          <div className="w-px h-6 bg-stone-300 mx-1" />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="מודגש"
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="נטוי"
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="קו תחתון"
          >
            <UnderlineIcon size={18} />
          </ToolbarButton>

          <div className="w-px h-6 bg-stone-300 mx-1" />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="כותרת 1"
          >
            <Heading1 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="כותרת 2"
          >
            <Heading2 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="כותרת 3"
          >
            <Heading3 size={18} />
          </ToolbarButton>

          <div className="w-px h-6 bg-stone-300 mx-1" />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="רשימה"
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="רשימה ממוספרת"
          >
            <ListOrdered size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="ציטוט"
          >
            <Quote size={18} />
          </ToolbarButton>

          <div className="w-px h-6 bg-stone-300 mx-1" />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="יישור לימין"
          >
            <AlignRight size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="יישור למרכז"
          >
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="יישור לשמאל"
          >
            <AlignLeft size={18} />
          </ToolbarButton>
        </div>
      )}

      {/* Editor Content */}
      <div className={`flex-1 overflow-y-auto p-6 ${focusMode ? 'text-stone-100' : ''}`}>
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
