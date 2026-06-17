// 不蒜子统计处理
(function() {
  'use strict';

  // 检查不蒜子是否加载完成
  function checkBusuanzi() {
    // busuanzi.pure.mini.js exposes bszCaller/bszTag, not a busuanzi global.
    if (typeof bszCaller !== 'undefined' || typeof bszTag !== 'undefined') {
      return true;
    }

    const valueEl = document.getElementById('busuanzi_value_page_pv');
    if (valueEl && valueEl.textContent.trim() !== '') {
      return true;
    }

    return false;
  }

  // 等待不蒜子加载
  function waitForBusuanzi(callback, maxAttempts = 50) {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (checkBusuanzi() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (checkBusuanzi()) {
          callback();
        } else {
          console.warn('不蒜子统计加载超时');
          // 显示占位符或隐藏统计元素
          hideViewCounts();
        }
      }
    }, 100);
  }

  // 隐藏浏览量统计（如果加载失败）
  function hideViewCounts() {
    const containers = document.querySelectorAll('#busuanzi_container_page_pv');
    containers.forEach(el => {
      el.style.display = 'none';
    });
  }

  // 更新页面浏览量显示
  function updatePageViews() {
    const valueEl = document.getElementById('busuanzi_value_page_pv');
    if (valueEl && valueEl.textContent) {
      // 不蒜子已经更新了值
      console.log('不蒜子统计已加载，页面浏览量:', valueEl.textContent);
    }
  }

  // 初始化
  function init() {
    // 等待不蒜子脚本加载
    waitForBusuanzi(() => {
      console.log('不蒜子统计已加载');
      // 等待 DOM 更新
      setTimeout(updatePageViews, 500);
    });
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
