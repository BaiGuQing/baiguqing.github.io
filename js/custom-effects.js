// Homepage + post-card interactions
(function() {
  'use strict';

  function initHeroInteraction() {
    const hero = document.getElementById('hero-interactive');
    if (!hero) return;

    const prefersReducedMotionPointer = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    // Soft pointer wash
    if (!prefersReducedMotionPointer && finePointer) {
      let frame = null;
      let tx = 70;
      let ty = 40;
      let cx = 70;
      let cy = 40;

      function render() {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        hero.style.setProperty('--mx', cx.toFixed(2) + '%');
        hero.style.setProperty('--my', cy.toFixed(2) + '%');

        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
          frame = requestAnimationFrame(render);
        } else {
          frame = null;
        }
      }

      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        tx = ((event.clientX - rect.left) / rect.width) * 100;
        ty = ((event.clientY - rect.top) / rect.height) * 100;
        if (!frame) frame = requestAnimationFrame(render);
      }, { passive: true });

      hero.addEventListener('pointerleave', () => {
        tx = 70;
        ty = 40;
        if (!frame) frame = requestAnimationFrame(render);
      });
    }

    function initParticles() {
      const canvas = document.getElementById('hero-particles');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let width, height;
      let particles = [];

      // 简易 2D simplex-like 噪声（用于有机运动和颜色混合）
      function noise2D(x, y) {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        return (n - Math.floor(n)) * 2 - 1;
      }
      function smoothNoise(x, y) {
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy;
        const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
        const n00 = noise2D(ix, iy), n10 = noise2D(ix+1, iy);
        const n01 = noise2D(ix, iy+1), n11 = noise2D(ix+1, iy+1);
        return n00*(1-sx)*(1-sy) + n10*sx*(1-sy) + n01*(1-sx)*sy + n11*sx*sy;
      }

      // Antigravity 配色（光暗双主题）
      const colorsLight = [
        {r:44, g:100, b:237},   // #2c64ed Blue
        {r:248, g:66, b:66},    // #f84242 Red
        {r:255, g:207, b:3},    // #ffcf03 Yellow
      ];
      const colorsDark = [
        {r:113, g:137, b:255},  // #7189ff Light Blue
        {r:48, g:116, b:249},   // #3074f9 Blue
        {r:80, g:80, b:120},    // Subtle purple-gray (replaces black for visibility)
      ];

      function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
        width = rect.width;
        height = rect.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        initSetup();
      }

      function initSetup() {
        particles = [];
        // 适当回调粒子间距，增加一点粒子数量
        const spacing = 58;
        const cols = Math.ceil(width / spacing);
        const rows = Math.ceil(height / spacing);

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const homeX = i * spacing + (Math.random() - 0.5) * spacing * 0.8;
            const homeY = j * spacing + (Math.random() - 0.5) * spacing * 0.8;

            if (homeX < 0 || homeX > width || homeY < 0 || homeY > height) continue;

            const seed = Math.random();

            particles.push({
              homeX, homeY,
              x: homeX, y: homeY,
              scale: 0,
              targetScale: 0,
              seed: seed,
              noisePhase: Math.random() * 100,
            });
          }
        }
      }

      window.addEventListener('resize', resize);
      resize();

      let ringX = width / 2, ringY = height / 2;
      let mouseX = width / 2, mouseY = height / 2;
      let mouseInside = false;
      let heroVisible = true;
      let time = 0;

      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
        mouseInside = mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
      }, { passive: true });

      hero.addEventListener('pointerleave', () => {
        mouseInside = false;
      });

      function animateParticles() {
        if (!window.themeParticlesEnabled || document.hidden || !heroVisible) {
          if (particlesAnimFrame) {
            cancelAnimationFrame(particlesAnimFrame);
            particlesAnimFrame = null;
          }
          return;
        }

        ctx.clearRect(0, 0, width, height);
        time += 0.016;

        const isLight = document.body.dataset.currentColorScheme === 'light';

        const lerpFactor = mouseInside ? 0.03 : 0.015;
        const noiseOffX = Math.sin(time * 0.66 + 94.234) * 15;
        const noiseOffY = Math.cos(time * 0.75 + 21.028) * 10;

        const targetRingX = mouseInside ? mouseX + noiseOffX : width/2 + noiseOffX * 3;
        const targetRingY = mouseInside ? mouseY + noiseOffY : height/2 + noiseOffY * 2;

        ringX += (targetRingX - ringX) * lerpFactor;
        ringY += (targetRingY - ringY) * lerpFactor;

        // 🔑 大幅降低聚集频率：让游走变得极其缓慢（time 乘数降到 0.08）
        const radiusState = (smoothNoise(time * 0.15, 123.45) + 1) * 0.5;
        // 让聚散偶尔才发生一次
        const radiusFactor = smoothstep(0.3, 0.7, radiusState);

        // 🔑 让总体圈保持在一个很大的状态
        const maxRadius = Math.max(500, Math.min(width, height) * 0.45);
        // 🔑 大幅缩小变化范围，聚拢时也保持庞大（从 280 提升到 400）
        const minRadius = 400;
        const currentBaseRadius = minRadius + (maxRadius - minRadius) * radiusFactor;

        // 环的尺寸和波动幅度，都会随着当前基础半径同比例缩放
        const ringRadius = currentBaseRadius + Math.sin(time * 1.5) * (5 * radiusFactor);
        // 🔑 增大外圈宽度，让外围发光层延伸得更广
        const ringWidth = Math.max(30, currentBaseRadius * 0.7);
        const ringWidth2 = Math.max(12, currentBaseRadius * 0.3);

        particles.forEach((p) => {
          const dx = p.homeX - ringX;
          const dy = p.homeY - ringY;
          const realDist = Math.sqrt(dx * dx + dy * dy);

          // 缩小距离扭曲幅度（从 250 降到 60），保证它总体上依然是个圆形的甜甜圈
          const shapeNoise = smoothNoise(p.homeX * 0.003 - time * 0.2, p.homeY * 0.003 + time * 0.3) * 60;
          const dist = realDist + shapeNoise;

          const noiseX = smoothNoise(p.homeX * 0.005 + 18.49, p.homeY * 0.005 + time * 0.35) * 8;
          const noiseY = smoothNoise(p.homeX * 0.005 + 50.90, p.homeY * 0.005 + time * 0.35) * 8;
          const sinX = Math.sin(p.homeX * 0.02 + time * 2) * 3 * Math.min(dist / 100, 1);
          const sinY = Math.cos(p.homeY * 0.02 + time * 1.5) * 3 * Math.min(dist / 100, 1);

          // 环形基础骨架计算
          const t1Rise = smoothstep(ringRadius - ringWidth * 2, ringRadius, dist);
          const t1Fall = smoothstep(ringRadius, ringRadius + ringWidth, dist);
          const t2Rise = smoothstep(ringRadius - ringWidth2 * 2, ringRadius, dist);
          const t2Fall = smoothstep(ringRadius, ringRadius + ringWidth2, dist);

          let t2 = Math.pow(t2Rise - t2Fall, 3);

          // 拆分外圈和内圈的逻辑
          let outerRing = Math.pow(t1Rise - t1Fall, 2) * 0.4 + t2 * 0.6;

          // 🔑 极大地压缩内圈大小，让它们看起来像小圆点（从 0.6 压低到 0.15）
          let innerFill = smoothstep(ringRadius, 0, dist) * 0.15;

          // 记录基础的骨架亮度，用于稳定透明度
          const baseT = outerRing + innerFill * 2.0;

          // 🔑 进一步缩小粒子尺度的变化幅度，同时拉高底座，让它们一直保持粗壮
          const smoothBreath = (Math.sin(realDist * 0.02 - time * 4) + 1) * 0.5;
          outerRing *= (1.6 + smoothBreath * 0.1);

          let t = outerRing + innerFill;

          const bgNoise = smoothNoise(p.homeX * 0.003, p.homeY * 0.003 + time * 0.25);
          t += Math.pow((bgNoise + 1.5) * 0.5, 2) * 0.15;

          p.targetScale = t;
          p.scale += (p.targetScale - p.scale) * 0.05;

          if(p.baseScale === undefined) p.baseScale = 0;
          p.baseScale += (baseT - p.baseScale) * 0.05;

          // 甜甜圈引力：外圈往内扣，内圈往外推，将粒子物理上挤压到圆环线上
          let pushX = 0, pushY = 0;
          if (dist > 1 && outerRing > 0.01) {
            const diff = dist - ringRadius;
            const pullForce = -diff * outerRing * 0.04;
            pushX = (dx / dist) * pullForce;
            pushY = (dy / dist) * pullForce;
          }

          const finalX = p.homeX + noiseX + sinX + pushX;
          const finalY = p.homeY + noiseY + sinY + pushY;

          // 🔑 粒子朝向：短头朝向鼠标（径向排列）
          // 去掉 Math.PI / 2，让线段的尖端（短边）直指鼠标中心
          const angleToRing = Math.atan2(p.homeY - ringY, p.homeX - ringX);
          const noiseAngle = smoothNoise(p.homeX * 0.01 + 18.49, p.homeY * 0.01 + time * 0.85) * 0.3;
          const twist = dist > ringRadius ? 0.15 : -0.15;
          const dashAngle = angleToRing + noiseAngle + twist;

          // 🔑 缩小粒子的长和宽
          const size = p.scale * 10;
          if (size < 0.2) return;

          // 🔑 显著减慢色彩变换的速度：time 系数从 150 骤降到 40
          const hue = (dist * 0.3 - time * 40 + p.noisePhase) % 360;

          // 透明度：使用极其稳定的 baseScale，不再受动态尺寸波纹的影响，彻底杜绝闪烁感！
          const alpha = smoothstep(0.01, 0.2, p.baseScale) * (isLight ? 0.85 : 0.9);
          if (alpha < 0.01) return;

          const dashW = size;
          const dashH = size * 0.4;

          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.rotate(dashAngle);
          ctx.globalAlpha = alpha;
          // 直接使用 HSL 实现多彩，亮度适当提高
          ctx.fillStyle = `hsl(${hue >= 0 ? hue : hue + 360}, 95%, 65%)`;

          // 圆角矩形路径
          const r = Math.min(dashH * 0.5, dashW * 0.25);
          const x = -dashW / 2, y = -dashH / 2;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + dashW - r, y);
          ctx.quadraticCurveTo(x + dashW, y, x + dashW, y + r);
          ctx.lineTo(x + dashW, y + dashH - r);
          ctx.quadraticCurveTo(x + dashW, y + dashH, x + dashW - r, y + dashH);
          ctx.lineTo(x + r, y + dashH);
          ctx.quadraticCurveTo(x, y + dashH, x, y + dashH - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        });

        ctx.globalAlpha = 1.0;
        particlesAnimFrame = requestAnimationFrame(animateParticles);
      }

      // smoothstep 辅助函数
      function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
      }

      // 粒子开关控制
      let storedParticlesEnabled = null;
      try {
        storedParticlesEnabled = localStorage.getItem('particles_enabled');
      } catch (err) {}

      const isSmallViewport = window.matchMedia('(max-width: 768px)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.themeParticlesEnabled = storedParticlesEnabled === null
        ? !isSmallViewport && !prefersReducedMotion
        : storedParticlesEnabled !== 'false';
      let particlesAnimFrame = null;

      const particleToggle = document.getElementById('theme-particle-toggle');

      function updateParticleToggle() {
        if (!particleToggle) return;
        particleToggle.innerHTML = window.themeParticlesEnabled
          ? '<i class="bi bi-stars" aria-hidden="true"></i>'
          : '<i class="bi bi-star" aria-hidden="true"></i>';
        particleToggle.setAttribute('aria-pressed', String(window.themeParticlesEnabled));
        particleToggle.classList.toggle('active', window.themeParticlesEnabled);
      }

      function stopParticles() {
        if (particlesAnimFrame) {
          cancelAnimationFrame(particlesAnimFrame);
          particlesAnimFrame = null;
        }
        ctx.clearRect(0, 0, width, height);
      }

      function startParticles() {
        if (!window.themeParticlesEnabled || document.hidden || !heroVisible) return;
        if (particlesAnimFrame) return;
        animateParticles();
      }

      if (particleToggle) {
        updateParticleToggle();

        particleToggle.addEventListener('click', () => {
          window.themeParticlesEnabled = !window.themeParticlesEnabled;
          try {
            localStorage.setItem('particles_enabled', String(window.themeParticlesEnabled));
          } catch (err) {}
          updateParticleToggle();
          if (window.themeParticlesEnabled) {
            startParticles();
          } else {
            stopParticles();
          }
        });
      }

      const heroObserver = new IntersectionObserver(entries => {
        heroVisible = entries[0]?.isIntersecting ?? true;
        if (heroVisible) {
          startParticles();
        } else {
          stopParticles();
        }
      }, { rootMargin: '120px 0px' });
      heroObserver.observe(hero);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          stopParticles();
        } else {
          startParticles();
        }
      });

      updateParticleToggle();
      startParticles();
    }

    initParticles();

  }

  function initPostCards() {
    const cards = document.querySelectorAll('[data-post-card]');
    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canTilt = !prefersReducedMotion && window.matchMedia('(pointer: fine)').matches;

    cards.forEach(card => {
      let frame = null;
      let targetX = 50;
      let targetY = 35;
      let currentX = 50;
      let currentY = 35;
      let targetRx = 0;
      let targetRy = 0;
      let currentRx = 0;
      let currentRy = 0;
      let hovering = false;

      function render() {
        currentX += (targetX - currentX) * 0.16;
        currentY += (targetY - currentY) * 0.16;
        currentRx += (targetRx - currentRx) * 0.14;
        currentRy += (targetRy - currentRy) * 0.14;

        card.style.setProperty('--mx', currentX.toFixed(2) + '%');
        card.style.setProperty('--my', currentY.toFixed(2) + '%');

        if (canTilt) {
          card.style.setProperty('--rx', currentRx.toFixed(3) + 'deg');
          card.style.setProperty('--ry', currentRy.toFixed(3) + 'deg');
        }

        const stillMoving =
          Math.abs(targetX - currentX) > 0.05 ||
          Math.abs(targetY - currentY) > 0.05 ||
          Math.abs(targetRx - currentRx) > 0.01 ||
          Math.abs(targetRy - currentRy) > 0.01;

        if (stillMoving || hovering) frame = requestAnimationFrame(render);
        else frame = null;
      }

      function ensureFrame() {
        if (!frame) frame = requestAnimationFrame(render);
      }

      card.addEventListener('pointerenter', () => {
        hovering = true;
        ensureFrame();
      });

      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        targetX = px * 100;
        targetY = py * 100;
        if (canTilt) {
          targetRy = (px - 0.5) * 6;
          targetRx = (0.5 - py) * 4.5;
        }
        ensureFrame();
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        hovering = false;
        targetX = 50;
        targetY = 35;
        targetRx = 0;
        targetRy = 0;
        ensureFrame();
      });
    });
  }

  function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      if (anchor.closest('.toc') || anchor.closest('.toc-sidebar') || anchor.classList.contains('toc-link')) {
        return;
      }

      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        try {
          const target = document.getElementById(href.substring(1));
          if (!target) return;
          const offset = window.innerHeight * 0.1;
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          if (window.lenis) window.lenis.scrollTo(top);
          else window.scrollTo({ top, behavior: 'smooth' });
        } catch (err) {
          console.error('Scroll error:', err);
        }
      });
    });
  }

  function boot() {
    initHeroInteraction();
    initPostCards();
    initAnchorScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.addEventListener('load', () => {
    document.body.classList.add('loaded');
  });
})();