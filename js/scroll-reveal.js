/**
 * Inspired by [ScrollReveal](https://scrollrevealjs.org/).
 */
ThemeCupertino['ScrollReveal'] = new (class {
  constructor() {
    const canDisappear = () => document.body.dataset.scrollRevealDisappear === 'true'

    // A transformed card with backdrop-filter forces a full backdrop recompute
    // every animation frame. Since removing the mix-blend-mode from the idle
    // glow this matters less, but the raised card still contains a blurred
    // child, so push the transition onto the compositor for its duration.
    let settleTimer = null
    const markAnimating = () => {
      document.body.classList.add('reveal-animating')
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        document.body.classList.remove('reveal-animating')
        settleTimer = null
      }, 1400) // 0.48s max stagger delay + 0.8s transition + margin
    }

    // Promote a card to its own layer only while it transitions. Without the
    // promotion the opacity/transform transition runs on the main thread and
    // repaints the whole card every frame (~600 style invalidations/s measured
    // while scrolling, p99 frame 27.7ms); holding will-change permanently would
    // keep a layer per card alive, which costs more than it saves.
    const RELEASE_AFTER_TRANSITION = 900 // 0.8s transition + margin
    const releaseTimers = new WeakMap()
    const promote = (target, delayMs) => {
      target.style.willChange = 'opacity, transform'
      const existing = releaseTimers.get(target)
      if (existing) clearTimeout(existing)
      releaseTimers.set(
        target,
        setTimeout(() => {
          target.style.willChange = ''
          releaseTimers.delete(target)
        }, delayMs + RELEASE_AFTER_TRANSITION),
      )
    }

    this.observer = new IntersectionObserver(entries => {
      // Elements entering in the same frame rise one after another (capped so
      // fast scrolls don't leave the tail waiting) instead of snapping in
      // lockstep.
      let batchIndex = 0
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const step = Math.min(batchIndex++, 6)
          const delay = step * 80
          entry.target.style.transitionDelay = delay + 'ms'
          promote(entry.target, delay)
          entry.target.classList.add('scroll-reveal-show')
          markAnimating()
          if (!canDisappear()) {
            this.observer.unobserve(entry.target)
          }
        } else if (canDisappear()) {
          // Exit immediately (no stagger) so the fade tracks the scroll.
          entry.target.style.transitionDelay = '0ms'
          promote(entry.target, 0)
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
