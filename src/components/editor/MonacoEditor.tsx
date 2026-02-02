'use client';

import { useRef, useCallback, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  focusMode?: boolean;
  fontSize?: number;
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'markdown',
  readOnly = false,
  focusMode = false,
  fontSize = 16,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add custom keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
      wrapSelection('**', '**');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
      wrapSelection('*', '*');
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyU, () => {
      wrapSelection('<u>', '</u>');
    });

    // Focus the editor
    editor.focus();
  };

  const wrapSelection = (before: string, after: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);
    const newText = `${before}${selectedText}${after}`;

    editor.executeEdits('wrap-selection', [
      {
        range: selection,
        text: newText,
        forceMoveMarkers: true,
      },
    ]);

    // Adjust cursor position
    if (!selectedText) {
      const newPosition = {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + before.length,
      };
      editor.setPosition(newPosition);
    }
  };

  const handleChange: OnChange = (newValue) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  return (
    <div className={`h-full ${focusMode ? 'bg-stone-900' : 'bg-white'}`}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme={focusMode ? 'vs-dark' : 'vs'}
        options={{
          fontSize,
          fontFamily: "'Noto Sans Hebrew', 'David', sans-serif",
          lineNumbers: focusMode ? 'off' : 'on',
          minimap: { enabled: !focusMode },
          wordWrap: 'on',
          wrappingIndent: 'same',
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20, bottom: 20 },
          lineHeight: 1.8,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          renderWhitespace: 'none',
          guides: {
            indentation: false,
          },
          folding: !focusMode,
          glyphMargin: false,
          renderLineHighlight: focusMode ? 'none' : 'line',
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          scrollbar: {
            vertical: focusMode ? 'hidden' : 'auto',
            horizontal: 'hidden',
            verticalScrollbarSize: 10,
          },
        }}
      />
    </div>
  );
}
