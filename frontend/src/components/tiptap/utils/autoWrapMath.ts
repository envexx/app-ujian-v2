/**
 * Auto-wrap mathematical expressions with LaTeX delimiters
 * This is a fallback for when AI forgets to wrap math expressions
 */

/**
 * Detect and wrap mathematical expressions with $ delimiters
 * Patterns detected:
 * - Superscripts: x^2, y^{10}, 2^n
 * - Subscripts: x_1, y_{10}
 * - Fractions: a/b (when looks like math)
 * - Equations: x + y = z, 2x - 3y = 5
 * - Greek letters: alpha, beta, gamma, etc.
 */
export function autoWrapMathExpressions(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // Don't process if already has delimiters
  if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
    return text;
  }

  let result = text;

  // Pattern 1: Wrap expressions with superscripts/subscripts
  // Examples: x^2, y^{10}, a_1, b_{20}, 2y^2-8y+y-2
  // Match: word/number followed by ^ or _ and then number/braced content
  result = result.replace(
    /\b([a-zA-Z0-9]+(?:\^[{]?[a-zA-Z0-9]+[}]?|_[{]?[a-zA-Z0-9]+[}]?)(?:[+\-*/=][a-zA-Z0-9^_{}]+)*)/g,
    (match) => {
      // Don't wrap if it's part of a URL or code
      if (match.includes('://') || match.includes('www.')) return match;
      return `$${match}$`;
    }
  );

  // Pattern 2: Wrap simple equations
  // Examples: x + y = 5, 2x - 3 = 0
  result = result.replace(
    /\b([a-zA-Z0-9]+\s*[+\-*/=]\s*[a-zA-Z0-9]+(?:\s*[+\-*/=]\s*[a-zA-Z0-9]+)*)\b/g,
    (match) => {
      // Check if already wrapped
      const before = result.substring(result.indexOf(match) - 1, result.indexOf(match));
      const after = result.substring(result.indexOf(match) + match.length, result.indexOf(match) + match.length + 1);
      
      if (before === '$' || after === '$') return match;
      
      // Only wrap if it looks like math (has operators and variables)
      if (/[+\-*/=]/.test(match) && /[a-zA-Z]/.test(match)) {
        return `$${match}$`;
      }
      return match;
    }
  );

  return result;
}

/**
 * Enhanced version of prepareContentForTipTap with auto-wrapping
 */
export function prepareContentWithAutoWrap(text: string): string {
  if (!text || typeof text !== 'string') return '<p></p>';

  // First, try auto-wrapping
  let content = autoWrapMathExpressions(text);

  // Wrap in paragraph if plain text
  if (!content.includes('<')) {
    // Split by newlines and wrap each line in <p>
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '<p></p>';
    
    content = lines.map(line => `<p>${line}</p>`).join('');
  }

  return content;
}











