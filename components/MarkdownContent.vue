<script setup lang="ts">
const props = defineProps<{ content: string }>()

const containerRef = ref<HTMLElement | null>(null)
const rendered = ref('')
let renderCount = 0

async function render() {
  if (!import.meta.client) {
    rendered.value = props.content
    return
  }

  const id = ++renderCount

  const [{ marked, Renderer }, hljsMod, mermaidMod] = await Promise.all([
    import('marked'),
    import('highlight.js/lib/common'),
    import('mermaid'),
  ])

  const hljs = hljsMod.default
  const mermaid = mermaidMod.default
  mermaid.initialize({ startOnLoad: false, theme: 'dark' })

  const renderer = new Renderer()
  const mermaidQueue: string[] = []

  renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
    if (lang === 'mermaid') {
      const idx = mermaidQueue.length
      mermaidQueue.push(text)
      return `<div class="mermaid-placeholder" data-idx="${idx}"></div>`
    }
    const highlighted = lang && hljs.getLanguage(lang)
      ? hljs.highlight(text, { language: lang }).value
      : hljs.highlightAuto(text).value
    const langLabel = lang ? `<span class="hljs-lang">${lang}</span>` : ''
    return `<pre class="hljs-pre">${langLabel}<code class="hljs">${highlighted}</code></pre>`
  } as any

  const html = await marked.parse(props.content, { renderer })

  // Bail if a newer render started
  if (id !== renderCount) return

  rendered.value = html

  if (mermaidQueue.length === 0) return
  await nextTick()
  if (!containerRef.value || id !== renderCount) return

  const placeholders = containerRef.value.querySelectorAll<HTMLElement>('.mermaid-placeholder')
  for (const el of placeholders) {
    const idx = parseInt(el.dataset.idx ?? '0')
    const code = mermaidQueue[idx]
    const elId = `mermaid-${Date.now()}-${idx}`
    try {
      const { svg } = await mermaid.render(elId, code)
      const wrapper = document.createElement('div')
      wrapper.className = 'mermaid-rendered'
      wrapper.innerHTML = svg
      el.replaceWith(wrapper)
    } catch {
      el.outerHTML = `<pre class="hljs-pre"><code class="hljs">${code}</code></pre>`
    }
  }
}

onMounted(render)
watch(() => props.content, render)
</script>

<template>
  <div ref="containerRef" class="md" v-html="rendered || content" />
</template>

<style>
@import 'highlight.js/styles/github-dark.css';

.md p { @apply mb-2 last:mb-0 leading-relaxed; }
.md ul, .md ol { @apply pl-5 mb-2 space-y-0.5; }
.md ul { list-style-type: disc; }
.md ol { list-style-type: decimal; }
.md h1, .md h2, .md h3, .md h4 { @apply font-semibold mt-3 mb-1; }
.md h1 { @apply text-lg; }
.md h2 { @apply text-base; }
.md h3, .md h4 { @apply text-sm; }
.md a { @apply text-blue-400 underline; }
.md blockquote { @apply border-l-2 border-gray-600 pl-3 text-gray-400 my-2 italic; }
.md hr { @apply border-gray-700 my-3; }
.md table { @apply w-full text-sm my-2 border-collapse; }
.md th { @apply border border-gray-700 px-2 py-1 bg-gray-800 font-semibold text-left; }
.md td { @apply border border-gray-700 px-2 py-1; }

/* inline code */
.md code:not(.hljs) {
  @apply bg-gray-800 rounded px-1 py-0.5 text-xs font-mono text-blue-300;
}

/* code blocks */
.md pre.hljs-pre {
  @apply relative bg-gray-950 rounded-xl p-4 overflow-x-auto my-2 text-xs;
}
.md pre.hljs-pre .hljs-lang {
  @apply absolute top-2 right-3 text-gray-600 text-[10px] font-mono pointer-events-none;
}
.md code.hljs {
  @apply font-mono text-xs block bg-transparent p-0;
}

/* mermaid */
.md .mermaid-rendered svg {
  @apply mx-auto my-2 max-w-full;
}
</style>
