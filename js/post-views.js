// 文章浏览量统计功能
// 使用 LocalStorage 实现简单的浏览量统计

(function() {
  'use strict';

  const STORAGE_KEY = 'blog_post_views';
  const VIEW_UPDATE_INTERVAL = 5000; // 5秒后才算一次有效浏览

  // 获取所有浏览量数据
  function getViewsData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to load views data:', e);
      return {};
    }
  }

  // 保存浏览量数据
  function saveViewsData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save views data:', e);
    }
  }

  // 增加浏览量
  function incrementView(path) {
    const viewsData = getViewsData();
    const currentCount = viewsData[path] || 0;
    viewsData[path] = currentCount + 1;
    saveViewsData(viewsData);
    return viewsData[path];
  }

  // 格式化浏览量显示
  function formatViewCount(count) {
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'w';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  }

  // 更新页面上的浏览量显示
  function updateViewCounts() {
    const viewsData = getViewsData();
    const viewElements = document.querySelectorAll('.views-count');

    viewElements.forEach(el => {
      const path = el.getAttribute('data-path');
      if (path) {
        const count = viewsData[path] || 0;
        const countElement = el.querySelector('.count');
        if (countElement) {
          countElement.textContent = formatViewCount(count);
          // 添加动画效果
          countElement.style.animation = 'countUp 0.5s ease-out';
        }
      }
    });
  }

  // 记录当前文章的浏览
  function recordCurrentPageView() {
    const currentPath = window.location.pathname;

    // 只在文章页面记录浏览量
    if (!currentPath.includes('/posts/') && !currentPath.match(/\/\d{4}\/\d{2}\/\d{2}\//)) {
      return;
    }

    // 延迟记录，避免快速跳转造成的误计数
    setTimeout(() => {
      const newCount = incrementView(currentPath);

      // 更新当前页面的浏览量显示
      const currentViewElement = document.querySelector('.post-views .count');
      if (currentViewElement) {
        currentViewElement.textContent = formatViewCount(newCount);
        currentViewElement.style.animation = 'countUp 0.5s ease-out';
      }

      console.log(`View recorded for ${currentPath}: ${newCount}`);
    }, VIEW_UPDATE_INTERVAL);
  }

  // 初始化
  function init() {
    // 更新所有浏览量显示
    updateViewCounts();

    // 记录当前页面浏览
    recordCurrentPageView();

    // 为浏览量添加动画样式
    if (!document.getElementById('view-count-styles')) {
      const style = document.createElement('style');
      style.id = 'view-count-styles';
      style.textContent = `
        @keyframes countUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .views-count {
          cursor: help;
          position: relative;
        }

        .views-count:hover .count {
          color: var(--color-text-accent);
          transform: scale(1.1);
        }

        .views-count .count {
          transition: all 0.3s ease;
          display: inline-block;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 导出给其他脚本使用
  window.BlogViews = {
    getViewsData,
    formatViewCount,
    updateViewCounts
  };

})();
