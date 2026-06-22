// 自定义炫酷交互效果
(function() {
  'use strict';

  // Antigravity 英雄区域无界全息交互
  function initHeroInteraction() {
    const hero = document.getElementById('hero-interactive');
    const hologramText = document.querySelector('.text-hologram');
    const tracker = document.querySelector('.hero-ambient-tracker');

    if (!hero || !hologramText || !tracker) return;

    document.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // 直接把相对坐标交给 CSS 变量，实现 0 延迟手电筒追踪
      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;
      tracker.style.setProperty('--mouse-x', `${relativeX}px`);
      tracker.style.setProperty('--mouse-y', `${relativeY}px`);
      
      // 全息文字光影：仅当鼠标在英雄区域内触发交互
      const isOverHero = e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right;
      
      if (isOverHero) {
        // 更新文字的 3D 微倾斜
        const tiltX = (e.clientY - rect.top - centerY) * -0.01;
        const tiltY = (e.clientX - rect.left - centerX) * 0.01;
        hologramText.parentElement.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;

        // 更新文字内部的反射高光中心
        const textRect = hologramText.getBoundingClientRect();
        hologramText.style.setProperty('--mouse-x', `${e.clientX - textRect.left}px`);
        hologramText.style.setProperty('--mouse-y', `${e.clientY - textRect.top}px`);
      } else {
        hologramText.parentElement.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      }
    });

    // 🌌 Antigravity 粒子场 — 精准复刻版
    // 基于 antigravity.google 源码分析：Ring-based scaling + Noise displacement + 3-color mixing
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
        width = rect.width;
        height = rect.height;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        if (particles.length === 0) initSetup();
      }

      function initSetup() {
        particles = [];
        // 适当回调粒子间距，增加一点粒子数量
        const spacing = 50; 
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
      let time = 0;

      document.addEventListener('mousemove', (e) => {
        const rect = canvas.parentElement.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        mouseInside = (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height);
      });

      function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        time += 0.016; 

        const isLight = document.documentElement.getAttribute('data-color-scheme') === 'light';
        
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
      window.themeParticlesEnabled = localStorage.getItem('particles_enabled') !== 'false';
      let particlesAnimFrame;

      const particleToggle = document.getElementById('theme-particle-toggle');
      if (particleToggle) {
        // 初始化图标状态
        particleToggle.innerHTML = window.themeParticlesEnabled ? '<i class="bi bi-stars"></i>' : '<i class="bi bi-star"></i>';
        
        particleToggle.addEventListener('click', () => {
          window.themeParticlesEnabled = !window.themeParticlesEnabled;
          localStorage.setItem('particles_enabled', window.themeParticlesEnabled);
          particleToggle.innerHTML = window.themeParticlesEnabled ? '<i class="bi bi-stars"></i>' : '<i class="bi bi-star"></i>';
          
          if (window.themeParticlesEnabled) {
            animateParticles();
          } else {
            cancelAnimationFrame(particlesAnimFrame);
            ctx.clearRect(0, 0, width, height);
          }
        });
      }

      if (window.themeParticlesEnabled) {
        animateParticles();
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    // 文本乱码解码入场动效 (Cryptic Text Decode)
    function decodeTextAnimation() {
      const originalText = hologramText.getAttribute('data-text');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}|:<>?';
      let iterations = 0;
      const interval = setInterval(() => {
        hologramText.innerText = originalText.split('').map((char, index) => {
          if (char === '\n' || char === '，' || char === '。') return char;
          if (index < iterations) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        if (iterations >= originalText.length) {
          clearInterval(interval);
          // 确保换行渲染正确
          hologramText.innerHTML = originalText.replace(/\n/g, '<br>');
        }
        iterations += 1/3; // 控制解码速度
      }, 30);
    }
    
    // 延迟一点启动解码
    setTimeout(decodeTextAnimation, 300);

    initParticles();
  }

  // DOM 加载完成后创建粒子效果和交互
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroInteraction);
  } else {
    initHeroInteraction();
  }

  // 平滑滚动到锚点
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // 排除目录链接，因为 main.js 中已经有专门处理目录点击的逻辑
    if (anchor.closest('.toc') || anchor.closest('.toc-sidebar') || anchor.classList.contains('toc-link')) {
      return;
    }
    
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      try {
        // 使用 getElementById 避免 querySelector 对特殊字符 id 报错
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          const offset = window.innerHeight * 0.25;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
          if (window.lenis) {
            window.lenis.scrollTo(targetPosition);
          } else {
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });
          }
        }
      } catch (err) {
        console.error('Scroll error:', err);
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
