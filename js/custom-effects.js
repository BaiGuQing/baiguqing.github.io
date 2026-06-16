// 自定义炫酷交互效果

(function() {
  'use strict';

  // 鼠标跟随光晕效果
  let cursorTimeout;
  document.addEventListener('mousemove', (e) => {
    document.body.classList.add('cursor-active');
    const afterElement = document.body;
    afterElement.style.setProperty('--mouse-x', e.clientX + 'px');
    afterElement.style.setProperty('--mouse-y', e.clientY + 'px');

    // 更新伪元素位置（通过CSS变量）
    document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');

    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
      document.body.classList.remove('cursor-active');
    }, 3000);
  });

  // 移除视差滚动效果 - 与其他动画冲突
  // 卡片悬停效果已在 CSS 中处理，不需要 JS

  // 简约粒子背景 - 单色科技感
  function createParticles() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particles-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-2';
    canvas.style.pointerEvents = 'none';
    canvas.style.opacity = '0.15';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.2 + 0.3;
        this.speedX = Math.random() * 0.2 - 0.1;
        this.speedY = Math.random() * 0.2 - 0.1;
        this.opacity = Math.random() * 0.3 + 0.15;
        // 单色：使用灰蓝色调
        this.color = 'rgba(100, 120, 150, 0.6)';
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function init() {
      particles = [];
      // 减少粒子数量
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 30000), 40);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // 简化连接线 - 单色，更细
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = 'rgba(100, 120, 150, 0.4)';
      ctx.lineWidth = 0.2;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    init();
    animate();

    window.addEventListener('resize', () => {
      resize();
      init();
    });

    // 页面隐藏时停止动画
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });
  }

  // 等待DOM加载完成后创建粒子效果
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createParticles);
  } else {
    createParticles();
  }

  // 平滑滚动到锚点
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 添加页面加载动画
  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });

  // 移除彩虹光标轨迹 - 性能开销太大，会造成页面卡顿

  // 打字机效果（如果页面有特定元素）
  const typewriterElements = document.querySelectorAll('[data-typewriter]');
  typewriterElements.forEach(element => {
    const text = element.textContent;
    element.textContent = '';
    let i = 0;

    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, 100);
      }
    }

    // 使用Intersection Observer延迟启动
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          type();
          observer.disconnect();
        }
      });
    });

    observer.observe(element);
  });

})();
