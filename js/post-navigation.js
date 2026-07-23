(function () {
  'use strict';

  var STORAGE_KEY = 'cupertino-reading-route-v1';
  var controls = document.querySelector('[data-post-navigation-controls]');
  var dataElement = document.getElementById('post-navigation-data');
  var navigation = document.querySelector('[data-post-navigation]');

  if (!controls || !dataElement || !navigation) return;

  var payload;

  try {
    payload = JSON.parse(dataElement.textContent || '');
  } catch (error) {
    return;
  }

  var contexts = Array.isArray(payload.contexts) ? payload.contexts : [];
  var contextByKey = new Map();

  contexts.forEach(function (context) {
    if (!context || typeof context.key !== 'string' || !context.modes) return;
    contextByKey.set(context.key, context);
  });

  if (!contextByKey.size) return;

  var lineSelect = controls.querySelector('[data-reading-route-line]');
  var sortSelect = controls.querySelector('[data-reading-route-sort]');
  var lineField = controls.querySelector('[data-reading-route-line-field]');
  var summary = controls.querySelector('[data-reading-route-summary]');
  var status = controls.querySelector('[data-reading-route-status]');
  var labels = Object.assign({
    allPosts: 'All posts',
    summary: 'Continue through {name}',
    position: '{name} · {current} / {total}',
    atStart: 'Start of this route',
    atEnd: 'End of this route',
    onlyOne: 'Only article in this route',
    previousBoundary: 'Start of route',
    nextBoundary: 'End of route',
    unavailable: 'This reading route is unavailable'
  }, payload.labels || {});

  if (!lineSelect || !sortSelect || !summary || !status) return;

  function modeFor(line, sort) {
    var context = contextByKey.get(line);
    if (!context || !context.modes || !context.modes[sort]) return null;
    return { context: context, mode: context.modes[sort] };
  }

  function validState(candidate) {
    if (!candidate || typeof candidate.line !== 'string' || typeof candidate.sort !== 'string') {
      return null;
    }

    return modeFor(candidate.line, candidate.sort) ? candidate : null;
  }

  function readUrlState() {
    var url = new URL(window.location.href);
    return validState({
      line: url.searchParams.get('line'),
      sort: url.searchParams.get('sort')
    });
  }

  function readStoredState() {
    try {
      return validState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch (error) {
      return null;
    }
  }

  function writeStoredState(state) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      // URL state and in-memory navigation remain available without storage.
    }
  }

  function defaultState() {
    return validState({
      line: payload.defaultLine,
      sort: payload.defaultSort
    }) || validState({
      line: contexts[0] && contexts[0].key,
      sort: sortSelect.options[0] && sortSelect.options[0].value
    });
  }

  function resolveState() {
    var urlState = readUrlState();
    if (urlState) return { state: urlState, source: 'url' };

    var storedState = readStoredState();
    if (storedState) return { state: storedState, source: 'storage' };

    return { state: defaultState(), source: 'default' };
  }

  function formatMessage(template, values) {
    return Object.keys(values).reduce(function (message, key) {
      return message.split('{' + key + '}').join(String(values[key]));
    }, String(template || ''));
  }

  function contextName(context) {
    return context.type === 'global' ? labels.allPosts : context.name;
  }

  function postUrl(path, line, sort) {
    var root = document.body.dataset.configRoot || '/';
    var base = new URL(root, window.location.origin);

    if (!base.pathname.endsWith('/')) base.pathname += '/';

    var target = new URL(String(path || '').replace(/^\/+/, ''), base);
    target.searchParams.set('line', line);
    target.searchParams.set('sort', sort);

    return target.pathname + target.search + target.hash;
  }

  function updateTarget(direction, reference, state, total) {
    var target = navigation.querySelector('[data-nav-target="' + direction + '"]');
    if (!target) return;

    var link = target.querySelector('[data-nav-link]');
    var title = target.querySelector('[data-nav-title]');
    var boundary = target.querySelector('[data-nav-boundary]');
    var boundaryText = target.querySelector('[data-nav-boundary-text]');
    var hasReference = reference && typeof reference.path === 'string' && reference.path;

    if (!link || !title || !boundary || !boundaryText) return;

    target.classList.toggle('is-boundary', !hasReference);
    target.setAttribute('aria-disabled', hasReference ? 'false' : 'true');

    if (hasReference) {
      link.href = postUrl(reference.path, state.line, state.sort);
      link.hidden = false;
      title.textContent = reference.title || reference.path;
      boundary.hidden = true;
      return;
    }

    link.hidden = true;
    link.removeAttribute('href');
    title.textContent = '';
    boundary.hidden = false;
    boundaryText.textContent = total === 1
      ? labels.onlyOne
      : (direction === 'previous' ? labels.previousBoundary : labels.nextBoundary);
  }

  function render(state) {
    var active = modeFor(state.line, state.sort);
    if (!active) {
      status.textContent = labels.unavailable;
      return false;
    }

    var name = contextName(active.context);
    var mode = active.mode;
    var boundaryMessage = '';

    lineSelect.value = state.line;
    sortSelect.value = state.sort;
    summary.textContent = formatMessage(labels.summary, { name: name });

    if (mode.total === 1) {
      boundaryMessage = labels.onlyOne;
    } else if (!mode.previous) {
      boundaryMessage = labels.atStart;
    } else if (!mode.next) {
      boundaryMessage = labels.atEnd;
    }

    status.textContent = [
      formatMessage(labels.position, {
        name: name,
        current: mode.position,
        total: mode.total
      }),
      boundaryMessage
    ].filter(Boolean).join(' · ');

    updateTarget('previous', mode.previous, state, mode.total);
    updateTarget('next', mode.next, state, mode.total);
    return true;
  }

  function replaceUrlState(state) {
    var url = new URL(window.location.href);
    url.searchParams.set('line', state.line);
    url.searchParams.set('sort', state.sort);
    window.history.replaceState(
      window.history.state,
      '',
      url.pathname + url.search + url.hash
    );
  }

  function applyExplicitState(state) {
    if (!validState(state) || !render(state)) return;
    writeStoredState(state);
    replaceUrlState(state);
  }

  var resolved = resolveState();
  if (!resolved.state || !render(resolved.state)) return;

  if (resolved.source === 'url') writeStoredState(resolved.state);
  if (lineField) lineField.hidden = contextByKey.size <= 1;
  controls.hidden = false;

  lineSelect.addEventListener('change', function () {
    applyExplicitState({ line: lineSelect.value, sort: sortSelect.value });
  });

  sortSelect.addEventListener('change', function () {
    applyExplicitState({ line: lineSelect.value, sort: sortSelect.value });
  });

  window.addEventListener('popstate', function () {
    var nextResolved = resolveState();
    if (!nextResolved.state || !render(nextResolved.state)) return;
    if (nextResolved.source === 'url') writeStoredState(nextResolved.state);
  });
})();
