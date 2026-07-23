;(() => {
  const page = document.querySelector('[data-taxonomy-page]')
  if (!page) return

  const controls = page.querySelector('[data-taxonomy-controls]')
  const tree = page.querySelector('[data-taxonomy-tree]')
  const filter = page.querySelector('[data-taxonomy-filter]')
  const clearButton = page.querySelector('[data-taxonomy-clear]')
  const visibleCount = page.querySelector('[data-taxonomy-visible-count]')
  const emptyState = page.querySelector('[data-taxonomy-empty]')
  const sortButtons = Array.from(page.querySelectorAll('[data-taxonomy-sort]'))
  const branches = Array.from(page.querySelectorAll('[data-taxonomy-branch]'))
  const normalize = value => String(value || '').trim().toLocaleLowerCase()

  let savedOpenState = null

  const captureOpenState = () => {
    savedOpenState = new Map()
    page.querySelectorAll('details').forEach(details => {
      savedOpenState.set(details, details.open)
    })
  }

  const restoreOpenState = () => {
    if (!savedOpenState) return
    savedOpenState.forEach((open, details) => {
      details.open = open
    })
    savedOpenState = null
  }

  const updateVisibleCount = count => {
    if (visibleCount) visibleCount.textContent = String(count)
    if (emptyState) emptyState.hidden = count !== 0
  }

  const applyFilter = () => {
    const query = normalize(filter?.value)
    const searchStarting = query && !savedOpenState

    if (searchStarting) captureOpenState()

    let count = 0
    branches.forEach(branch => {
      const rootMatches = normalize(branch.dataset.taxonomyRootSearch).includes(query)
      const subbranches = Array.from(
        branch.querySelectorAll('[data-taxonomy-subbranch]'),
      )
      let matchingSubbranches = 0

      subbranches.forEach(subbranch => {
        const matches = !query
          || rootMatches
          || normalize(subbranch.dataset.taxonomySearch).includes(query)

        subbranch.hidden = !matches
        if (matches) matchingSubbranches += 1

        if (query && matches && !rootMatches) {
          const details = subbranch.querySelector('details')
          if (details) details.open = true
        }
      })

      const matches = !query || rootMatches || matchingSubbranches > 0
      branch.hidden = !matches

      if (matches) {
        count += 1
        if (query) {
          const details = branch.querySelector(':scope > details')
          if (details) details.open = true
        }
      }
    })

    if (!query) restoreOpenState()
    if (clearButton) clearButton.hidden = !query
    updateVisibleCount(count)
  }

  const sortBranches = mode => {
    const sorted = branches.slice().sort((left, right) => {
      const leftCount = Number(left.dataset.count) || 0
      const rightCount = Number(right.dataset.count) || 0
      const leftUpdated = Number(left.dataset.updated) || 0
      const rightUpdated = Number(right.dataset.updated) || 0
      const leftName = left.dataset.name || ''
      const rightName = right.dataset.name || ''

      if (mode === 'count') {
        return rightCount - leftCount
          || rightUpdated - leftUpdated
          || leftName.localeCompare(rightName)
      }

      return rightUpdated - leftUpdated
        || rightCount - leftCount
        || leftName.localeCompare(rightName)
    })

    const fragment = document.createDocumentFragment()
    sorted.forEach(branch => fragment.appendChild(branch))
    tree?.appendChild(fragment)

    sortButtons.forEach(button => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.taxonomySort === mode),
      )
    })
  }

  filter?.addEventListener('input', applyFilter)
  filter?.addEventListener('keydown', event => {
    if (event.key === 'Escape' && filter.value) {
      filter.value = ''
      applyFilter()
    }
  })

  clearButton?.addEventListener('click', () => {
    if (!filter) return
    filter.value = ''
    applyFilter()
    filter.focus()
  })

  sortButtons.forEach(button => {
    button.addEventListener('click', () => {
      sortBranches(button.dataset.taxonomySort || 'recent')
    })
  })

  sortBranches(page.dataset.defaultSort || 'recent')
  applyFilter()
  controls.hidden = false
})()
