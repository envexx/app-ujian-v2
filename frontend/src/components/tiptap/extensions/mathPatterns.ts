/**
 * Comprehensive LaTeX Math Pattern Detection
 * Detects all common mathematical expressions
 */

/**
 * LaTeX commands that indicate mathematical content
 */
export const LATEX_COMMANDS = [
  // Fractions & Roots
  'frac', 'dfrac', 'tfrac', 'cfrac',
  'sqrt',
  
  // Greek letters (lowercase)
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta',
  'theta', 'vartheta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi',
  'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma', 'tau', 'upsilon',
  'phi', 'varphi', 'chi', 'psi', 'omega',
  
  // Greek letters (uppercase)
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon',
  'Phi', 'Psi', 'Omega',
  
  // Operators
  'times', 'div', 'pm', 'mp', 'cdot', 'ast', 'star', 'circ', 'bullet',
  'oplus', 'ominus', 'otimes', 'oslash', 'odot',
  
  // Relations
  'leq', 'geq', 'neq', 'equiv', 'approx', 'sim', 'simeq', 'cong',
  'propto', 'parallel', 'perp', 'mid',
  
  // Arrows
  'rightarrow', 'leftarrow', 'leftrightarrow', 'Rightarrow', 'Leftarrow', 'Leftrightarrow',
  'longrightarrow', 'longleftarrow', 'longleftrightarrow',
  'uparrow', 'downarrow', 'updownarrow',
  
  // Calculus
  'int', 'iint', 'iiint', 'oint',
  'sum', 'prod', 'coprod',
  'lim', 'limsup', 'liminf', 'inf', 'sup', 'max', 'min',
  'partial', 'nabla',
  
  // Trigonometry & Log
  'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
  'arcsin', 'arccos', 'arctan',
  'sinh', 'cosh', 'tanh', 'coth',
  'log', 'ln', 'lg', 'exp',
  
  // Set theory
  'in', 'notin', 'subset', 'subseteq', 'supset', 'supseteq',
  'cup', 'cap', 'setminus', 'emptyset', 'varnothing',
  'forall', 'exists', 'nexists',
  
  // Logic
  'land', 'lor', 'lnot', 'neg', 'implies', 'iff',
  
  // Accents & decorations
  'hat', 'widehat', 'bar', 'overline', 'underline', 'tilde', 'widetilde',
  'vec', 'dot', 'ddot', 'acute', 'grave', 'check', 'breve',
  
  // Brackets
  'left', 'right', 'big', 'Big', 'bigg', 'Bigg',
  'langle', 'rangle', 'lfloor', 'rfloor', 'lceil', 'rceil',
  
  // Dots
  'ldots', 'cdots', 'vdots', 'ddots',
  
  // Spacing
  'quad', 'qquad', 'hspace', 'vspace',
  
  // Text in math
  'text', 'textrm', 'textit', 'textbf', 'mathbb', 'mathbf', 'mathit', 'mathcal',
  'mathrm', 'mathsf', 'mathtt',
  
  // Matrices & Arrays
  'begin', 'end', 'matrix', 'pmatrix', 'bmatrix', 'vmatrix', 'Vmatrix',
  'cases', 'aligned', 'array',
  
  // Others
  'infty', 'to', 'mapsto', 'gets',
  'angle', 'triangle', 'square', 'diamond',
  'therefore', 'because',
];

/**
 * Create regex pattern for LaTeX commands
 */
export function createLatexCommandPattern(): RegExp {
  const commandPattern = LATEX_COMMANDS.join('|');
  return new RegExp(`\\\\(?:${commandPattern})`, 'i');
}

/**
 * Comprehensive check if text contains LaTeX/Math patterns
 */
export function hasLatexPatterns(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // Pattern 1: LaTeX commands (\frac, \sqrt, \alpha, etc)
  if (createLatexCommandPattern().test(text)) return true;
  
  // Pattern 2: Superscripts (^) or subscripts (_)
  if (/[\^_]/.test(text)) return true;
  
  // Pattern 3: Curly braces (likely LaTeX grouping)
  if (/[{}]/.test(text) && /\\/.test(text)) return true;
  
  // Pattern 4: Square brackets with backslash (optional args)
  if (/\\\[|\\\]|\\\(|\\\)/.test(text)) return true;
  
  // Pattern 5: Common math symbols that need LaTeX
  // ±, ×, ÷, ≤, ≥, ≠, ≈, ∞, ∑, ∏, ∫, √, π, etc
  if (/[±×÷≤≥≠≈∞∑∏∫√πα-ωΑ-Ω∈∉⊂⊃∪∩∀∃→←↔⇒⇐⇔]/.test(text)) return true;
  
  return false;
}

/**
 * Check if text is already wrapped with delimiters
 */
export function hasDelimiters(text: string): boolean {
  return text.includes('$') || 
         text.includes('\\[') || 
         text.includes('\\]') ||
         text.includes('\\(') || 
         text.includes('\\)');
}

/**
 * Clean LaTeX text (remove extra escaping, trim)
 */
export function cleanLatex(text: string): string {
  return text
    .replace(/\\\\/g, '\\')  // Double backslash to single
    .trim();
}











