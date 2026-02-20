/**
 * Convert content with LaTeX - SIMPLE VERSION
 * Just clean escaping, keep $ delimiters
 * Let user manually convert to math using toolbar button
 */
export function convertMathDelimitersToTipTap(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  // Just clean double backslash from JSON escaping
  // $$\\frac{1}{2}$$ → $$\frac{1}{2}$$
  return text.replace(/(\$+)([^\$]+)(\$+)/g, (match, open, content, close) => {
    const cleanContent = content.replace(/\\\\/g, '\\');
    return `${open}${cleanContent}${close}`;
  });
}

/**
 * Convert plain text with newlines to HTML paragraphs
 */
export function convertTextToHtml(text: string): string {
  if (!text || typeof text !== 'string') return '<p></p>';

  // First convert math delimiters to HTML
  let html = convertMathDelimitersToTipTap(text);

  // If already has paragraph tags from block math, don't double-wrap
  if (html.includes('<p')) {
    return html;
  }

  // Split by double newlines (paragraphs)
  const paragraphs = html.split(/\n\n+/);

  // Wrap each paragraph in <p> tags (unless it's already wrapped)
  return paragraphs
    .map((para) => {
      // Skip if already has tags
      if (para.trim().startsWith('<')) return para;
      
      // Replace single newlines with <br>
      const withBreaks = para.trim().replace(/\n/g, '<br>');
      return withBreaks ? `<p>${withBreaks}</p>` : '';
    })
    .filter(Boolean)
    .join('');
}

/**
 * Process content from AI extract to be TipTap-compatible
 * This is the main function to use when setting content from AI
 */
export function prepareContentForTipTap(text: string): string {
  if (!text || typeof text !== 'string') return '<p></p>';

  // Convert math delimiters - auto-detects LaTeX and wraps
  let content = convertMathDelimitersToTipTap(text);

  // If content doesn't have HTML tags, wrap in paragraph
  if (!content.includes('<')) {
    content = `<p>${content}</p>`;
  }

  // Ensure content is not empty
  if (!content.trim()) {
    return '<p></p>';
  }

  return content;
}

// Functions removed - auto-wrapping now handled in convertMathDelimitersToTipTap

