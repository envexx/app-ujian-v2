"use client";

import React, { useRef, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Conditionally import react-quill CSS (only if available)
if (typeof window !== "undefined") {
  try {
    require("react-quill/dist/quill.snow.css");
  } catch (e) {
    // Silently fail if react-quill is not installed
  }
}

// React 19 compatibility: Polyfill for findDOMNode
if (typeof window !== "undefined") {
  try {
    const ReactDOM = require("react-dom");
    if (ReactDOM && typeof ReactDOM.findDOMNode !== "function") {
      ReactDOM.findDOMNode = function(componentOrElement: any): Element | Text | null {
        if (componentOrElement == null) return null;
        if (componentOrElement.nodeType === 1 || componentOrElement.nodeType === 3) {
          return componentOrElement;
        }
        if (typeof componentOrElement === "object" && "current" in componentOrElement) {
          const current = componentOrElement.current;
          if (current && (current.nodeType === 1 || current.nodeType === 3)) {
            return current;
          }
        }
        return null;
      };
    }
  } catch (e) {
    // Silently fail
  }
}

// Fallback component when react-quill is not available
const FallbackEditor = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full min-h-[200px] p-3 border rounded-md"
  />
);

// Dynamically import ReactQuill with error handling
// Note: react-quill is not compatible with React 19, so we use a fallback
let ReactQuill: any = FallbackEditor;

if (typeof window !== "undefined") {
  try {
    // @ts-ignore - react-quill may not be installed
    ReactQuill = dynamic(() => import("react-quill"), {
      ssr: false,
      loading: () => (
        <div className="border rounded-md p-3 min-h-[80px]">
          <p className="text-muted-foreground text-sm">Loading editor...</p>
        </div>
      ),
    });
  } catch (e) {
    // Use fallback if react-quill is not available
    ReactQuill = FallbackEditor;
  }
}

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}

// Convert angka ke Unicode superscript
const superscriptMap: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
};

function toSuperscript(num: string): string {
  return num.split('').map(char => superscriptMap[char] || char).join('');
}

// Convert simple math expressions to Unicode superscript (seperti di Word)
// Examples: 5x2 → 5x², 11y2 → 11y², x2 → x²
function convertMathToUnicode(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let result = text;
  
  // Pattern 1: angka + variabel + angka (pangkat dengan koefisien)
  // Contoh: 5x2 → 5x², 11y2 → 11y²
  result = result.replace(/(\d+)([a-zA-Z])(\d+)(?![a-zA-Z0-9²³⁴⁵⁶⁷⁸⁹⁰¹])/g, function(_match, coef, varName, exp) {
    return coef + varName + toSuperscript(exp);
  });
  
  // Pattern 2: variabel + angka (pangkat tanpa koefisien)
  // Contoh: x2 → x², y3 → y³
  // Skip jika sebelumnya ada angka (sudah ditangani pattern 1)
  result = result.replace(/([^0-9]|^)([a-zA-Z])(\d+)(?![a-zA-Z0-9²³⁴⁵⁶⁷⁸⁹⁰¹])/g, function(match, prefix, varName, exp) {
    // Jika prefix adalah angka, skip (sudah ditangani)
    if (/^\d+$/.test(prefix)) {
      return match;
    }
    return prefix + varName + toSuperscript(exp);
  });
  
  return result;
}

// Legacy function untuk LaTeX (masih digunakan untuk modal)
function convertMathToLatex(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  let result = text.trim();
  
  // Pattern 1: angka + variabel + angka (pangkat dengan koefisien)
  result = result.replace(/(\d+)([a-zA-Z])(\d+)(?![a-zA-Z0-9^_*])/g, function(_match, coef, varName, exp) {
    return coef + varName + '^{' + exp + '}';
  });
  
  // Pattern 2: variabel + angka (pangkat tanpa koefisien)
  result = result.replace(/([^0-9]|^)([a-zA-Z])(\d+)(?![a-zA-Z0-9^_*])/g, function(match, prefix, varName, exp) {
    if (/^\d+$/.test(prefix)) {
      return match;
    }
    return prefix + varName + '^{' + exp + '}';
  });
  
  return result;
}

// Detect and process math expressions in plain text
function detectAndConvertMath(text: string): { latex: string; original: string } | null {
  if (!text || typeof text !== 'string') return null;
  
  // Pattern untuk mendeteksi ekspresi matematika
  // Format: mengandung variabel dan angka, dengan operator matematika
  // Contoh: "5x2 + 4xy + 11y2 = 3"
  const mathPattern = /[\d\s]*[a-zA-Z]\d+[\s]*[+\-×÷=<>≤≥≠±√∑∏∫\s]*[\d\s]*[a-zA-Z]*\d*[\s]*[+\-×÷=<>≤≥≠±√∑∏∫\s]*[\d\s]*/;
  
  const trimmed = text.trim();
  if (trimmed.length < 2) return null;
  
  // Check if it looks like a math expression
  const hasVariable = /[a-zA-Z]/.test(trimmed);
  const hasNumber = /\d/.test(trimmed);
  const hasMathOp = /[+\-×÷=<>≤≥≠±√∑∏∫]/.test(trimmed);
  
  if (hasVariable && (hasNumber || hasMathOp)) {
    const latex = convertMathToLatex(trimmed);
    if (latex !== trimmed) {
      return { latex, original: trimmed };
    }
  }
  
  return null;
}

// Math Formula Modal
function MathModal({
  formula,
  setFormula,
  onInsert,
  onClose,
}: {
  formula: string;
  setFormula: (value: string) => void;
  onInsert: () => void;
  onClose: () => void;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [katex, setKatex] = useState<any>(null);

  // Load KaTeX
  useEffect(() => {
    if (typeof window !== "undefined" && !katex) {
      Promise.all([
        import("katex"),
        // @ts-expect-error - KaTeX CSS doesn't have type definitions
        import("katex/dist/katex.min.css"),
      ])
        .then(([katexModule]) => {
          setKatex(katexModule.default);
        })
        .catch((err) => {
          console.error("Failed to load KaTeX:", err);
        });
    }
  }, [katex]);

  // Render preview
  useEffect(() => {
    if (!previewRef.current || !katex) return;

    if (formula.trim()) {
      try {
        previewRef.current.innerHTML = "";
        katex.render(formula, previewRef.current, {
          throwOnError: false,
          displayMode: false,
        });
        setError("");
      } catch (e) {
        setError("Invalid LaTeX");
        previewRef.current.innerHTML = "";
      }
    } else {
      previewRef.current.innerHTML = "";
      setError("");
    }
  }, [formula, katex]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">Insert Math Formula</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Masukkan formula LaTeX (contoh: x^2 + y^2 = r^2)
        </p>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">LaTeX Code:</label>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="x^2 + y^2 = r^2"
            className="w-full border rounded p-2 font-mono text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey && formula.trim() && !error) {
                onInsert();
              }
            }}
          />
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Preview:</label>
          <div
            ref={previewRef}
            className="border rounded p-4 min-h-[60px] bg-gray-50 flex items-center"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Batal
          </button>
          <button
            onClick={onInsert}
            disabled={!formula.trim() || !!error}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

export function MathEditor({
  value,
  onChange,
  placeholder = "Tulis pertanyaan di sini...",
  className = "",
  rows = 3,
}: MathEditorProps) {
  const [mounted, setMounted] = useState(false);
  const quillRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [formula, setFormula] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add math button to toolbar
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const timeoutId = setTimeout(() => {
      try {
        const editor = containerRef.current?.querySelector(".ql-editor");
        if (!editor) return;

        const quill = (editor as any).__quill || (editor.parentElement as any)?.__quill;
        if (!quill?.container) return;

        const toolbar = quill.container.previousElementSibling;
        if (!toolbar || toolbar.querySelector(".ql-math-btn")) return;

        const btnContainer = document.createElement("span");
        btnContainer.className = "ql-formats ql-math-btn";

        const btn = document.createElement("button");
        btn.innerHTML = "√x";
        btn.className = "ql-math";
        btn.title = "Insert Math";
        btn.type = "button";
        btn.onclick = (e) => {
          e.preventDefault();
          setShowModal(true);
        };

        btnContainer.appendChild(btn);
        toolbar.appendChild(btnContainer);
      } catch (err) {
        console.error("Error adding math button:", err);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [mounted, value]);

  // Insert math formula
  const insertFormula = async () => {
    if (!containerRef.current || !formula.trim()) return;

    try {
      const editor = containerRef.current.querySelector(".ql-editor");
      if (!editor) return;

      const quill = (editor as any).__quill || (editor.parentElement as any)?.__quill;
      if (!quill?.getSelection) return;

      const range = quill.getSelection(true);
      if (!range) return;

      // Load and use KaTeX
      const katexModule = await import("katex");
      const katex = katexModule.default;

      const tempDiv = document.createElement("div");
      katex.render(formula, tempDiv, {
        throwOnError: false,
        displayMode: false,
      });

      const html = `<span class="math-formula" data-latex="${formula.replace(/"/g, "&quot;")}">${tempDiv.innerHTML}</span>`;
      quill.clipboard.dangerouslyPasteHTML(range.index, html);
      quill.setSelection(range.index + 1);

      setFormula("");
      setShowModal(false);
    } catch (err) {
      console.error("Error inserting formula:", err);
    }
  };

  // Auto-convert math expressions to Unicode superscript saat mengetik
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const editor = containerRef.current?.querySelector(".ql-editor");
    if (!editor) return;

    const quill = (editor as any).__quill || (editor.parentElement as any)?.__quill;
    if (!quill) return;

    let lastText = '';
    let conversionTimeout: NodeJS.Timeout | null = null;

    // Auto-convert saat user mengetik pattern seperti "x2", "5y2", dll
    const handleTextChange = () => {
      try {
        const currentText = quill.getText();
        
        // Clear previous timeout
        if (conversionTimeout) {
          clearTimeout(conversionTimeout);
        }
        
        // Debounce conversion
        conversionTimeout = setTimeout(() => {
          const selection = quill.getSelection();
          if (!selection) return;
          
          // Get text around cursor (last 20 characters before cursor)
          const start = Math.max(0, selection.index - 20);
          const textBeforeCursor = quill.getText(start, selection.index - start);
          
          // Check if user just typed a pattern like "x2", "5y2", etc.
          // Pattern: variabel + angka di akhir (contoh: x2, y3, 5x2, 11y2)
          const pattern = /([a-zA-Z])(\d+)$|(\d+)([a-zA-Z])(\d+)$/;
          const match = textBeforeCursor.match(pattern);
          
          if (match) {
            const fullMatch = match[0];
            const converted = convertMathToUnicode(fullMatch);
            
            if (converted !== fullMatch) {
              // Replace the pattern with Unicode superscript
              const matchStart = selection.index - fullMatch.length;
              quill.deleteText(matchStart, fullMatch.length, 'user');
              quill.insertText(matchStart, converted, 'user');
              quill.setSelection(matchStart + converted.length);
              onChange(editor.innerHTML);
            }
          }
        }, 300); // Wait 300ms after user stops typing
        
        lastText = currentText;
      } catch (err) {
        // Ignore errors
      }
    };

    // Keyboard shortcut Ctrl+M or Cmd+M to convert selected text to Unicode superscript
    const handleKeyDown = (e: Event) => {
      const keyEvent = e as KeyboardEvent;
      
      // Ctrl+M or Cmd+M to convert selected text
      if ((keyEvent.ctrlKey || keyEvent.metaKey) && keyEvent.key === 'm') {
        keyEvent.preventDefault();
        const selection = quill.getSelection();
        if (selection && selection.length > 0) {
          const text = quill.getText(selection.index, selection.length);
          const converted = convertMathToUnicode(text.trim());
          
          if (converted !== text.trim()) {
            quill.deleteText(selection.index, selection.length, 'user');
            quill.insertText(selection.index, converted, 'user');
            quill.setSelection(selection.index + converted.length);
            onChange(editor.innerHTML);
          }
        }
      }
    };

    editor.addEventListener('keydown', handleKeyDown);
    quill.on('text-change', handleTextChange);
    
    return () => {
      editor.removeEventListener('keydown', handleKeyDown);
      quill.off('text-change', handleTextChange);
      if (conversionTimeout) {
        clearTimeout(conversionTimeout);
      }
    };
  }, [mounted, onChange]);

  // Render existing formulas
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    import("katex").then((katexModule) => {
      const katex = katexModule.default;
      const elements = containerRef.current?.querySelectorAll(".math-formula[data-latex]");
      elements?.forEach((el) => {
        const latex = el.getAttribute("data-latex");
        if (latex && !el.querySelector('.katex')) {
          try {
            katex.render(latex, el as HTMLElement, {
              throwOnError: false,
              displayMode: false,
            });
          } catch (e) {
            // If LaTeX fails, try to render the original text
            console.warn("Failed to render LaTeX:", latex, e);
          }
        }
      });
    });
  }, [mounted, value]);

  if (!mounted) {
    return (
      <div className={`border rounded-md p-3 min-h-[80px] ${className}`}>
        <p className="text-muted-foreground text-sm">{placeholder}</p>
      </div>
    );
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "script",
    "indent",
    "link",
  ];

  return (
    <div className={className} ref={containerRef}>
      <ReactQuill
        // @ts-ignore - react-quill may not be available or doesn't properly support refs in types
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight: `${rows * 24 + 100}px` }}
      />

      {showModal && (
        <MathModal
          formula={formula}
          setFormula={setFormula}
          onInsert={insertFormula}
          onClose={() => {
            setShowModal(false);
            setFormula("");
          }}
        />
      )}

      <style jsx global>{`
        .ql-editor {
          min-height: ${rows * 24}px;
        }
        .ql-container {
          font-size: 14px;
          border-radius: 0.375rem;
        }
        .ql-toolbar {
          border-radius: 0.375rem 0.375rem 0 0;
        }
        .math-formula {
          display: inline-block;
          margin: 0 2px;
          padding: 2px 4px;
        }
      `}</style>
    </div>
  );
}



