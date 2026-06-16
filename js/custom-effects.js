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

  // 视差滚动效果
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.hero, .card');

    parallaxElements.forEach((el, index) => {
      const speed = 0.5 + (index * 0.1);
      const yPos = -(scrolled * speed / 10);
      el.style.transform = `translateY(${yPos}px)`;
    });
  });

  // 卡片3D倾斜效果
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card, .post-list-item');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  });

  // 粒子背景效果
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
    canvas.style.opacity = '0.3';
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
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
        this.color = ['#8a2be2', '#00bfff', '#ff69b4'][Math.floor(Math.random() * 3)];
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
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
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

      // 绘制连接线
      ctx.globalAlpha = 0.1;
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.strokeStyle = p1.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

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

  // 彩虹光标轨迹
  const trail = [];
  const trailLength = 20;

  document.addEventListener('mousemove', (e) => {
    trail.push({ x: e.clientX, y: e.clientY, time: Date.now() });

    if (trail.length > trailLength) {
      trail.shift();
    }
  });

  function drawTrail() {
    const existingTrails = document.querySelectorAll('.cursor-trail');
    existingTrails.forEach(t => {
      const opacity = parseFloat(t.style.opacity);
      if (opacity > 0) {
        t.style.opacity = opacity - 0.05;
      } else {
        t.remove();
      }
    });

    trail.forEach((point, index) => {
      if (index % 3 === 0) { // 每3个点绘制一次，减少性能开销
        const dot = document.createElement('div');
        dot.className = 'cursor-trail';
        dot.style.cssText = `
          position: fixed;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8a2be2, #00bfff);
          pointer-events: none;
          z-index: 9998;
          left: ${point.x}px;
          top: ${point.y}px;
          opacity: ${(index / trail.length) * 0.5};
          transform: translate(-50%, -50%);
        `;
        document.body.appendChild(dot);
      }
    });

    requestAnimationFrame(drawTrail);
  }

  drawTrail();

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
