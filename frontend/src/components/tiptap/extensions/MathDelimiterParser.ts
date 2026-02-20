/**
 * TipTap extension to parse LaTeX delimiters ($...$ and $$...$$) into Math nodes
 * This allows AI-extracted content with LaTeX to be properly rendered
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Slice, Fragment } from '@tiptap/pm/model';
import { hasLatexPatterns, hasDelimiters, cleanLatex } from './mathPatterns';

export const MathDelimiterParserKey = new PluginKey('mathDelimiterParser');

export const MathDelimiterParser = Extension.create({
  name: 'mathDelimiterParser',

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: MathDelimiterParserKey,
        
        props: {
          // Handle paste event for LaTeX
          handlePaste(view, event, slice) {
            // Get clipboard text
            const text = event.clipboardData?.getData('text/plain');
            
            if (text) {
              // Check if has LaTeX patterns (comprehensive check) but no delimiters
              if (hasLatexPatterns(text) && !hasDelimiters(text)) {
                // Prevent default paste
                event.preventDefault();
                
                // Parse text to separate regular text from LaTeX expressions
                const parsedContent = parseTextWithLatex(text);
                
                // Insert parsed content
                try {
                  editor.commands.insertContent(parsedContent);
                  return true;
                } catch (error) {
                  console.error('Error inserting content with math:', error);
                  // Fallback: insert as plain text
                  editor.commands.insertContent(text);
                  return true;
                }
              }
            }
            
            return false;
          },
          
          // Transform pasted HTML with math delimiters
          transformPastedHTML(html) {
            let result = html;
            
            // Block math: $$...$$
            result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
              const clean = latex.replace(/\\\\/g, '\\').trim();
              return `<p><span data-type="block-math" data-latex="${escapeHtmlAttr(clean)}"></span></p>`;
            });
            
            // Inline math: $...$
            result = result.replace(/\$(.*?)\$/g, (match, latex) => {
              const clean = latex.replace(/\\\\/g, '\\').trim();
              return `<span data-type="inline-math" data-latex="${escapeHtmlAttr(clean)}"></span>`;
            });
            
            return result;
          },
          
          // Transform pasted content with math delimiters
          transformPasted(slice) {
            const { schema } = editor.state;
            const fragments: any[] = [];

            slice.content.forEach((node) => {
              if (node.isText && node.text) {
                const parsed = parseMathDelimiters(node.text, schema);
                fragments.push(...parsed);
              } else {
                fragments.push(node);
              }
            });

            return new Slice(
              Fragment.from(fragments),
              slice.openStart,
              slice.openEnd
            );
          },
        },
      }),
    ];
  },
});

/**
 * Parse text with math delimiters and return array of nodes
 */
function parseMathDelimiters(text: string, schema: any): any[] {
  const nodes: any[] = [];
  let currentPos = 0;

  // Regex to match $$...$$ (block) and $...$ (inline)
  // Block math has priority
  // Using [\s\S] instead of . with 's' flag for ES2017 compatibility
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /\$(.*?)\$/g;

  // First pass: find all block math
  const blockMatches: Array<{ start: number; end: number; latex: string; type: 'block' }> = [];
  let match;
  
  while ((match = blockMathRegex.exec(text)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      latex: match[1].replace(/\\\\/g, '\\').trim(),
      type: 'block',
    });
  }

  // Second pass: find all inline math (skip if inside block math)
  const inlineMatches: Array<{ start: number; end: number; latex: string; type: 'inline' }> = [];
  
  while ((match = inlineMathRegex.exec(text)) !== null) {
    const isInsideBlock = blockMatches.some(
      (bm) => match!.index >= bm.start && match!.index < bm.end
    );
    
    if (!isInsideBlock) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        latex: match[1].replace(/\\\\/g, '\\').trim(),
        type: 'inline',
      });
    }
  }

  // Combine and sort all matches
  const allMatches = [...blockMatches, ...inlineMatches].sort((a, b) => a.start - b.start);

  // Build nodes
  allMatches.forEach((mathMatch) => {
    // Add text before math
    if (currentPos < mathMatch.start) {
      const textBefore = text.substring(currentPos, mathMatch.start);
      if (textBefore) {
        nodes.push(schema.text(textBefore));
      }
    }

    // Add math node
    if (mathMatch.type === 'block' && schema.nodes.blockMath) {
      // For block math, we need to close current paragraph and create new block
      if (nodes.length > 0) {
        // Wrap previous nodes in paragraph
        nodes.push(schema.nodes.paragraph.create(null, Fragment.from(nodes.splice(0))));
      }
      nodes.push(schema.nodes.blockMath.create({ latex: mathMatch.latex }));
    } else if (mathMatch.type === 'inline' && schema.nodes.inlineMath) {
      nodes.push(schema.nodes.inlineMath.create({ latex: mathMatch.latex }));
    } else {
      // Fallback: keep original text if schema doesn't have math nodes
      nodes.push(schema.text(text.substring(mathMatch.start, mathMatch.end)));
    }

    currentPos = mathMatch.end;
  });

  // Add remaining text
  if (currentPos < text.length) {
    const textAfter = text.substring(currentPos);
    if (textAfter) {
      nodes.push(schema.text(textAfter));
    }
  }

  // If no math found, return original text
  if (nodes.length === 0) {
    nodes.push(schema.text(text));
  }

  return nodes;
}

/**
 * Escape HTML attribute value
 */
function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Parse text with mixed content (regular text + LaTeX) and return TipTap content array
 * Example: "Ini adalah contoh \frac{a}{b} matematika" 
 * -> [{ type: 'text', text: 'Ini adalah contoh ' }, { type: 'inlineMath', attrs: { latex: '\\frac{a}{b}' } }, { type: 'text', text: ' matematika' }]
 */
function parseTextWithLatex(text: string): any[] {
  const content: any[] = [];
  
  // Regex to find LaTeX expressions (commands with braces or common patterns)
  // Match: \command{...} or \command{...}{...} or \command
  const latexRegex = /(\\[a-zA-Z]+(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})+|\\[a-zA-Z]+)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = latexRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        content.push({ type: 'text', text: textBefore });
      }
    }
    
    // Add the LaTeX as inline math
    const latex = match[0];
    content.push({
      type: 'inlineMath',
      attrs: { latex: latex }
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    if (textAfter) {
      content.push({ type: 'text', text: textAfter });
    }
  }
  
  // If no LaTeX found, return original text
  if (content.length === 0) {
    content.push({ type: 'text', text: text });
  }
  
  return content;
}

