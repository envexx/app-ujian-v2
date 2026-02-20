/**
 * TipTap plugin to automatically convert LaTeX delimiters to Math nodes
 * This allows users to type $...$ and have it automatically converted to inline math
 */

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Editor } from '@tiptap/react';

export const MathInputRulePluginKey = new PluginKey('mathInputRule');

/**
 * Create a plugin that converts $...$ to inline math and $$...$$ to block math
 */
export function createMathInputRulePlugin(editor: Editor) {
  return new Plugin({
    key: MathInputRulePluginKey,
    
    props: {
      // Handle pasted text with math delimiters
      transformPastedHTML(html) {
        return convertMathDelimitersInHTML(html);
      },
      
      transformPastedText(text) {
        return convertMathDelimitersInText(text);
      },
    },
  });
}

/**
 * Convert math delimiters in HTML content
 */
function convertMathDelimitersInHTML(html: string): string {
  let result = html;

  // Convert $$...$$ to block math
  // Using [\s\S] instead of . with 's' flag for ES2017 compatibility
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    const cleanLatex = latex.replace(/\\\\/g, '\\').trim();
    return `<div data-type="block-math" data-latex="${escapeHtml(cleanLatex)}"></div>`;
  });

  // Convert $...$ to inline math
  result = result.replace(/\$(.*?)\$/g, (match, latex) => {
    if (match.startsWith('$$')) return match;
    const cleanLatex = latex.replace(/\\\\/g, '\\').trim();
    return `<span data-type="inline-math" data-latex="${escapeHtml(cleanLatex)}"></span>`;
  });

  return result;
}

/**
 * Convert math delimiters in plain text
 */
function convertMathDelimitersInText(text: string): string {
  return convertMathDelimitersInHTML(text);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}






