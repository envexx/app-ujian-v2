<template>
  <div class="tiptap-editor" :class="{ 'tiptap-mini': mini }">
    <!-- Toolbar -->
    <div v-if="!mini" class="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <button
        type="button"
        @click="editor?.chain().focus().toggleBold().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('bold') }]"
        title="Bold"
      >
        <Icon name="lucide:bold" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleItalic().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('italic') }]"
        title="Italic"
      >
        <Icon name="lucide:italic" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleUnderline().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('underline') }]"
        title="Underline"
      >
        <Icon name="lucide:underline" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleStrike().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('strike') }]"
        title="Strikethrough"
      >
        <Icon name="lucide:strikethrough" class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('heading', { level: 1 }) }]"
        title="Heading 1"
      >
        <Icon name="lucide:heading-1" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('heading', { level: 2 }) }]"
        title="Heading 2"
      >
        <Icon name="lucide:heading-2" class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        @click="editor?.chain().focus().toggleBulletList().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('bulletList') }]"
        title="Bullet List"
      >
        <Icon name="lucide:list" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleOrderedList().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('orderedList') }]"
        title="Numbered List"
      >
        <Icon name="lucide:list-ordered" class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        @click="editor?.chain().focus().setTextAlign('left').run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive({ textAlign: 'left' }) }]"
        title="Align Left"
      >
        <Icon name="lucide:align-left" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().setTextAlign('center').run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive({ textAlign: 'center' }) }]"
        title="Align Center"
      >
        <Icon name="lucide:align-center" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().setTextAlign('right').run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive({ textAlign: 'right' }) }]"
        title="Align Right"
      >
        <Icon name="lucide:align-right" class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1"></div>

      <!-- Image Upload -->
      <button
        type="button"
        @click="triggerImageUpload"
        class="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        title="Insert Image"
      >
        <Icon name="lucide:image" class="w-4 h-4" />
      </button>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleImageUpload"
      />

      <!-- Math Formula -->
      <button
        type="button"
        @click="showMathModal = true"
        class="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        title="Insert Math Formula (LaTeX)"
      >
        <Icon name="lucide:sigma" class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        @click="editor?.chain().focus().toggleBlockquote().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('blockquote') }]"
        title="Quote"
      >
        <Icon name="lucide:quote" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleCodeBlock().run()"
        :class="['p-2 rounded-lg hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('codeBlock') }]"
        title="Code Block"
      >
        <Icon name="lucide:code" class="w-4 h-4" />
      </button>

      <div class="w-px h-6 bg-gray-300 mx-1"></div>

      <button
        type="button"
        @click="editor?.chain().focus().undo().run()"
        :disabled="!editor?.can().undo()"
        class="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        title="Undo"
      >
        <Icon name="lucide:undo" class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().redo().run()"
        :disabled="!editor?.can().redo()"
        class="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        title="Redo"
      >
        <Icon name="lucide:redo" class="w-4 h-4" />
      </button>
    </div>

    <!-- Mini Toolbar (for inline editors) -->
    <div v-else class="flex items-center gap-1 p-1.5 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        @click="editor?.chain().focus().toggleBold().run()"
        :class="['p-1.5 rounded hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('bold') }]"
        title="Bold"
      >
        <Icon name="lucide:bold" class="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleItalic().run()"
        :class="['p-1.5 rounded hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('italic') }]"
        title="Italic"
      >
        <Icon name="lucide:italic" class="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        @click="editor?.chain().focus().toggleUnderline().run()"
        :class="['p-1.5 rounded hover:bg-gray-200 transition-colors', { 'bg-gray-200': editor?.isActive('underline') }]"
        title="Underline"
      >
        <Icon name="lucide:underline" class="w-3.5 h-3.5" />
      </button>
      <div class="w-px h-4 bg-gray-300 mx-0.5"></div>
      <button
        type="button"
        @click="triggerImageUpload"
        class="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Insert Image"
      >
        <Icon name="lucide:image" class="w-3.5 h-3.5" />
      </button>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleImageUpload"
      />
      <button
        type="button"
        @click="showMathModal = true"
        class="p-1.5 rounded hover:bg-gray-200 transition-colors"
        title="Insert Math Formula"
      >
        <Icon name="lucide:sigma" class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Editor Content -->
    <EditorContent 
      :editor="editor" 
      :class="['prose prose-sm max-w-none focus:outline-none', mini ? 'p-2 min-h-[60px]' : 'p-4 min-h-[150px]']"
    />

    <!-- Math Formula Modal -->
    <Teleport to="body">
      <div v-if="showMathModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showMathModal = false">
        <div class="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Insert Math Formula</h3>
            <button @click="showMathModal = false" class="p-1 hover:bg-gray-100 rounded-lg">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">LaTeX Formula</label>
              <textarea
                v-model="mathFormula"
                class="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono min-h-[80px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                placeholder="e.g., \frac{a}{b}, x^2 + y^2 = z^2, \sqrt{x}"
              ></textarea>
            </div>
            
            <div v-if="mathFormula" class="p-4 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-500 mb-2">Preview:</p>
              <div class="math-preview text-center text-lg" v-html="renderMathPreview(mathFormula)"></div>
            </div>

            <div class="text-xs text-gray-500">
              <p class="font-medium mb-1">Quick Examples:</p>
              <div class="flex flex-wrap gap-2">
                <button @click="mathFormula = '\\frac{a}{b}'" class="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Fraction</button>
                <button @click="mathFormula = 'x^2 + y^2 = z^2'" class="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Power</button>
                <button @click="mathFormula = '\\sqrt{x}'" class="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Square Root</button>
                <button @click="mathFormula = '\\sum_{i=1}^{n} x_i'" class="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Sum</button>
                <button @click="mathFormula = '\\int_{a}^{b} f(x) dx'" class="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Integral</button>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button 
              @click="showMathModal = false"
              class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button 
              @click="insertMath"
              class="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import { Mathematics, migrateMathStrings } from '@tiptap/extension-mathematics'
import katex from 'katex'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  mini?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const imageInput = ref<HTMLInputElement | null>(null)
const showMathModal = ref(false)
const mathFormula = ref('')

// LaTeX pattern detection - matches common LaTeX patterns
const latexPatterns = [
  /\$\$(.+?)\$\$/,           // $$...$$ display math
  /\$(.+?)\$/,               // $...$ inline math
  /\\frac\{[^}]*\}\{[^}]*\}/, // \frac{}{} 
  /\\sqrt\{[^}]*\}/,          // \sqrt{}
  /\\sum_?\{?[^}]*\}?/,       // \sum
  /\\int_?\{?[^}]*\}?/,       // \int
  /\\[a-zA-Z]+\{[^}]*\}/,     // \command{}
  /[a-zA-Z]\^\{[^}]+\}/,      // x^{...}
  /[a-zA-Z]_\{[^}]+\}/,       // x_{...}
  /\\[a-zA-Z]+/,              // \alpha, \beta, etc.
]

// Process text and render LaTeX formulas inline
const processTextWithLatex = (text: string): string => {
  // First, try to render formulas wrapped in $ or $$
  let result = text
  
  // Handle $$...$$ display math
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
      })
      return `<span class="math-rendered" contenteditable="false" data-formula="${encodeURIComponent(formula.trim())}">${rendered}</span>`
    } catch {
      return match
    }
  })
  
  // Handle $...$ inline math
  result = result.replace(/\$([^\$]+?)\$/g, (match, formula) => {
    try {
      const rendered = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
      })
      return `<span class="math-rendered" contenteditable="false" data-formula="${encodeURIComponent(formula.trim())}">${rendered}</span>`
    } catch {
      return match
    }
  })
  
  return result
}

const detectAndRenderLatex = (text: string): string => {
  let result = text
  let hasLatex = false
  
  // Check for LaTeX patterns
  for (const pattern of latexPatterns) {
    if (pattern.test(text)) {
      hasLatex = true
      break
    }
  }
  
  if (!hasLatex) return text
  
  // Extract and render LaTeX formulas
  // Handle $$ display math first
  result = result.replace(/\$\$(.+?)\$\$/g, (match, formula) => {
    try {
      const html = katex.renderToString(formula.trim(), { throwOnError: false, displayMode: true })
      return `<span class="katex-display" data-formula="${encodeURIComponent(formula.trim())}">${html}</span>`
    } catch { return match }
  })
  
  // Handle $ inline math
  result = result.replace(/\$(.+?)\$/g, (match, formula) => {
    try {
      const html = katex.renderToString(formula.trim(), { throwOnError: false, displayMode: false })
      return `<span class="katex-inline" data-formula="${encodeURIComponent(formula.trim())}">${html}</span>`
    } catch { return match }
  })
  
  // Handle standalone LaTeX expressions (without $ delimiters)
  // Match expressions like e^{-i\omega t}, \frac{a}{b}, etc.
  const standaloneLatexRegex = /(?:^|[^\\$])([a-zA-Z]*(?:\\[a-zA-Z]+(?:\{[^}]*\})*|[a-zA-Z]\^[\{\d\w\-\+\\]+\}?|[a-zA-Z]_[\{\d\w\-\+\\]+\}?)+)/g
  
  // Try to detect if the whole text looks like a LaTeX formula
  const cleanText = text.trim()
  if (/^[a-zA-Z\d\s\^\\_\{\}\+\-\*\/\(\)\[\]\\]+$/.test(cleanText) && 
      (cleanText.includes('^') || cleanText.includes('_') || cleanText.includes('\\'))) {
    try {
      const html = katex.renderToString(cleanText, { throwOnError: false, displayMode: false })
      return `<span class="katex-inline" data-formula="${encodeURIComponent(cleanText)}">${html}</span>`
    } catch { /* continue with original */ }
  }
  
  return result
}

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Placeholder.configure({
      placeholder: props.placeholder || 'Tulis sesuatu...',
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Mathematics.configure({
      katexOptions: {
        throwOnError: false,
      },
      inlineOptions: {
        onClick: (node: any, pos: number) => {
          const newLatex = prompt('Edit formula LaTeX:', node.attrs.latex)
          if (newLatex !== null && newLatex !== node.attrs.latex) {
            editor.value?.chain().setNodeSelection(pos).updateInlineMath({ latex: newLatex }).focus().run()
          }
        },
      },
      blockOptions: {
        onClick: (node: any, pos: number) => {
          const newLatex = prompt('Edit formula LaTeX:', node.attrs.latex)
          if (newLatex !== null && newLatex !== node.attrs.latex) {
            editor.value?.chain().setNodeSelection(pos).updateBlockMath({ latex: newLatex }).focus().run()
          }
        },
      },
    }),
  ],
  editorProps: {
    handlePaste: (view, event) => {
      const text = event.clipboardData?.getData('text/plain')
      if (text) {
        // Check if text already has $ delimiters
        const hasExistingDelimiters = /\$/.test(text)
        
        // Check for raw LaTeX (starts with \)
        const hasRawLatex = /\\[a-zA-Z]/.test(text)
        
        let processedText = text
        
        // If has raw LaTeX but no $ delimiters, wrap LaTeX expressions with $
        if (hasRawLatex && !hasExistingDelimiters) {
          // Function to find matching closing brace
          const findMatchingBrace = (str: string, start: number): number => {
            let count = 0
            for (let i = start; i < str.length; i++) {
              if (str[i] === '{') count++
              else if (str[i] === '}') {
                count--
                if (count === 0) return i
              }
            }
            return -1
          }
          
          // Find LaTeX expressions and wrap them
          const result: string[] = []
          let i = 0
          let lastEnd = 0
          
          while (i < text.length) {
            // Look for backslash starting a LaTeX command
            if (text[i] === '\\' && i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
              // Add text before this LaTeX
              if (i > lastEnd) {
                result.push(text.substring(lastEnd, i))
              }
              
              // Find the end of the LaTeX expression
              let j = i + 1
              // Skip command name
              while (j < text.length && /[a-zA-Z]/.test(text[j])) j++
              
              // Process all braces and subscripts/superscripts
              while (j < text.length) {
                if (text[j] === '{') {
                  const closePos = findMatchingBrace(text, j)
                  if (closePos !== -1) {
                    j = closePos + 1
                  } else {
                    break
                  }
                } else if (text[j] === '^' || text[j] === '_') {
                  j++
                  if (j < text.length && text[j] === '{') {
                    const closePos = findMatchingBrace(text, j)
                    if (closePos !== -1) {
                      j = closePos + 1
                    } else {
                      break
                    }
                  } else if (j < text.length && /[a-zA-Z0-9]/.test(text[j])) {
                    j++
                  }
                } else if (text[j] === '[') {
                  // Optional argument like \sqrt[3]{x}
                  const closePos = text.indexOf(']', j)
                  if (closePos !== -1) {
                    j = closePos + 1
                  } else {
                    break
                  }
                } else {
                  break
                }
              }
              
              const latexExpr = text.substring(i, j)
              result.push(`$${latexExpr}$`)
              lastEnd = j
              i = j
            } else {
              i++
            }
          }
          
          // Add remaining text
          if (lastEnd < text.length) {
            result.push(text.substring(lastEnd))
          }
          
          processedText = result.join('')
        }
        
        // Check if we have math to process
        const hasMath = /\$/.test(processedText)
        
        if (hasMath) {
          event.preventDefault()
          
          // Insert the text with $ delimiters, then run migration
          editor.value?.chain().focus().insertContent(processedText).run()
          
          // Use the official migration utility to convert $...$ to math nodes
          if (editor.value) {
            migrateMathStrings(editor.value)
          }
          
          return true
        }
      }
      return false
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(() => props.modelValue, (newValue) => {
  const isSame = editor.value?.getHTML() === newValue
  if (!isSame) {
    editor.value?.commands.setContent(newValue || '', false)
  }
})

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Convert to base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    editor.value?.chain().focus().setImage({ src: base64 }).run()
  }
  reader.readAsDataURL(file)
  
  // Reset input
  target.value = ''
}

const renderMathPreview = (formula: string) => {
  try {
    return katex.renderToString(formula, {
      throwOnError: false,
      displayMode: true,
    })
  } catch (e) {
    return '<span class="text-red-500">Invalid formula</span>'
  }
}

const insertMath = () => {
  if (!mathFormula.value) return
  
  try {
    // Use Mathematics extension to insert inline math
    editor.value?.chain().focus().insertInlineMath({ latex: mathFormula.value }).run()
    
    showMathModal.value = false
    mathFormula.value = ''
  } catch (e) {
    console.error('Error inserting math:', e)
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
@import 'katex/dist/katex.min.css';

.tiptap-editor {
  @apply border border-gray-200 rounded-xl bg-white overflow-hidden;
}

.tiptap-mini {
  @apply rounded-lg;
}

.tiptap-editor .ProseMirror {
  @apply outline-none min-h-[120px];
}

.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  @apply text-gray-400 float-left h-0 pointer-events-none;
  content: attr(data-placeholder);
}

.tiptap-editor .ProseMirror:focus {
  @apply outline-none;
}

.tiptap-editor .ProseMirror h1 {
  @apply text-2xl font-bold mb-4;
}

.tiptap-editor .ProseMirror h2 {
  @apply text-xl font-bold mb-3;
}

.tiptap-editor .ProseMirror h3 {
  @apply text-lg font-bold mb-2;
}

.tiptap-editor .ProseMirror p {
  @apply mb-2;
}

.tiptap-editor .ProseMirror ul {
  @apply list-disc pl-6 mb-2;
}

.tiptap-editor .ProseMirror ol {
  @apply list-decimal pl-6 mb-2;
}

.tiptap-editor .ProseMirror blockquote {
  @apply border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2;
}

.tiptap-editor .ProseMirror code {
  @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono;
}

.tiptap-editor .ProseMirror pre {
  @apply bg-gray-900 text-gray-100 p-4 rounded-lg my-2 overflow-x-auto;
}

.tiptap-editor .ProseMirror pre code {
  @apply bg-transparent p-0;
}

/* Mathematics extension styles */
.tiptap-editor .ProseMirror .tiptap-mathematics-render {
  padding: 0 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.2s;
}

.tiptap-editor .ProseMirror .tiptap-mathematics-render:hover {
  background: #eff6ff;
}

.tiptap-editor .ProseMirror .tiptap-mathematics-render[data-type='inline-math'] {
  display: inline-block;
  background: #eff6ff;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #bfdbfe;
}

.tiptap-editor .ProseMirror .tiptap-mathematics-render[data-type='block-math'] {
  display: block;
  margin: 1rem 0;
  padding: 1rem;
  text-align: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
}

.tiptap-editor .ProseMirror .inline-math-error,
.tiptap-editor .ProseMirror .block-math-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.tiptap-mini .ProseMirror {
  @apply min-h-[40px];
}
</style>
