"use client";

import { useState, useEffect, useRef } from "react";

// Load KaTeX dynamically on client
if (typeof window !== 'undefined' && !(window as any).katex) {
  import('katex').then((katex) => {
    (window as any).katex = katex.default;
  });
}

interface MathInputModalProps {
  isOpen: boolean;
  initialValue?: string;
  type: 'inline' | 'block';
  onSave: (latex: string) => void;
  onClose: () => void;
}

export default function MathInputModal({
  isOpen,
  initialValue = "",
  type,
  onSave,
  onClose,
}: MathInputModalProps) {
  const [latex, setLatex] = useState(initialValue);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLatex(initialValue);
  }, [initialValue, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(latex);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {type === 'inline' ? 'Inline Math' : 'Block Math'} (LaTeX)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LaTeX Expression
          </label>
          <textarea
            ref={inputRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={type === 'block' ? 6 : 3}
            placeholder={type === 'inline' ? 'e.g., x^2 + y^2 = r^2' : 'e.g., \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}'}
          />
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="border border-gray-200 rounded-md p-3 bg-gray-50 min-h-[60px] flex items-center justify-center">
            {latex ? (
              <div 
                className="katex-preview"
                dangerouslySetInnerHTML={{
                  __html: renderLatexPreview(latex, type)
                }}
              />
            ) : (
              <span className="text-gray-400 text-sm">Preview will appear here...</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer hover:text-gray-900 font-medium mb-2">
              Common LaTeX Commands
            </summary>
            <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200">
              <p><code className="bg-gray-100 px-1">x^2</code> - Superscript (x²)</p>
              <p><code className="bg-gray-100 px-1">x_1</code> - Subscript (x₁)</p>
              <p><code className="bg-gray-100 px-1">\frac{"{a}{b}"}</code> - Fraction (a/b)</p>
              <p><code className="bg-gray-100 px-1">\sqrt{"{x}"}</code> - Square root (√x)</p>
              <p><code className="bg-gray-100 px-1">\sum</code> - Summation (Σ)</p>
              <p><code className="bg-gray-100 px-1">\int</code> - Integral (∫)</p>
              <p><code className="bg-gray-100 px-1">\alpha, \beta, \gamma</code> - Greek letters (α, β, γ)</p>
            </div>
          </details>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Insert (Ctrl+Enter)
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple preview renderer using KaTeX
function renderLatexPreview(latex: string, type: 'inline' | 'block'): string {
  try {
    // Load katex dynamically
    if (typeof window !== 'undefined' && (window as any).katex) {
      const katex = (window as any).katex;
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode: type === 'block',
      });
    }
  } catch (error) {
    console.error('KaTeX render error:', error);
  }
  
  // Fallback: just show the latex
  return `<code>${latex}</code>`;
}

