;(() => {
  var navEl = document.getElementById('theme-nav')
  navEl.addEventListener('click', e => {
    if (window.innerWidth <= 600) {
      if (!document.body.classList.contains('nav-open')) {
        document.body.style.setProperty(
          '--open-height',
          48 +
            document.querySelector('#theme-nav .nav-items').clientHeight +
            'px',
        )
      }

      document.body.classList.toggle('nav-open')
    } else {
      document.body.style.removeProperty('--open-height')
      document.body.classList.remove('nav-open')
    }
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
      document.body.style.removeProperty('--open-height')
      document.body.classList.remove('nav-open')
    }
  })

  if (document.getElementById('theme-color-scheme-toggle')) {
    var themeColorSchemeToggleEl = document.getElementById(
      'theme-color-scheme-toggle',
    )
    var options = themeColorSchemeToggleEl.getElementsByTagName('input')

    for (const option of options) {
      if (option.value == document.body.dataset.colorScheme) {
        option.checked = true
      }
      option.addEventListener('change', ev => {
        var value = ev.target.value
        ThemeCupertino.ColorScheme.set(value)
        for (const o of options) {
          if (o.value != value) {
            o.checked = false
          }
        }
      })
    }
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

  if (document.body.attributes['data-toc']) {
    const content = document.getElementsByClassName('content')[0]
    const maxDepth = document.body.attributes['data-toc-max-depth'].value

    var headingSelector = ''
    for (var i = 1; i <= maxDepth; i++) {
      headingSelector += 'h' + i + ','
    }
    headingSelector = headingSelector.slice(0, -1)
    const headings = Array.from(content.querySelectorAll(headingSelector))

    var source = headings
      .map(heading => ({
        html: heading.innerHTML,
        href:
          heading.getElementsByClassName('headerlink')[0]?.attributes['href']
            .value ?? null,
        level: parseInt(heading.tagName.substring(1)),
      }))
      .filter(heading => heading.href)

    const tocContainer = document.createElement('aside')
    tocContainer.classList.add('toc-sidebar')
    const toc = document.createElement('div')
    toc.classList.add('toc')

    // 添加标题
    const tocTitle = document.createElement('div')
    tocTitle.classList.add('toc-title')
    tocTitle.textContent = '目录'
    toc.appendChild(tocTitle)

    for (const i in source) {
      const item = document.createElement('p')
      item.classList.add('toc-item')
      item.setAttribute('data-level', source[i].level)
      const link = document.createElement('a')
      link.href = source[i].href
      link.innerHTML = source[i].html
      link.removeChild(link.getElementsByClassName('headerlink')[0])
      item.appendChild(link)
      toc.appendChild(item)
    }
    tocContainer.appendChild(toc)

    if (toc.children.length > 1) {  // > 1 因为包含了标题
      document.body.appendChild(tocContainer)

      // 高亮当前阅读位置
      const observer = new IntersectionObserver(entries => {
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
            // 计算适合观察者 (IntersectionObserver) 高亮区间的位置
            // rootMargin 为 '-20% 0px -70% 0px'，因此 25% 的视口高度是最理想的落点
            const offset = window.innerHeight * 0.25
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            })
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
