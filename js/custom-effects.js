// Homepage + post-card interactions (restored editorial version)
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

  }


  // Full-viewport particle field — not limited to the hero.
  // Fixed canvas, pointer-events none; ring follows the cursor anywhere.
  function initSiteParticles() {
    let canvas = document.getElementById('site-particles');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'site-particles';
      canvas.className = 'site-particles';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    // Hide legacy hero canvas if present (homepage markup)
    const legacy = document.getElementById('hero-particles');
    if (legacy) {
      legacy.style.display = 'none';
    }

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let particles = [];
    let particlesAnimFrame = null;

    function noise2D(x, y) {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return (n - Math.floor(n)) * 2 - 1;
    }
    function smoothNoise(x, y) {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const n00 = noise2D(ix, iy), n10 = noise2D(ix + 1, iy);
      const n01 = noise2D(ix, iy + 1), n11 = noise2D(ix + 1, iy + 1);
      return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
    }
    function smoothstep(edge0, edge1, x) {
      const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    }

    function resize() {
      // Cap at 1.25: the field is soft glowing dust, extra pixels are invisible
      // but multiply raster cost on HiDPI laptops.
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      initSetup();
    }

    function initSetup() {
      particles = [];
      const spacing = 62;
      const cols = Math.ceil(width / spacing);
      const rows = Math.ceil(height / spacing);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const homeX = i * spacing + (Math.random() - 0.5) * spacing * 0.8;
          const homeY = j * spacing + (Math.random() - 0.5) * spacing * 0.8;
          if (homeX < 0 || homeX > width || homeY < 0 || homeY > height) continue;
          particles.push({
            homeX: homeX,
            homeY: homeY,
            x: homeX,
            y: homeY,
            scale: 0,
            targetScale: 0,
            seed: Math.random(),
            noisePhase: Math.random() * 100,
            baseScale: 0
          });
        }
      }
    }

    let ringX = 0, ringY = 0;
    let mouseX = 0, mouseY = 0;
    let mouseInside = false;
    let time = 0;

    function onPointerMove(event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      mouseInside = true;
    }
    function onPointerLeave() {
      mouseInside = false;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('resize', resize);
    resize();
    ringX = width / 2;
    ringY = height / 2;
    mouseX = ringX;
    mouseY = ringY;

    let lastFrameTs = 0;

    function animateParticles(ts) {
      if (!window.themeParticlesEnabled || document.hidden) {
        if (particlesAnimFrame) {
          cancelAnimationFrame(particlesAnimFrame);
          particlesAnimFrame = null;
        }
        return;
      }

      ctx.clearRect(0, 0, width, height);
      // Simulation runs on a real time base so motion is identical at any
      // frame rate (throttled tabs, skipped frames, slow GPUs).
      const dt = lastFrameTs ? Math.min(Math.max((ts - lastFrameTs) / 1000, 0.001), 0.05) : 0.016;
      lastFrameTs = ts;
      time += dt;

      const isLight = document.body.dataset.currentColorScheme === 'light';
      // Per-60fps-frame factors 0.03 / 0.015 converted to rate form.
      const lerpFactor = 1 - Math.exp(-(mouseInside ? 1.9 : 0.94) * dt);
      const scaleLerp = 1 - Math.exp(-3.2 * dt);
      const noiseOffX = Math.sin(time * 0.66 + 94.234) * 15;
      const noiseOffY = Math.cos(time * 0.75 + 21.028) * 10;
      const targetRingX = mouseInside ? mouseX + noiseOffX : width / 2 + noiseOffX * 3;
      const targetRingY = mouseInside ? mouseY + noiseOffY : height / 2 + noiseOffY * 2;
      ringX += (targetRingX - ringX) * lerpFactor;
      ringY += (targetRingY - ringY) * lerpFactor;

      const radiusState = (smoothNoise(time * 0.15, 123.45) + 1) * 0.5;
      const radiusFactor = smoothstep(0.3, 0.7, radiusState);
      const maxRadius = Math.max(500, Math.min(width, height) * 0.45);
      const minRadius = 400;
      const currentBaseRadius = minRadius + (maxRadius - minRadius) * radiusFactor;
      const ringRadius = currentBaseRadius + Math.sin(time * 1.5) * (5 * radiusFactor);
      const ringWidth = Math.max(30, currentBaseRadius * 0.7);
      const ringWidth2 = Math.max(12, currentBaseRadius * 0.3);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.homeX - ringX;
        const dy = p.homeY - ringY;
        const realDist = Math.sqrt(dx * dx + dy * dy);
        const shapeNoise = smoothNoise(p.homeX * 0.003 - time * 0.2, p.homeY * 0.003 + time * 0.3) * 60;
        const dist = realDist + shapeNoise;

        const noiseX = smoothNoise(p.homeX * 0.005 + 18.49, p.homeY * 0.005 + time * 0.35) * 8;
        const noiseY = smoothNoise(p.homeX * 0.005 + 50.90, p.homeY * 0.005 + time * 0.35) * 8;
        const sinX = Math.sin(p.homeX * 0.02 + time * 2) * 3 * Math.min(dist / 100, 1);
        const sinY = Math.cos(p.homeY * 0.02 + time * 1.5) * 3 * Math.min(dist / 100, 1);

        const t1Rise = smoothstep(ringRadius - ringWidth * 2, ringRadius, dist);
        const t1Fall = smoothstep(ringRadius, ringRadius + ringWidth, dist);
        const t2Rise = smoothstep(ringRadius - ringWidth2 * 2, ringRadius, dist);
        const t2Fall = smoothstep(ringRadius, ringRadius + ringWidth2, dist);
        let t2 = Math.pow(t2Rise - t2Fall, 3);
        let outerRing = Math.pow(t1Rise - t1Fall, 2) * 0.4 + t2 * 0.6;
        let innerFill = smoothstep(ringRadius, 0, dist) * 0.15;
        const baseT = outerRing + innerFill * 2.0;
        const smoothBreath = (Math.sin(realDist * 0.02 - time * 4) + 1) * 0.5;
        outerRing *= (1.6 + smoothBreath * 0.1);
        let t = outerRing + innerFill;
        const bgNoise = smoothNoise(p.homeX * 0.003, p.homeY * 0.003 + time * 0.25);
        t += Math.pow((bgNoise + 1.5) * 0.5, 2) * 0.15;

        p.targetScale = t;
        p.scale += (p.targetScale - p.scale) * scaleLerp;
        p.baseScale += (baseT - p.baseScale) * scaleLerp;

        let pushX = 0, pushY = 0;
        if (dist > 1 && outerRing > 0.01) {
          const diff = dist - ringRadius;
          const pullForce = -diff * outerRing * 0.04;
          pushX = (dx / dist) * pullForce;
          pushY = (dy / dist) * pullForce;
        }

        const finalX = p.homeX + noiseX + sinX + pushX;
        const finalY = p.homeY + noiseY + sinY + pushY;
        const angleToRing = Math.atan2(p.homeY - ringY, p.homeX - ringX);
        const noiseAngle = smoothNoise(p.homeX * 0.01 + 18.49, p.homeY * 0.01 + time * 0.85) * 0.3;
        const twist = dist > ringRadius ? 0.15 : -0.15;
        const dashAngle = angleToRing + noiseAngle + twist;

        const size = p.scale * 12;
        if (size < 0.15) continue;

        const hue = (dist * 0.3 - time * 40 + p.noisePhase) % 360;
        const alpha = Math.min(1, smoothstep(0.005, 0.1, p.baseScale));
        if (alpha < 0.02) continue;
        const drawAlpha = Math.min(0.85, Math.max(alpha, 0.22));

        const dashW = size;
        const dashH = size * 0.42;

        const cosA = Math.cos(dashAngle);
        const sinA = Math.sin(dashAngle);
        const m0 = cosA * pixelRatio;
        const m1 = sinA * pixelRatio;
        // One setTransform does rotate+translate; no save/restore per particle.
        ctx.setTransform(m0, m1, -m1, m0, finalX * pixelRatio, finalY * pixelRatio);

        const light = isLight ? 50 : 62;
        const h = hue >= 0 ? hue : hue + 360;
        const bodyColor = 'hsl(' + h + ', 95%, ' + light + '%)';

        // Soft halo via one low-alpha rect. Per-particle shadowBlur was the
        // single most expensive call in this loop; two cheap fills beat it
        // by an order of magnitude while looking nearly identical at 0.55
        // canvas opacity.
        if (size > 2.5) {
          ctx.globalAlpha = drawAlpha * 0.3;
          ctx.fillStyle = bodyColor;
          ctx.fillRect(-dashW, -dashH * 1.1, dashW * 2, dashH * 2.2);
        }

        ctx.globalAlpha = drawAlpha;
        ctx.fillStyle = bodyColor;

        const r = Math.min(dashH * 0.5, dashW * 0.25);
        const x = -dashW / 2, y = -dashH / 2;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, dashW, dashH, r);
        } else {
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + dashW - r, y);
          ctx.quadraticCurveTo(x + dashW, y, x + dashW, y + r);
          ctx.lineTo(x + dashW, y + dashH - r);
          ctx.quadraticCurveTo(x + dashW, y + dashH, x + dashW - r, y + dashH);
          ctx.lineTo(x + r, y + dashH);
          ctx.quadraticCurveTo(x, y + dashH, x, y + dashH - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.globalAlpha = 1;
      particlesAnimFrame = requestAnimationFrame(animateParticles);
    }

    let storedParticlesEnabled = null;
    try {
      storedParticlesEnabled = localStorage.getItem('particles_enabled');
    } catch (err) {}

    const isSmallViewport = window.matchMedia('(max-width: 768px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.themeParticlesEnabled = storedParticlesEnabled === null
      ? !isSmallViewport && !prefersReducedMotion
      : storedParticlesEnabled !== 'false';

    const particleToggle = document.getElementById('theme-particle-toggle');

    function updateParticleToggle() {
      if (!particleToggle) return;
      particleToggle.innerHTML = window.themeParticlesEnabled
        ? '<i class="bi bi-stars" aria-hidden="true"></i>'
        : '<i class="bi bi-star" aria-hidden="true"></i>';
      particleToggle.setAttribute('aria-pressed', String(window.themeParticlesEnabled));
      particleToggle.classList.toggle('active', window.themeParticlesEnabled);
      document.body.classList.toggle('particles-on', window.themeParticlesEnabled);
    }

    function stopParticles() {
      if (particlesAnimFrame) {
        cancelAnimationFrame(particlesAnimFrame);
        particlesAnimFrame = null;
      }
      ctx.clearRect(0, 0, width, height);
      canvas.style.visibility = 'hidden';
    }

    function startParticles() {
      if (!window.themeParticlesEnabled || document.hidden) return;
      canvas.style.visibility = 'visible';
      if (particlesAnimFrame) return;
      animateParticles();
    }

    if (particleToggle) {
      updateParticleToggle();
      particleToggle.addEventListener('click', function () {
        window.themeParticlesEnabled = !window.themeParticlesEnabled;
        try {
          localStorage.setItem('particles_enabled', String(window.themeParticlesEnabled));
        } catch (err) {}
        updateParticleToggle();
        if (window.themeParticlesEnabled) startParticles();
        else stopParticles();
      });
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopParticles();
      else startParticles();
    });

    updateParticleToggle();
    if (window.themeParticlesEnabled) startParticles();
    else stopParticles();
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


  // Homepage seam split — continuous rAF driver (does not depend on scroll events).
  // Writes --hero-split on .hero-reveal--split; CSS applies the panel transforms.
  function initHeroSplitReveal() {
    const reveal = document.querySelector('.hero-reveal--split, .hero-reveal');
    const hero = document.getElementById('hero-interactive');
    if (!reveal || !hero) return;
    if (!hero.classList.contains('exit-while-scroll') && !reveal.classList.contains('hero-reveal--split')) {
      return;
    }

    // NOTE: do NOT early-return on prefers-reduced-motion.
    // The seam split is the homepage's core scroll interaction; Windows often
    // enables "reduce motion" globally and was completely killing this effect.
    // Entrance fades / particles still respect reduced-motion elsewhere.

    const left = hero.querySelector('.hero-panel--left');
    const right = hero.querySelector('.hero-panel--right');
    if (!left || !right) return;

    // Article list sits behind the sticky cover; keep it hidden until the seam opens
    const feed = reveal.nextElementSibling && reveal.nextElementSibling.classList.contains('home-container')
      ? reveal.nextElementSibling
      : document.querySelector('.home-container');

    reveal.classList.add('hero-reveal--split');
    reveal.classList.add('is-js-split');
    if (feed) {
      feed.classList.add('home-container--under-hero');
      feed.style.opacity = '0';
      feed.style.visibility = 'hidden';
      feed.style.pointerEvents = 'none';
      feed.style.filter = 'none';
      feed.style.transform = 'none';
    }

    const MAX_TRAVEL = 112; // percent — enough overshoot to clear both panels
    const FOLLOW_RATE = 12; // exponential response; about 95% settled in 250ms
    const MAX_FRAME_SECONDS = 1 / 20;
    const SETTLE_EPSILON = 0.00005;
    let raf = 0;
    let renderedProgress = 0;
    let lastAppliedOpen = -1;
    let lastFrameTime = 0;
    let running = true;

    function clamp01(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function easeScroll(t) {
      // Spatial easing shapes the runway; temporal damping below absorbs wheel steps.
      return t * t * (3 - 2 * t);
    }

    function dampProgress(current, target, frameSeconds) {
      const response = 1 - Math.exp(-FOLLOW_RATE * frameSeconds);
      return current + (target - current) * response;
    }

    function scrollY() {
      // Prefer Lenis virtual scroll value when present
      if (window.lenis && typeof window.lenis.scroll === 'number') {
        return window.lenis.scroll;
      }
      return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    // Runway length is layout-dependent but stable between resizes; reading
    // offsetHeight every frame forced a synchronous layout per frame.
    let pinDistance = 0;

    function measurePin() {
      const measured = reveal.offsetHeight - hero.offsetHeight;
      pinDistance = measured > 40 ? measured : Math.max(1, window.innerHeight * 1.35);
    }

    function readProgress() {
      if (!pinDistance) measurePin();
      return clamp01(scrollY() / pinDistance);
    }

    function apply(progress) {
      const open = easeScroll(progress); // 0..1
      if (Math.abs(open - lastAppliedOpen) < SETTLE_EPSILON) return;
      lastAppliedOpen = open;
      const dist = open * MAX_TRAVEL;
      const l = (-dist).toFixed(2) + '%';
      const r = dist.toFixed(2) + '%';
      reveal.style.setProperty('--hero-split-left', l);
      reveal.style.setProperty('--hero-split-right', r);
      // 0 = closed cover, 1 = fully open (used by CSS to unhide the feed)
      reveal.style.setProperty('--hero-open', open.toFixed(3));

      if (feed) {
        // Reveal through opacity only. Filtering this large container every frame
        // adds compositor work and makes wheel-driven motion visibly uneven.
        // open 0    → hidden
        // open 0.05 → faint peek in the gap
        // open 0.45 → readable
        // open 0.67 → solid
        let feedOpacity = 0;
        if (open > 0.05) {
          const t = clamp01((open - 0.05) / 0.62);
          feedOpacity = 1 - Math.pow(1 - t, 1.45);
        }

        feed.style.opacity = feedOpacity.toFixed(3);
        feed.style.transform = 'none';
        feed.style.visibility = feedOpacity < 0.01 ? 'hidden' : 'visible';
        feed.style.pointerEvents = feedOpacity < 0.18 ? 'none' : 'auto';
        // Sticky cover is above the feed — never let the wrapper eat clicks.
        reveal.style.pointerEvents = 'none';
      }

    }

    function syncToScroll() {
      measurePin();
      renderedProgress = readProgress();
      lastAppliedOpen = -1;
      lastFrameTime = 0;
      apply(renderedProgress);
    }

    function frame(timestamp) {
      if (!running) return;
      const targetProgress = readProgress();
      const frameSeconds = lastFrameTime
        ? Math.min(Math.max((timestamp - lastFrameTime) / 1000, 0), MAX_FRAME_SECONDS)
        : 1 / 60;
      lastFrameTime = timestamp;
      renderedProgress = dampProgress(renderedProgress, targetProgress, frameSeconds);
      if (Math.abs(targetProgress - renderedProgress) < SETTLE_EPSILON) {
        renderedProgress = targetProgress;
      }
      apply(renderedProgress);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf) return;
      const targetProgress = readProgress();
      if (Math.abs(targetProgress - renderedProgress) > 0.5) {
        renderedProgress = targetProgress;
        lastAppliedOpen = -1;
        apply(renderedProgress);
      }
      lastFrameTime = 0;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      lastFrameTime = 0;
    }

    // Pause when hero runway is far off-screen to save CPU
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver(function (entries) {
        if (entries[0] && entries[0].isIntersecting) start();
        else {
          // one last apply so end state is correct, then stop
          syncToScroll();
          stop();
        }
      }, { rootMargin: '20% 0px' });
      io.observe(reveal);
    }

    window.addEventListener('resize', function () {
      syncToScroll();
    }, { passive: true });

    syncToScroll();
    start();
    window.addEventListener('load', function () {
      syncToScroll();
      start();
    }, { once: true });
  }

  function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      if (anchor.id === 'skip-to-content' || anchor.closest('.toc') || anchor.closest('.toc-sidebar') || anchor.classList.contains('toc-link')) {
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
          if (typeof window.themeSmoothScrollTo === 'function') window.themeSmoothScrollTo(top);
          else window.scrollTo({ top, behavior: 'smooth' });
        } catch (err) {
          console.error('Scroll error:', err);
        }
      });
    });
  }

  function boot() {
    initSiteParticles();
    initHeroInteraction();
    initPostCards();
    initHeroSplitReveal();
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
