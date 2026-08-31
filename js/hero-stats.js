// Hero 统计数字动画
(function() {
  'use strict';

  // 数字滚动动画（rAF 驱动 + easeOutCubic，匀速不掉步）
  function animateNumber(element, target, duration = 1600) {
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // 初始化统计动画
  function initHeroStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');

    if (statNumbers.length === 0) return;

    // 使用 Intersection Observer 延迟启动动画
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = parseInt(entry.target.getAttribute('data-target'));
          animateNumber(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNumbers.forEach(number => {
      observer.observe(number);
    });
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroStats);
  } else {
    initHeroStats();
  }

})();
