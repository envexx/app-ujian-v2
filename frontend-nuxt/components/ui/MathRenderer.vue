<template>
  <div class="math-content prose prose-sm max-w-none" v-html="renderedContent"></div>
</template>

<script setup lang="ts">
import katex from 'katex'

const props = defineProps<{
  content: string
  displayMode?: boolean
}>()

// Render any LaTeX formulas in the content
const renderedContent = computed(() => {
  if (!props.content) return ''
  
  let result = props.content
  
  // Check if content already has rendered KaTeX (from TiptapEditor)
  // In this case, just return as-is since it's already HTML
  if (result.includes('class="katex"') || result.includes('class="math-rendered"')) {
    return result
  }
  
  // Otherwise, try to render any LaTeX patterns
  // Handle $$...$$ display math
  result = result.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
      })
    } catch {
      return match
    }
  })
  
  // Handle $...$ inline math
  result = result.replace(/\$([^\$]+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
      })
    } catch {
      return match
    }
  })
  
  return result
})
</script>

<style scoped>
.math-content :deep(.katex) {
  font-size: 1.1em;
}

.math-content :deep(.katex-display) {
  margin: 1em 0;
  text-align: center;
}

.math-content :deep(.math-rendered) {
  display: inline-block;
  background-color: #eff6ff;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #bfdbfe;
}

.math-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

.math-content :deep(p) {
  margin-bottom: 0.5rem;
}

.math-content :deep(ul),
.math-content :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}

.math-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
}
</style>
