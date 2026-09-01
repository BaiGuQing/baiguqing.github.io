;(() => {
  const WHEEL_LERP = 0.12
  const MIN_JUMP_DURATION = 0.72
  const MAX_JUMP_DURATION = 1.25
  // Past this width Lenis hands wheel scrolling back to the compositor.
  const LARGE_VIEWPORT_QUERY = '(min-width: 2200px)'

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

  // Lenis drives wheel scrolling from the main thread: every eased frame must
  // finish style/layout/paint before the next one starts. Measured at
  // 2560x1440 that pushes the median frame from ~7ms (native, compositor
  // threaded) to ~21ms with 42% of frames past 32ms — visible jank. Past
  // 2200px the wheel stays native; Lenis still powers anchor/TOC jumps and
  // keeps tracking scroll position for the hero split driver.
  const largeViewport = window.matchMedia(LARGE_VIEWPORT_QUERY)

  window.lenis = new Lenis({
    lerp: WHEEL_LERP,
    smoothWheel: !largeViewport.matches,
    // Core page navigation remains interpolated; CSS still reduces decoration.
    respectReducedMotion: false,
    prevent: node => node.closest('.toc-sidebar') != null,
  })

  // options.smoothWheel is read per wheel event, so viewport crossings apply live.
  const syncWheelMode = () => {
    window.lenis.options.smoothWheel = !largeViewport.matches
  }
  if (typeof largeViewport.addEventListener === 'function') {
    largeViewport.addEventListener('change', syncWheelMode)
  } else if (typeof largeViewport.addListener === 'function') {
    largeViewport.addListener(syncWheelMode)
  }

  function raf(time) {
    window.lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
})()
