"use client";


import { fetchApi } from '@/lib/fetch-api';
import { useEditor, EditorContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import FileHandler from "@tiptap/extension-file-handler";
import Mathematics from "@tiptap/extension-mathematics";
import { Gapcursor } from "@tiptap/extensions";
import { useEffect, useCallback, useState, useRef } from "react";
import { MathDelimiterParser } from "./extensions/MathDelimiterParser";
import { PureLaTeXParser } from "./extensions/PureLaTeXParser";
import MathInputModal from "./MathInputModal";
import "katex/dist/katex.min.css";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  Sigma,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "./tiptap-styles.css";

interface TiptapEditorWithToolbarProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeight?: number;
  compact?: boolean;
}

export default function TiptapEditorWithToolbar({
  content = "",
  placeholder = "Start typing...",
  onChange,
  editable = true,
  minHeight = 150,
  compact = false,
}: TiptapEditorWithToolbarProps) {
  const [mathModal, setMathModal] = useState<{
    isOpen: boolean;
    type: 'inline' | 'block';
    initialValue: string;
    position: number;
  }>({
    isOpen: false,
    type: 'inline',
    initialValue: '',
    position: 0,
  });
  
  // Ref to store debounce timeout
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to track if user is typing (to prevent content overwrite)
  const isTypingRef = useRef(false);

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    // Option 1: Convert to Base64 (for small images, immediate display)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

    // Option 2: Upload to server (uncomment and customize)
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetchApi('/api/upload', {
    //   method: 'POST',
    //   body: formData,
    // });
    // const data = await response.json();
    // return data.url;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        hardBreak: {
          keepMarks: true,
        },
        // Disable Link and Gapcursor from StarterKit to avoid duplicates
        link: false,
        gapcursor: false,
      }),
      Gapcursor,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "tiptap-link",
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "tiptap-image",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(async (file) => {
            const url = await uploadImage(file);
            currentEditor.chain().focus().setImage({ src: url }).run();
          });
        },
        onPaste: (currentEditor, files) => {
          files.forEach(async (file) => {
            const url = await uploadImage(file);
            currentEditor.chain().focus().setImage({ src: url }).run();
          });
        },
      }),
      Mathematics.configure({
        inlineOptions: {
          onClick: (node, pos) => {
            setMathModal({
              isOpen: true,
              type: 'inline',
              initialValue: node.attrs.latex,
              position: pos,
            });
          },
        },
        blockOptions: {
          onClick: (node, pos) => {
            setMathModal({
              isOpen: true,
              type: 'block',
              initialValue: node.attrs.latex,
              position: pos,
            });
          },
        },
        katexOptions: {
          throwOnError: false,
          macros: {
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\Q': '\\mathbb{Q}',
          },
        },
      }),
      MathDelimiterParser,
      PureLaTeXParser,
      // Extension removed - let default behavior handle space and tab
      // No custom handling needed, Tiptap should handle it by default
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Mark that user is typing
      isTypingRef.current = true;
      
      // Use debounced update to avoid interfering with keyboard input
      // This allows real-time updates without blocking space key
      if (onChange) {
        // Clear previous timeout
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        // Set new timeout with debounce
        updateTimeoutRef.current = setTimeout(() => {
          onChange(editor.getHTML());
          updateTimeoutRef.current = null;
          // Reset typing flag after debounce completes
          setTimeout(() => {
            isTypingRef.current = false;
          }, 50);
        }, 150); // 150ms debounce to avoid blocking keyboard
      }
    },
    onBlur: ({ editor }) => {
      // Also update on blur for final state
      if (onChange) {
        // Clear any pending timeout
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
          updateTimeoutRef.current = null;
        }
        onChange(editor.getHTML());
      }
    },
  });

  // Debug: Add event listener to log keyboard events (read-only, don't interfere)
  useEffect(() => {
    if (!editor) return;

    const view = editor.view;
    const editorElement = view.dom;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only log, don't interfere with default behavior
      if (event.key === ' ' || event.keyCode === 32) {
        console.log('[KEYBOARD DEBUG] Space key - defaultPrevented:', event.defaultPrevented);
      }
      if (event.key === 'Tab' || event.keyCode === 9) {
        console.log('[KEYBOARD DEBUG] Tab key - defaultPrevented:', event.defaultPrevented);
      }
    };

    // Use bubble phase (not capture) to not interfere
    editorElement.addEventListener('keydown', handleKeyDown, false);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [editor]);

  // Update content when prop changes (but only if user is not typing)
  useEffect(() => {
    if (editor && content !== undefined) {
      // Don't update if user is currently typing (to prevent overwriting space/input)
      if (isTypingRef.current) {
        return;
      }
      
      try {
        // Get current HTML from editor
        const currentHTML = editor.getHTML();
        
        // Only update if content is actually different (avoid overwriting user input)
        // Normalize both to compare properly
        const normalizedCurrent = currentHTML.trim() || '<p></p>';
        const normalizedNew = (content || '<p></p>').trim();
        
        // Only set content if it's different (external change, not from user input)
        if (normalizedCurrent !== normalizedNew) {
          editor.commands.setContent(content || '<p></p>');
          
          // Then convert $...$ to math nodes if present
          if (content && content.includes('$')) {
            setTimeout(() => convertDollarSignsToMath(editor), 100);
          }
        }
      } catch (error) {
        console.error('Error setting content:', error);
      }
    }
  }, [content, editor]);

  // Convert $...$ and $$...$$ in document to math nodes
  const convertDollarSignsToMath = useCallback((editor: any) => {
    const { state } = editor;
    const { schema } = state;
    
    // Collect all replacements first (to avoid position shifting)
    const replacements: Array<{from: number, to: number, latex: string, type: 'inline' | 'block'}> = [];
    let offset = 0;

    // Traverse document and find text nodes with $...$
    state.doc.descendants((node: any, pos: number) => {
      if (node.isText && node.text && node.text.includes('$')) {
        const text = node.text;
        
        // First, find block math $$...$$ (greedy, multiline)
        const blockRegex = /\$\$([\s\S]*?)\$\$/g;
        let blockMatch;
        const blockRanges: Array<{start: number, end: number}> = [];
        
        while ((blockMatch = blockRegex.exec(text)) !== null) {
          const latex = blockMatch[1].trim();
          if (latex) {
            replacements.push({
              from: pos + blockMatch.index + offset,
              to: pos + blockMatch.index + blockMatch[0].length + offset,
              latex,
              type: 'block'
            });
            blockRanges.push({ start: blockMatch.index, end: blockMatch.index + blockMatch[0].length });
          }
        }
        
        // Then find inline math $...$ (but skip if inside block math range)
        const inlineRegex = /\$([^\$]+)\$/g;
        let inlineMatch;
        
        while ((inlineMatch = inlineRegex.exec(text)) !== null) {
          const isInBlockRange = blockRanges.some(
            range => inlineMatch!.index >= range.start && inlineMatch!.index < range.end
          );
          
          if (!isInBlockRange) {
            const latex = inlineMatch[1].trim();
            if (latex) {
              replacements.push({
                from: pos + inlineMatch.index + offset,
                to: pos + inlineMatch.index + inlineMatch[0].length + offset,
                latex,
                type: 'inline'
              });
            }
          }
        }
      }
    });

    // Apply replacements in reverse order (to maintain positions)
    if (replacements.length > 0) {
      replacements.sort((a, b) => b.from - a.from);
      
      let { tr } = state;
      
      replacements.forEach(({ from, to, latex, type }) => {
        try {
          if (type === 'inline' && schema.nodes.inlineMath) {
            const mathNode = schema.nodes.inlineMath.create({ latex });
            tr = tr.replaceWith(from, to, mathNode);
          } else if (type === 'block' && schema.nodes.blockMath) {
            const mathNode = schema.nodes.blockMath.create({ latex });
            tr = tr.replaceWith(from, to, mathNode);
          }
        } catch (e) {
          console.error('Error creating math node:', e);
        }
      });
      
      editor.view.dispatch(tr);
    }
  }, []);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    // Create file input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      }
    };
    
    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertInlineMath = useCallback(() => {
    if (!editor) return;
    setMathModal({
      isOpen: true,
      type: 'inline',
      initialValue: 'E = mc^2',
      position: editor.state.selection.from,
    });
  }, [editor]);

  const insertBlockMath = useCallback(() => {
    if (!editor) return;
    setMathModal({
      isOpen: true,
      type: 'block',
      initialValue: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}',
      position: editor.state.selection.from,
    });
  }, [editor]);

  // Handle math modal save
  const handleMathSave = (latex: string) => {
    if (!editor) return;

    // Check if we're editing existing math node or inserting new one
    const { from } = editor.state.selection;
    const node = editor.state.doc.nodeAt(from);

    if (node && (node.type.name === 'inlineMath' || node.type.name === 'blockMath')) {
      // Editing existing node
      if (mathModal.type === 'inline') {
        editor.chain().setNodeSelection(mathModal.position).updateInlineMath({ latex }).focus().run();
      } else {
        editor.chain().setNodeSelection(mathModal.position).updateBlockMath({ latex }).focus().run();
      }
    } else {
      // Inserting new node
      if (mathModal.type === 'inline') {
        editor.chain().focus().insertInlineMath({ latex }).run();
      } else {
        editor.chain().focus().insertBlockMath({ latex }).run();
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white p-1 flex flex-wrap gap-1">
        {!compact && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={editor.isActive("paragraph") ? "bg-gray-100" : ""}
            >
              <span className="text-sm">P</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive("heading", { level: 1 }) ? "bg-gray-100" : ""}
            >
              <Heading1 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive("heading", { level: 2 }) ? "bg-gray-100" : ""}
            >
              <Heading2 className="w-4 h-4" />
            </Button>
          </>
        )}
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-gray-100" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>

        {!compact && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-gray-100" : ""}
            >
              <Italic className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-gray-100" : ""}
            >
              <List className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-gray-100" : ""}
            >
              <ListOrdered className="w-4 h-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={setLink}
              className={editor.isActive("link") ? "bg-gray-100" : ""}
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addImage}
          title="Insert image"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={insertInlineMath}
          title="Insert math formula"
        >
          <Sigma className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor */}
      <div 
        className="bg-white p-3 tiptap-editor-container cursor-text" 
        style={{ minHeight: `${minHeight}px` }}
        onClick={(e) => {
          // Jika klik area kosong, fokus ke editor dan pindah ke akhir
          if (e.target === e.currentTarget && editor) {
            editor.commands.focus('end');
          }
        }}
        onKeyDown={(e) => {
          // Ensure space key works - don't prevent default
          if (e.key === ' ' || e.key === 'Space') {
            // Allow space to work normally
            return;
          }
        }}
      >
        <EditorContent editor={editor} />
        
        {/* Helper button untuk insert paragraf - hanya tampil jika content ada */}
        {editor && !editor.isEmpty && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              editor.chain().focus('end').insertContent('<p></p>').run();
            }}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline"
          >
            + Tambah paragraf baru
          </button>
        )}
      </div>

      <MathInputModal
        isOpen={mathModal.isOpen}
        initialValue={mathModal.initialValue}
        type={mathModal.type}
        onSave={handleMathSave}
        onClose={() => setMathModal({ ...mathModal, isOpen: false })}
      />
    </div>
  );
}