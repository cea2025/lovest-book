'use client';

import { useRef, useEffect } from 'react';

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  focusMode?: boolean;
  fontSize?: number;
}

export default function SimpleEditor({
  value,
  onChange,
  readOnly = false,
  focusMode = false,
  fontSize = 16,
}: SimpleEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return (
    <div className={`h-full ${focusMode ? 'bg-stone-900' : 'bg-white'}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`
          w-full h-full p-5 resize-none border-0 outline-none
          font-sans leading-relaxed
          ${focusMode 
            ? 'bg-stone-900 text-stone-100' 
            : 'bg-white text-gray-900'
          }
        `}
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: "'Noto Sans Hebrew', 'David', sans-serif",
          direction: 'rtl',
          textAlign: 'right',
          lineHeight: '1.8',
        }}
        placeholder="התחל לכתוב כאן..."
      />
    </div>
  );
}
