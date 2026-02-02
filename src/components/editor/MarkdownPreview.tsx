'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
    <div
      dir="rtl"
      className={`prose prose-lg prose-stone max-w-none p-6 ${className}`}
      style={{ direction: 'rtl', textAlign: 'right' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 text-stone-800 border-b-2 border-stone-200 pb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-8 mb-4 text-stone-700">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold mt-6 mb-3 text-stone-600">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-stone-700">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 mr-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 mr-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-stone-700">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-r-4 border-amber-400 bg-amber-50 pr-4 py-2 my-4 italic text-stone-600">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-stone-100 text-stone-800 px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-stone-900 text-stone-100 p-4 rounded-lg overflow-x-auto my-4">
                <code className={className}>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-8 border-stone-200" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-stone-200">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-stone-200 bg-stone-100 px-4 py-2 text-right font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-stone-200 px-4 py-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
