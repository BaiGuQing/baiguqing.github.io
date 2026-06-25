if (window.Lenis) {
  window.lenis = new Lenis()

  function raf(time) {
    window.lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}