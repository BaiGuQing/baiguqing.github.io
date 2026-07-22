// Lightweight image lightbox — no dependencies.
// Click post images to open a full-screen viewer with:
// - Esc / backdrop click to close
// - ← / → to switch images
// - Mouse wheel to zoom toward cursor
// - Drag to pan when zoomed
// - Double-click to toggle 1x / 2.5x
;(() => {
  'use strict'

  const QUALIFY_SELECTOR =
    '.post .content img, article.post .content img, .about img'

  const MIN_SCALE = 1
  const MAX_SCALE = 6
  const WHEEL_STEP = 0.0018 // scale factor per wheel deltaY unit
  const DOUBLE_ZOOM = 2.5

  function getLightboxImages() {
    const imgs = Array.from(document.querySelectorAll(QUALIFY_SELECTOR))
    return imgs.filter(img => {
      if (img.closest('.lightbox')) return false
      if (img.dataset.noZoom !== undefined) return false
      const w = img.naturalWidth || img.width || 0
      if (w && w < 32) return false
      return true
    })
  }

  let overlay = null
  let stage = null
  let caption = null
  let counter = null
  let zoomHint = null
  let current = []
  let activeIndex = -1
  let shownImg = null

  // transform state
  let scale = 1
  let tx = 0
  let ty = 0
  let dragging = false
  let moved = false
  let dragStartX = 0
  let dragStartY = 0
  let originTx = 0
  let originTy = 0
  let wheelBound = false

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v
  }

  function applyTransform(animate) {
    if (!shownImg) return
    shownImg.style.transition = animate
      ? 'transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease'
      : 'opacity 0.3s ease'
    shownImg.style.transform =
      'translate3d(' + tx + 'px,' + ty + 'px,0) scale(' + scale + ')'
    shownImg.classList.toggle('is-zoomed', scale > 1.01)
    if (overlay) overlay.classList.toggle('is-zoomed', scale > 1.01)
    if (zoomHint) {
      zoomHint.textContent = Math.round(scale * 100) + '%'
      zoomHint.classList.toggle('visible', scale > 1.01)
    }
  }

  function resetTransform() {
    scale = 1
    tx = 0
    ty = 0
    applyTransform(false)
  }

  function zoomAt(nextScale, clientX, clientY) {
    if (!shownImg || !stage) return
    const prev = scale
    const next = clamp(nextScale, MIN_SCALE, MAX_SCALE)
    if (Math.abs(next - prev) < 0.0001) return

    // Zoom toward the cursor so the point under the pointer stays put.
    const rect = stage.getBoundingClientRect()
    const cx = clientX - rect.left - rect.width / 2
    const cy = clientY - rect.top - rect.height / 2
    const ratio = next / prev
    tx = cx - (cx - tx) * ratio
    ty = cy - (cy - ty) * ratio
    scale = next

    if (scale <= 1.001) {
      scale = 1
      tx = 0
      ty = 0
    }
    applyTransform(false)
  }

  function onWheel(e) {
    if (!overlay || !document.body.classList.contains('lightbox-open')) return
    e.preventDefault()
    e.stopPropagation()

    // Normalize wheel deltas across mouse / trackpad.
    let dy = e.deltaY
    if (e.deltaMode === 1) dy *= 16 // lines → px
    if (e.deltaMode === 2) dy *= 400 // pages → px

    // Invert so wheel-up (negative delta) zooms in.
    const factor = Math.exp(-dy * WHEEL_STEP)
    zoomAt(scale * factor, e.clientX, e.clientY)
  }

  function onPointerDown(e) {
    if (!shownImg) return
    // Only primary button / touch
    if (e.button !== undefined && e.button !== 0) return
    // Don't start drag from chrome buttons
    if (e.target.closest('.lightbox-close, .lightbox-nav')) return

    dragging = true
    moved = false
    dragStartX = e.clientX
    dragStartY = e.clientY
    originTx = tx
    originTy = ty
    if (shownImg.setPointerCapture) {
      try {
        shownImg.setPointerCapture(e.pointerId)
      } catch (_) {}
    }
    shownImg.classList.add('is-dragging')
  }

  function onPointerMove(e) {
    if (!dragging || !shownImg) return
    const dx = e.clientX - dragStartX
    const dy = e.clientY - dragStartY
    if (!moved && dx * dx + dy * dy > 9) moved = true

    if (scale > 1.01) {
      tx = originTx + dx
      ty = originTy + dy
      applyTransform(false)
    }
  }

  function onPointerUp(e) {
    if (!dragging) return
    dragging = false
    if (shownImg) {
      shownImg.classList.remove('is-dragging')
      if (shownImg.releasePointerCapture) {
        try {
          shownImg.releasePointerCapture(e.pointerId)
        } catch (_) {}
      }
    }
  }

  function onDoubleClick(e) {
    if (!shownImg) return
    e.preventDefault()
    e.stopPropagation()
    if (scale > 1.05) {
      scale = 1
      tx = 0
      ty = 0
      applyTransform(true)
    } else {
      zoomAt(DOUBLE_ZOOM, e.clientX, e.clientY)
      applyTransform(true)
    }
  }

  function bindZoomHandlers() {
    if (!stage || wheelBound) return
    // Capture on overlay so Lenis / page never swallow the wheel.
    overlay.addEventListener('wheel', onWheel, { passive: false, capture: true })
    stage.addEventListener('pointerdown', onPointerDown)
    stage.addEventListener('pointermove', onPointerMove)
    stage.addEventListener('pointerup', onPointerUp)
    stage.addEventListener('pointercancel', onPointerUp)
    stage.addEventListener('dblclick', onDoubleClick)
    // Prevent native image drag-ghost.
    stage.addEventListener('dragstart', e => e.preventDefault())
    wheelBound = true
  }

  function build() {
    if (overlay) return

    overlay = document.createElement('div')
    overlay.className = 'lightbox'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', '图片预览')
    overlay.tabIndex = -1

    stage = document.createElement('div')
    stage.className = 'lightbox-stage'
    stage.addEventListener('click', e => {
      // Close only when clicking empty stage, not after a drag, and not while zoomed on image.
      if (moved) return
      if (e.target === stage || e.target === overlay) close()
    })

    const closeBtn = document.createElement('button')
    closeBtn.className = 'lightbox-close'
    closeBtn.type = 'button'
    closeBtn.setAttribute('aria-label', '关闭')
    closeBtn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>'
    closeBtn.addEventListener('click', e => {
      e.stopPropagation()
      close()
    })

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

    zoomHint = document.createElement('div')
    zoomHint.className = 'lightbox-zoom'
    zoomHint.setAttribute('aria-hidden', 'true')
    zoomHint.textContent = '100%'

    overlay.append(stage, closeBtn, prevBtn, nextBtn, caption, counter, zoomHint)
    overlay.addEventListener('click', e => {
      if (moved) return
      if (e.target === overlay) close()
    })

    document.body.appendChild(overlay)
    bindZoomHandlers()
  }

  function open(index) {
    current = getLightboxImages()
    if (!current.length) return
    activeIndex = (index + current.length) % current.length
    build()
    render()
    document.body.classList.add('lightbox-open')
    document.addEventListener('keydown', onKey)
    // Pause Lenis while open so wheel can drive zoom instead of page scroll.
    if (window.lenis && typeof window.lenis.stop === 'function') window.lenis.stop()
  }

  function render() {
    const src = current[activeIndex]
    if (shownImg) {
      shownImg.remove()
      shownImg = null
    }
    if (!src) return

    resetTransform()

    const img = document.createElement('img')
    img.className = 'lightbox-image'
    img.src = src.currentSrc || src.src
    img.alt = src.alt || ''
    img.draggable = false
    img.addEventListener('load', () => {
      requestAnimationFrame(() => img.classList.add('loaded'))
    })
    // Clicking the image itself should not close when not zoomed? Keep stage empty-click close.
    img.addEventListener('click', e => {
      // If user just dragged, swallow the click.
      if (moved) {
        e.stopPropagation()
        moved = false
      }
    })

    stage.appendChild(img)
    shownImg = img
    applyTransform(false)

    const alt = (src.alt || '').trim()
    caption.textContent = alt
    caption.style.display = alt ? '' : 'none'

    if (current.length > 1) {
      counter.style.display = ''
      counter.textContent = activeIndex + 1 + ' / ' + current.length
    } else {
      counter.style.display = 'none'
    }

    overlay.focus?.()
  }

  function step(delta) {
    if (current.length < 2) return
    activeIndex = (activeIndex + delta + current.length) % current.length
    render()
  }

  function close() {
    if (!overlay || overlay.dataset.closing === '1') return
    overlay.dataset.closing = '1'
    overlay.classList.add('closing')
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      overlay.removeEventListener('transitionend', done)
      document.body.classList.remove('lightbox-open')
      document.removeEventListener('keydown', onKey)
      if (window.lenis && typeof window.lenis.start === 'function') {
        window.lenis.start()
      }
      if (overlay && overlay.parentNode) overlay.remove()
      overlay = null
      stage = null
      caption = null
      counter = null
      zoomHint = null
      shownImg = null
      wheelBound = false
      scale = 1
      tx = 0
      ty = 0
    }
    // Prefer transitionend; fall back so we never leave body locked.
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
      case '+':
      case '=':
        e.preventDefault()
        zoomAt(scale * 1.2, window.innerWidth / 2, window.innerHeight / 2)
        break
      case '-':
      case '_':
        e.preventDefault()
        zoomAt(scale / 1.2, window.innerWidth / 2, window.innerHeight / 2)
        break
      case '0':
        e.preventDefault()
        scale = 1
        tx = 0
        ty = 0
        applyTransform(true)
        break
    }
  }

  function init() {
    document.addEventListener('click', e => {
      const img = e.target.closest(QUALIFY_SELECTOR)
      if (!img) return
      if (img.dataset.noZoom !== undefined) return
      const w = img.naturalWidth || img.width || 0
      if (w && w < 32) return
      // Ignore clicks that originated inside an already-open lightbox.
      if (img.closest('.lightbox')) return
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
