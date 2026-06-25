// Lightweight image lightbox — no dependencies.
// Activates on images inside the post .content area. Click an image to open
// a full-screen viewer with keyboard navigation (Esc / ← / →), backdrop click
// to close, and pinch/scroll-zoom support handled by the browser on the img.
;(() => {
  'use strict'

  const QUALIFY_SELECTOR =
    '.post .content img, article.post .content img, .about img'

  function getLightboxImages() {
    const imgs = Array.from(document.querySelectorAll(QUALIFY_SELECTOR))
    // Exclude tiny icons / decorative images and cover images (handled elsewhere).
    return imgs.filter(img => {
      if (img.closest('.lightbox')) return false
      // Skip images explicitly flagged non-zoomable
      if (img.dataset.noZoom !== undefined) return false
      // Skip emoji-like tiny images
      const w = img.naturalWidth || img.width || 0
      if (w && w < 32) return false
      return true
    })
  }

  let overlay = null
  let stage = null
  let caption = null
  let counter = null
  let current = []

  function build() {
    if (overlay) return

    overlay = document.createElement('div')
    overlay.className = 'lightbox'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', '图片预览')

    stage = document.createElement('div')
    stage.className = 'lightbox-stage'
    stage.addEventListener('click', e => {
      if (e.target === stage) close()
    })

    const closeBtn = document.createElement('button')
    closeBtn.className = 'lightbox-close'
    closeBtn.type = 'button'
    closeBtn.setAttribute('aria-label', '关闭')
    closeBtn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>'
    closeBtn.addEventListener('click', close)

    const prevBtn = document.createElement('button')
    prevBtn.className = 'lightbox-nav lightbox-prev'
    prevBtn.type = 'button'
    prevBtn.setAttribute('aria-label', '上一张')
    prevBtn.innerHTML = '<i class="bi bi-chevron-left" aria-hidden="true"></i>'
    prevBtn.addEventListener('click', e => {
      e.stopPropagation()
      step(-1)
    })

    const nextBtn = document.createElement('button')
    nextBtn.className = 'lightbox-nav lightbox-next'
    nextBtn.type = 'button'
    nextBtn.setAttribute('aria-label', '下一张')
    nextBtn.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>'
    nextBtn.addEventListener('click', e => {
      e.stopPropagation()
      step(1)
    })

    caption = document.createElement('div')
    caption.className = 'lightbox-caption'

    counter = document.createElement('div')
    counter.className = 'lightbox-counter'

    overlay.append(stage, closeBtn, prevBtn, nextBtn, caption, counter)
    overlay.addEventListener('click', e => {
      if (e.target === overlay) close()
    })

    document.body.appendChild(overlay)
  }

  let activeIndex = -1
  let shownImg = null

  function open(index) {
    current = getLightboxImages()
    if (!current.length) return
    activeIndex = (index + current.length) % current.length
    build()
    render()
    document.body.classList.add('lightbox-open')
    document.addEventListener('keydown', onKey)
    // Pause Lenis while open so backdrop stays fixed.
    if (window.lenis && typeof window.lenis.stop === 'function') window.lenis.stop()
  }

  function render() {
    const src = current[activeIndex]
    if (shownImg) {
      shownImg.remove()
      shownImg = null
    }
    if (!src) return

    const img = document.createElement('img')
    img.className = 'lightbox-image'
    img.src = src.currentSrc || src.src
    img.alt = src.alt || ''
    img.draggable = false
    // Fade in once decoded.
    img.addEventListener('load', () => {
      requestAnimationFrame(() => img.classList.add('loaded'))
    })
    stage.appendChild(img)
    shownImg = img

    const alt = (src.alt || '').trim()
    caption.textContent = alt
    caption.style.display = alt ? '' : 'none'

    if (current.length > 1) {
      counter.style.display = ''
      counter.textContent = activeIndex + 1 + ' / ' + current.length
    } else {
      counter.style.display = 'none'
    }

    // Focus management for keyboard users.
    overlay.focus?.()
  }

  function step(delta) {
    if (current.length < 2) return
    activeIndex = (activeIndex + delta + current.length) % current.length
    render()
  }

  function close() {
    if (!overlay) return
    overlay.classList.add('closing')
    const done = () => {
      overlay.removeEventListener('transitionend', done)
      document.body.classList.remove('lightbox-open')
      document.removeEventListener('keydown', onKey)
      if (window.lenis && typeof window.lenis.start === 'function')
        window.lenis.start()
      // Remove overlay from DOM so the enter animation replays on next open.
      overlay.remove()
      overlay = null
      stage = null
      caption = null
      counter = null
      if (shownImg) {
        shownImg.remove()
        shownImg = null
      }
    }
    // Graceful close with fallback if transitionend never fires.
    overlay.addEventListener('transitionend', done)
    setTimeout(done, 320)
  }

  function onKey(e) {
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowLeft':
        e.preventDefault()
        step(-1)
        break
      case 'ArrowRight':
        e.preventDefault()
        step(1)
        break
    }
  }

  function init() {
    // Delegate clicks: re-qualify on each click so late-loaded images work.
    document.addEventListener('click', e => {
      const img = e.target.closest(QUALIFY_SELECTOR)
      if (!img) return
      if (img.dataset.noZoom !== undefined) return
      const w = img.naturalWidth || img.width || 0
      if (w && w < 32) return
      const list = getLightboxImages()
      const idx = list.indexOf(img)
      if (idx < 0) return
      e.preventDefault()
      open(idx)
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
