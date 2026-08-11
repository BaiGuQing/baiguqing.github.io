;(() => {
  var navEl = document.getElementById('theme-nav')
  var navToggleEl = document.getElementById('theme-nav-toggle')

  const setNavOpen = open => {
    if (open && window.innerWidth <= 600) {
      document.body.style.setProperty(
        '--open-height',
        48 + document.querySelector('#theme-nav .nav-items').clientHeight + 'px',
      )
      document.body.classList.add('nav-open')
    } else {
      document.body.style.removeProperty('--open-height')
      document.body.classList.remove('nav-open')
    }
    navToggleEl?.setAttribute('aria-expanded', String(document.body.classList.contains('nav-open')))
  }

  navToggleEl?.addEventListener('click', e => {
    e.stopPropagation()
    setNavOpen(!document.body.classList.contains('nav-open'))
  })

  window.addEventListener('resize', () => {
    if (document.body.classList.contains('nav-open')) {
      document.body.style.setProperty(
        '--open-height',
        48 +
          document.querySelector('#theme-nav .nav-items').clientHeight +
          'px',
      )
    }
    if (window.innerWidth > 600) {
      setNavOpen(false)
    }
  })

  const syncColorSchemeToggles = value => {
    document.querySelectorAll('.color-scheme-toggle input').forEach(option => {
      option.checked = option.value == value
    })
  }

  if (document.querySelector('.color-scheme-toggle')) {
    syncColorSchemeToggles(document.body.dataset.colorScheme)
    document.querySelectorAll('.color-scheme-toggle input').forEach(option => {
      option.addEventListener('change', ev => {
        var value = ev.target.value
        ThemeCupertino.ColorScheme.set(value)
        syncColorSchemeToggles(value)
      })
    })
  }

  if (document.body.attributes['data-rainbow-banner']) {
    var shown = false
    switch (document.body.attributes['data-rainbow-banner-shown'].value) {
      case 'always':
        shown = true
        break
      case 'auto':
        shown =
          new Date().getMonth() + 1 ==
          parseInt(
            document.body.attributes['data-rainbow-banner-month'].value,
            10,
          )
        break
      default:
        break
    }
    if (shown) {
      var banner = document.createElement('div')

      banner.style.setProperty(
        '--gradient',
        `linear-gradient(90deg, ${document.body.attributes['data-rainbow-banner-colors'].value})`,
      )
      banner.classList.add('rainbow-banner')

      navEl.after(banner)
    }
  }

  const tocContent = document.querySelector('article.post .content')
  if (document.body.attributes['data-toc'] && tocContent) {
    const configuredMaxDepth = parseInt(
      document.body.attributes['data-toc-max-depth']?.value || '6',
      10,
    )
    const maxDepth = Number.isInteger(configuredMaxDepth)
      ? Math.min(Math.max(configuredMaxDepth, 1), 6)
      : 6

    var headingSelector = ''
    for (var i = 1; i <= maxDepth; i++) {
      headingSelector += 'h' + i + ','
    }
    headingSelector = headingSelector.slice(0, -1)
    const headings = Array.from(tocContent.querySelectorAll(headingSelector))

    var source = headings
      .map(heading => {
        const headerlink = heading.querySelector('.headerlink')
        const label = heading.cloneNode(true)
        label.querySelectorAll('.headerlink').forEach(link => link.remove())

        return {
          html: label.innerHTML.trim(),
          text: label.textContent.trim(),
          href: headerlink?.getAttribute('href') || null,
          level: parseInt(heading.tagName.substring(1), 10),
        }
      })
      .filter(heading => heading.href && heading.text)

    if (source.length) {
      const tocContainer = document.createElement('aside')
      tocContainer.classList.add('toc-sidebar')
      const toc = document.createElement('div')
      toc.classList.add('toc')

      // 添加标题
      const tocTitle = document.createElement('div')
      tocTitle.classList.add('toc-title')
      tocTitle.textContent = '目录'
      toc.appendChild(tocTitle)

      source.forEach(entry => {
        const item = document.createElement('p')
        item.classList.add('toc-item')
        item.setAttribute('data-level', entry.level)
        const link = document.createElement('a')
        link.href = entry.href
        link.innerHTML = entry.html
        item.appendChild(link)
        toc.appendChild(item)
      })
      tocContainer.appendChild(toc)

      document.body.appendChild(tocContainer)

      // 添加一个标志位，用于防止点击跳转时的滚动被观察者覆盖状态
      let isTocScrolling = false;
      let tocScrollTimeout = null;

      // 高亮当前阅读位置
      const observer = new IntersectionObserver(entries => {
        // 如果正在因为点击目录而滚动，暂停观察者的状态更新
        if (isTocScrolling) return;

        entries.forEach(entry => {
          const id = entry.target.getAttribute('id')
          if (id) {
            const tocLink = toc.querySelector(`a[href="#${id}"]`)
            if (entry.isIntersecting) {
              // 移除所有活动状态
              toc.querySelectorAll('a').forEach(a => a.classList.remove('active'))
              // 添加当前活动状态
              if (tocLink) {
                tocLink.classList.add('active')
              }
            }
          }
        })
      }, {
        rootMargin: '-20% 0px -70% 0px'
      })

      headings.forEach(heading => {
        if (heading.id) {
          observer.observe(heading)
        }
      })

      // 平滑滚动
      toc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault()

          // 点击时立即提供反馈
          toc.querySelectorAll('a').forEach(a => a.classList.remove('active'))
          link.classList.add('active')

          const targetId = link.getAttribute('href').substring(1)
          const targetElement = document.getElementById(targetId)
          if (targetElement) {
            // 开始平滑滚动前设置标志位
            isTocScrolling = true;
            clearTimeout(tocScrollTimeout);

            // 计算适合观察者 (IntersectionObserver) 高亮区间的位置
            const offset = window.innerHeight * 0.25
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset
            const targetHash = link.getAttribute('href')

            if (window.location.hash !== targetHash) {
              window.history.pushState(null, '', targetHash)
            }

            if (typeof window.themeSmoothScrollTo === 'function') {
              // 使用统一滚动驱动，避免标题距离改变跳转手感
              window.themeSmoothScrollTo(targetPosition)
            } else {
              window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
              })
            }

            // 滚动结束后解除锁定，允许正常的高亮观察
            // 使用 scrollend 事件（现代浏览器）或定时器作为后备
            const unlockObserver = () => {
              isTocScrolling = false;
              clearTimeout(tocScrollTimeout);
              window.removeEventListener('scrollend', unlockObserver);
              const hadTabIndex = targetElement.hasAttribute('tabindex')
              if (!hadTabIndex) {
                targetElement.setAttribute('tabindex', '-1')
                targetElement.addEventListener('blur', () => {
                  targetElement.removeAttribute('tabindex')
                }, { once: true })
              }
              targetElement.focus({ preventScroll: true })
            };
            window.addEventListener('scrollend', unlockObserver);
            tocScrollTimeout = setTimeout(unlockObserver, 1500); // 覆盖最远标题跳转的最长持续时间
          }
        })
      })
    }
  }

  const heroEl = document.querySelector('.hero.exit-while-scroll')
  if (heroEl) {
    const updateHeroHeight = () => {
      heroEl.style.setProperty('--current-hero-height', heroEl.clientHeight)
    }

    updateHeroHeight()
    window.addEventListener('resize', updateHeroHeight)
  }
})()
