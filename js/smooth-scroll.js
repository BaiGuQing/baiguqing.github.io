if (window.Lenis) {
  window.lenis = new Lenis({
    prevent: (node) => node.closest('.toc-sidebar') != null,
  })

  function raf(time) {
    window.lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}