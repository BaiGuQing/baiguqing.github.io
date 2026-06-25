// Heading & code-block folding for post content.
// Click a heading's fold toggle to collapse everything under it until
// the next heading of equal or higher level. Click a code block's
// fold button to collapse the code body, leaving only the header.
;(() => {
  'use strict'

  const CONTENT_SEL = '.post > .content'
  const HEADING_SEL = 'h1, h2, h3, h4, h5, h6'
  const CODE_SEL = 'pre, figure.highlight'

  // ── helpers ──────────────────────────────────────────────────────

  /** Create a toggle button element with an aria-label. */
  function createToggle(label, iconHTML, extraClass) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'fold-toggle ' + (extraClass || '')
    btn.setAttribute('aria-label', label)
    btn.innerHTML = iconHTML
    return btn
  }

  /** Derived heading level: h1 → 1, h6 → 6, else Infinity. */
  function headingLevel(el) {
    const t = el.tagName
    if (t === 'H1') return 1
    if (t === 'H2') return 2
    if (t === 'H3') return 3
    if (t === 'H4') return 4
    if (t === 'H5') return 5
    if (t === 'H6') return 6
    return Infinity
  }

  // ── heading folding ──────────────────────────────────────────────

  function setupHeadings(content) {
    const headings = Array.from(content.querySelectorAll(HEADING_SEL))
    if (!headings.length) return

    headings.forEach(h => {
      // Skip headings that already have a fold toggle
      if (h.querySelector('.fold-toggle')) return

      const level = headingLevel(h)

      // Collect siblings until the next heading of equal or higher level
      const siblings = []
      let next = h.nextElementSibling
      while (next) {
        if (headingLevel(next) <= level) break
        siblings.push(next)
        next = next.nextElementSibling
      }

      // Nothing to fold under this heading
      if (!siblings.length) return

      // Wrap siblings in fold-body > fold-body-inner (grid animation)
      const body = document.createElement('div')
      body.className = 'fold-body'
      const inner = document.createElement('div')
      inner.className = 'fold-body-inner'
      siblings.forEach(s => inner.appendChild(s))
      body.appendChild(inner)
      h.after(body)
      h.setAttribute('data-has-fold', 'true')

      // Insert toggle button at the start of the heading
      const toggle = createToggle('折叠/展开', '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M5.5 3L10.5 8L5.5 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'fold-toggle-heading')
      toggle.addEventListener('click', e => {
        e.stopPropagation()
        e.preventDefault()
        const bodyEl = h.nextElementSibling
        if (bodyEl && bodyEl.classList.contains('fold-body')) {
          bodyEl.classList.toggle('folded')
          if (!h.hasAttribute('aria-expanded')) h.setAttribute('aria-expanded', 'true')
          h.setAttribute('aria-expanded', bodyEl.classList.contains('folded') ? 'false' : 'true')
        }
      })
      // Insert toggle button at the start of the heading (but after .headerlink if exists)
      const headerlink = h.querySelector('.headerlink')
      if (headerlink) {
        h.insertBefore(toggle, headerlink.nextSibling)
      } else {
        h.insertBefore(toggle, h.firstChild)
      }
      h.setAttribute('aria-expanded', 'true')
    })
  }

  // ── code-block folding ───────────────────────────────────────────

  function setupCodeBlocks(content) {
    const blocks = Array.from(content.querySelectorAll(CODE_SEL))
    blocks.forEach(block => {
      // Skip if already wrapped
      if (block.parentElement && block.parentElement.classList.contains('code-fold-wrapper')) return

      // Don't wrap if block is inside another code-fold-wrapper (safety check)
      if (block.closest('.code-fold-wrapper')) return

      // Wrap in a container for positioning the toggle
      const wrapper = document.createElement('div')
      wrapper.className = 'code-fold-wrapper'
      block.parentNode.insertBefore(wrapper, block)
      wrapper.appendChild(block)

      // Create header bar with language label and fold toggle
      const header = document.createElement('div')
      header.className = 'code-fold-header'

      // Try to detect language from class names
      let lang = ''
      if (block.classList.contains('highlight')) {
        const cls = block.className.split(/\s+/).find(c => c !== 'highlight' && c !== 'folded')
        if (cls) lang = cls.replace(/^language-/, '')
      } else {
        const code = block.querySelector('code')
        if (code) {
          const cls = code.className.split(/\s+/).find(c => c.startsWith('language-'))
          if (cls) lang = cls.replace('language-', '')
        }
      }

      const label = document.createElement('span')
      label.className = 'code-fold-lang'
      label.textContent = lang || 'code'
      header.appendChild(label)

      const toggle = createToggle('折叠代码块', '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 5.5L8 10.5L13 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'fold-toggle-code')
      toggle.addEventListener('click', () => {
        wrapper.classList.toggle('folded')
      })

      const copyBtn = createToggle('复制代码', '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5.5 4.5h6a1 1 0 011 1v7a1 1 0 01-1 1h-6a1 1 0 01-1-1v-7a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M3.5 11.5H3a1 1 0 01-1-1v-7a1 1 0 011-1h6a1 1 0 011 1v.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>', 'copy-toggle-code')
      copyBtn.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        let text = ''
        if (block.classList.contains('highlight')) {
          const lines = block.querySelectorAll('.code .line')
          if (lines.length > 0) {
            text = Array.from(lines).map(l => l.textContent).join('\n')
          } else {
            const codeEl = block.querySelector('.code') || block
            text = codeEl.innerText || codeEl.textContent
          }
        } else {
          text = block.innerText || block.textContent
        }

        try {
          await navigator.clipboard.writeText(text)
          const originalIcon = copyBtn.innerHTML
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          copyBtn.style.color = 'var(--color-success, #10b981)'
          setTimeout(() => {
            copyBtn.innerHTML = originalIcon
            copyBtn.style.color = ''
          }, 2000)
        } catch (err) {
          console.error('Failed to copy code: ', err)
        }
      })

      const controls = document.createElement('div')
      controls.className = 'code-fold-controls'
      controls.style.display = 'flex'
      controls.style.gap = '8px'
      controls.appendChild(copyBtn)
      controls.appendChild(toggle)
      header.appendChild(controls)

      // Wrap code block in a fold-body for grid animation
      const codeBody = document.createElement('div')
      codeBody.className = 'code-fold-body'
      const codeInner = document.createElement('div')
      codeInner.className = 'code-fold-body-inner'
      
      wrapper.insertBefore(header, block)
      wrapper.insertBefore(codeBody, block)
      codeBody.appendChild(codeInner)
      codeInner.appendChild(block)
    })
  }

  // ── init ─────────────────────────────────────────────────────────

  function init() {
    const content = document.querySelector(CONTENT_SEL)
    if (!content) return

    setupHeadings(content)
    setupCodeBlocks(content)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()