;(() => {
  const WHEEL_LERP = 0.12
  const MIN_JUMP_DURATION = 0.72
  const MAX_JUMP_DURATION = 1.25

  // While the page is scrolling, CSS (main.scss) strips every backdrop-filter
  // via body.is-scrolling — blurs under fixed chrome are recomputed per frame
  // otherwise, which is the dominant fast-scroll cost at 2K+.
  let scrollClassTimer = null
  window.addEventListener('scroll', () => {
    if (!document.body.classList.contains('is-scrolling')) {
      document.body.classList.add('is-scrolling')
    }
    if (scrollClassTimer) clearTimeout(scrollClassTimer)
    scrollClassTimer = setTimeout(() => {
      document.body.classList.remove('is-scrolling')
      scrollClassTimer = null
    }, 180)
  }, { passive: true })

  const easeInOutSine = progress =>
    0.5 - Math.cos(Math.PI * progress) / 2

  window.themeSmoothScrollTo = top => {
    if (!Number.isFinite(top)) return

    if (window.lenis) {
      const current = typeof window.lenis.scroll === 'number'
        ? window.lenis.scroll
        : window.scrollY
      const duration = Math.min(
        MAX_JUMP_DURATION,
        MIN_JUMP_DURATION + Math.abs(top - current) / 5500,
      )

      window.lenis.scrollTo(top, {
        duration,
        easing: easeInOutSine,
        lerp: 0,
      })
      return
    }

    window.scrollTo({ top, behavior: 'smooth' })
  }

  if (!window.Lenis) return

  window.lenis = new Lenis({
    lerp: WHEEL_LERP,
    smoothWheel: true,
    // Core page navigation remains interpolated; CSS still reduces decoration.
    respectReducedMotion: false,
    prevent: node => node.closest('.toc-sidebar') != null,
  })

  function raf(time) {
    window.lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
})()
