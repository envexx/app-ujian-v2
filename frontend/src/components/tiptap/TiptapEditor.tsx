"use client";

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
import { useEffect, useCallback, useState } from "react";
import { MathDelimiterParser } from "./extensions/MathDelimiterParser";
import { PureLaTeXParser } from "./extensions/PureLaTeXParser";
import MathInputModal from "./MathInputModal";
import "katex/dist/katex.min.css";
import "./tiptap-styles.css";

interface TiptapEditorProps {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  editable?: boolean;
  minHeight?: number;
}

export default function TiptapEditor({
  content = "",
  placeholder = "Start typing...",
  onChange,
  editable = true,
  minHeight = 150,
}: TiptapEditorProps) {
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

  // Upload image function
  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
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
      // Critical: Extension to ensure space key works - must be last with highest priority
      Extension.create({
        name: 'spaceKeyFix',
        priority: 10000, // Highest priority to run last and override others
        addProseMirrorPlugins() {
          return [
            new Plugin({
              key: new PluginKey('spaceKeyFix'),
              props: {
                handleKeyDown: (view, event) => {
                  // Force space key to work - override any other handlers
                  if (event.key === ' ' || event.keyCode === 32) {
                    // Always allow space - insert it manually if needed
                    const { state, dispatch } = view;
                    const { selection } = state;
                    const { from } = selection;
                    
                    // Insert space character
                    const tr = state.tr.insertText(' ', from, from);
                    dispatch(tr);
                    
                    // Prevent other handlers from interfering
                    return true;
                  }
                  return false;
                },
              },
            }),
          ];
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Backup fix: Add event listener as fallback if plugin doesn't work
  useEffect(() => {
    if (!editor) return;

    const view = editor.view;
    const editorElement = view.dom;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if space key is being prevented
      if ((event.key === ' ' || event.keyCode === 32) && event.defaultPrevented) {
        // Fallback: manually insert space if plugin didn't handle it
        const { from } = editor.state.selection;
        editor.commands.insertContentAt(from, ' ');
        event.stopPropagation();
      }
    };

    // Use capture phase to catch before other handlers
    editorElement.addEventListener('keydown', handleKeyDown, true);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editor]);

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      try {
        // Set content first
        editor.commands.setContent(content || '<p></p>');
        
        // Then convert $...$ to math nodes if present
        if (content && content.includes('$')) {
          setTimeout(() => convertDollarSignsToMath(editor), 100);
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

  // Handle math modal save
  const handleMathSave = (latex: string) => {
    if (!editor) return;

    if (mathModal.type === 'inline') {
      editor.chain().setNodeSelection(mathModal.position).updateInlineMath({ latex }).focus().run();
    } else {
      editor.chain().setNodeSelection(mathModal.position).updateBlockMath({ latex }).focus().run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <>
      <div 
        className="tiptap-container tiptap-editor-container" 
        style={{ minHeight: `${minHeight}px` }}
        onClick={(e) => {
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
      </div>

      <MathInputModal
        isOpen={mathModal.isOpen}
        initialValue={mathModal.initialValue}
        type={mathModal.type}
        onSave={handleMathSave}
        onClose={() => setMathModal({ ...mathModal, isOpen: false })}
      />
    </>
  );
}

