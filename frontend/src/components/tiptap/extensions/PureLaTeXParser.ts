/**
 * TipTap extension to parse pure LaTeX (without delimiters) from HTML
 * Converts <tiptap-math data-latex="..."> to inline math nodes
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Slice, Fragment, Node as PMNode } from '@tiptap/pm/model';
import { DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';

export const PureLaTeXParserKey = new PluginKey('pureLaTeXParser');

export const PureLaTeXParser = Extension.create({
  name: 'pureLaTeXParser',

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: PureLaTeXParserKey,
        
        props: {
          // Transform HTML content when setting content or pasting
          transformPastedHTML(html) {
            return parseLaTeXInHTML(html, editor.schema);
          },
        },
      }),
    ];
  },
});

/**
 * Parse <tiptap-math data-latex="..."> tags and convert to proper math HTML
 */
function parseLaTeXInHTML(html: string, schema: any): string {
  let result = html;

  // Convert <tiptap-math data-latex="..."> to inline math
  result = result.replace(
    /<tiptap-math data-latex="([^"]*)"[^>]*><\/tiptap-math>/g,
    (match, latex) => {
      // Unescape HTML entities
      const unescapedLatex = unescapeHtml(latex);
      
      // Return as span that will be converted to inline math node
      // Use custom attribute that Mathematics extension can recognize
      return `<span data-type="inline-math" class="math-inline">${unescapedLatex}</span>`;
    }
  );

  return result;
}

/**
 * Unescape HTML entities
 */
function unescapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
  };
  
  let result = text;
  Object.keys(map).forEach(entity => {
    result = result.replace(new RegExp(entity, 'g'), map[entity]);
  });
  
  return result;
}











