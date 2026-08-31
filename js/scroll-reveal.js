/**
 * Inspired by [ScrollReveal](https://scrollrevealjs.org/).
 */
ThemeCupertino['ScrollReveal'] = new (class {
  constructor() {
    const canDisappear = () => document.body.dataset.scrollRevealDisappear === 'true'

    // A transformed card with backdrop-filter forces a full backdrop recompute
    // every animation frame (the dominant 2K jank). Keep blurs suppressed from
    // the first class flip until the last transition settles.
    let settleTimer = null
    const markAnimating = () => {
      document.body.classList.add('reveal-animating')
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        document.body.classList.remove('reveal-animating')
        settleTimer = null
      }, 1400) // 0.48s max stagger delay + 0.8s transition + margin
    }

    this.observer = new IntersectionObserver(entries => {
      // Elements entering in the same frame rise one after another (capped so
      // fast scrolls don't leave the tail waiting) instead of snapping in
      // lockstep.
      let batchIndex = 0
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const step = Math.min(batchIndex++, 6)
          entry.target.style.transitionDelay = step * 80 + 'ms'
          entry.target.classList.add('scroll-reveal-show')
          markAnimating()
          if (!canDisappear()) {
            this.observer.unobserve(entry.target)
          }
        } else if (canDisappear()) {
          // Exit immediately (no stagger) so the fade tracks the scroll.
          entry.target.style.transitionDelay = '0ms'
          entry.target.classList.remove('scroll-reveal-show')
          markAnimating()
        }
      })
    })

    document
      .querySelectorAll(document.body.dataset.scrollRevealQuery)
      .forEach(el => {
        el.classList.add('scroll-reveal')
        this.observer.observe(el)
      })
  }

  /**
   * Add a element other than `.scroll-reveal` to observe.
   * @param {Element} el The element to scroll reveal.
   */
  observe(el) {
    this.observer.observe(el)
  }
})()
