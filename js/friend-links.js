/**
 * 友链头像（站点图标）兜底
 *
 * 友链卡片默认用对方站点的 /favicon.ico 当图片，但并不是每个站点都能命中。
 * 每张图的候选地址按顺序写在 <img data-fallbacks="a|b|c"> 里，这里逐个重试，
 * 全部失败就移除 <img>，露出底下「名称首字」的占位，不会出现裂图。
 *
 * 在 <head> 里同步加载：必须在任何 <img> 开始加载前注册好监听，
 * 否则先失败的图会漏掉（error 事件不冒泡，只能用捕获阶段代理）。
 */
;(function () {
  'use strict'

  const nextSource = img => {
    const rest = (img.dataset.fallbacks || '').split('|').filter(Boolean)

    if (!rest.length) {
      img.remove()
      return
    }

    img.dataset.fallbacks = rest.slice(1).join('|')
    img.src = rest[0]
  }

  document.addEventListener(
    'error',
    event => {
      const target = event.target
      if (target && target.tagName === 'IMG' && target.hasAttribute('data-fallbacks')) {
        nextSource(target)
      }
    },
    true,
  )

  // 兜一下「脚本执行前就已经失败」的图（缓存命中等极端情况）
  const sweep = () => {
    document.querySelectorAll('img[data-fallbacks]').forEach(img => {
      if (img.complete && img.naturalWidth === 0) nextSource(img)
    })
  }

  if (document.readyState === 'complete') {
    sweep()
  } else {
    window.addEventListener('load', sweep)
  }
})()
