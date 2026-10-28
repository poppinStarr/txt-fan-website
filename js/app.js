/*
  app.js
  A small hash router (so the site works on GitHub Pages and when opened
  straight from the folder), plus the bits every page shares: the nav,
  the song search, tabs and cover fallbacks.
*/
(function () {
  const view = document.getElementById('view');
  const ID = '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})';

  const ROUTES = [
    { re: /^\/?$/, page: 'home', nav: 'home' },
    { re: /^\/about\/?$/, page: 'about', nav: 'about' },
    { re: /^\/members\/?$/, page: 'members', nav: 'members' },
    { re: new RegExp(`^/members/${ID}$`), page: 'member', nav: 'members' },
    { re: /^\/music\/?$/, page: 'music', nav: 'music' },
    { re: new RegExp(`^/music/${ID}$`), page: 'album', nav: 'music' },
    { re: new RegExp(`^/events/${ID}$`), page: 'event', nav: 'events' },
  ];

  let renderId = 0;
  let cleanups = [];
  let lastPath = null;

  function parseHash() {
    const raw = location.hash.replace(/^#/, '') || '/';
    const [path, qs = ''] = raw.split('?');
    return { path, query: new URLSearchParams(qs) };
  }

  async function render() {
    cleanups.forEach((fn) => { try { fn(); } catch { /* already gone */ } });
    cleanups = [];

    const id = ++renderId;
    const { path, query } = parseHash();
    const route = ROUTES.find((r) => r.re.test(path));
    const ctx = {
      query,
      params: route ? path.match(route.re).slice(1) : [],
      alive: () => id === renderId, // false once the visitor has moved on
      onLeave: (fn) => cleanups.push(fn),
    };

    const firstRender = lastPath === null;
    if (path !== lastPath && !firstRender) window.scrollTo(0, 0);
    lastPath = path;

    document.body.dataset.page = route ? route.page : 'missing';
    document.querySelectorAll('[data-nav]').forEach((a) => {
      if (route && a.dataset.nav === route.nav) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    closeMenu();
    updateHeader();

    if (!route) {
      H.title('Not found');
      view.innerHTML = `
        <section class="page wrap">
          ${UI.pageHead('Lost in space', 'There\'s no page at this address.', 21)}
          <a class="btn" href="#/">Go to the home page</a>
        </section>`;
      return;
    }

    try {
      const pending = Pages[route.page](view, ctx);
      if (!firstRender) view.focus({ preventScroll: true });
      await pending;
    } catch (err) {
      if (!ctx.alive()) return;
      console.error(err);
      view.innerHTML = `<section class="page wrap">${H.errorBlock(err)}</section>`;
    }
  }

  window.addEventListener('hashchange', render);

  // the skip link would otherwise change the hash and confuse the router
  document.querySelector('.skip-link').addEventListener('click', (e) => {
    e.preventDefault();
    view.focus();
  });

  /* ---------- header ---------- */

  const menuBtn = document.querySelector('.menu-btn');

  function closeMenu() {
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', open);
    document.body.classList.toggle('menu-open', open);
  });

  function updateHeader() {
    document.body.classList.toggle('at-top', window.scrollY < 40);
  }
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* ---------- tabs (any [role=tab] on any page) ---------- */

  function selectTab(tab) {
    tab.parentElement.querySelectorAll('[role="tab"]').forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel && !panel.dataset.opened) {
      panel.dataset.opened = '1';
      panel.dispatchEvent(new CustomEvent('tabopen'));
    }
  }

  document.addEventListener('click', (e) => {
    const tab = e.target.closest('[role="tab"]');
    if (tab) selectTab(tab);
    if (e.target.closest('[data-retry]')) render();
  });

  document.addEventListener('keydown', (e) => {
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
    let i = tabs.indexOf(tab);
    if (e.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'ArrowRight') i = (i + 1) % tabs.length;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = tabs.length - 1;
    e.preventDefault();
    tabs[i].focus();
    selectTab(tabs[i]);
  });

  /* ---------- covers: swap in a drawn card when there's no art ---------- */

  document.addEventListener('error', (e) => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.hasAttribute('data-cover')) return;
    const title = img.getAttribute('data-cover');
    const seed = H.hash(title);
    const card = document.createElement('div');
    card.className = `cover cover-missing tone-${(seed % 5) + 1}`;
    card.setAttribute('role', 'img');
    card.setAttribute('aria-label', `No cover art yet for ${title}`);
    card.innerHTML = `${H.star(seed % 997, 'cm-star')}<span>${H.esc(title)}</span>`;
    img.replaceWith(card);
  }, true);

  /* ---------- song search ---------- */

  const dialog = document.getElementById('search');
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('.search-results');
  const HINT = '<p class="search-msg">Search TXT songs, including Japanese releases and remixes.</p>';
  results.innerHTML = HINT;

  function openSearch() {
    dialog.showModal();
    input.focus();
    input.select();
  }

  document.querySelector('.search-btn').addEventListener('click', openSearch);
  dialog.querySelector('.search-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close(); // a click on the backdrop
    if (e.target.closest('a')) dialog.close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || dialog.open || e.target.closest('input, textarea, select')) return;
    e.preventDefault();
    openSearch();
  });

  function searchResultsHTML(recordings, text) {
    const rows = [];
    const seen = new Set();
    for (const r of recordings) {
      const rel = (r.releases || [])
        .filter((x) => x['release-group'])
        .sort((a, b) => (a.status === 'Official' ? 0 : 1) - (b.status === 'Official' ? 0 : 1) || (a.date || '9999').localeCompare(b.date || '9999'))[0];
      if (!rel) continue;
      const rg = rel['release-group'];
      const key = `${r.title}|${r.disambiguation || ''}|${rg.id}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const year = H.parseDate(rel.date)?.y;
      rows.push(`
        <li><a href="#/music/${rg.id}">
          <span class="sr-title">${H.esc(r.title)}${r.disambiguation ? ` <small>(${H.esc(r.disambiguation)})</small>` : ''}</span>
          <span class="sr-meta">on ${H.esc(rg.title || rel.title)}${year ? `, ${year}` : ''}</span>
          <span class="sr-len">${H.duration(r.length)}</span>
        </a></li>`);
      if (rows.length >= 12) break;
    }
    if (!rows.length) {
      return `<p class="search-msg">No TXT songs match “${H.esc(text)}”. Check the spelling, or try one or two words from the title.</p>`;
    }
    return `<ul class="search-list">${rows.join('')}</ul>`;
  }

  let typing;
  let searchId = 0;
  input.addEventListener('input', () => {
    clearTimeout(typing);
    const text = input.value.trim();
    if (text.length < 2) {
      results.innerHTML = HINT;
      return;
    }
    results.innerHTML = H.loading('Searching');
    typing = setTimeout(async () => {
      const id = ++searchId;
      try {
        const data = await API.searchSongs(text);
        if (id === searchId) results.innerHTML = searchResultsHTML(data.recordings || [], text);
      } catch (err) {
        if (id === searchId) results.innerHTML = `<p class="search-msg">${H.esc(H.errorText(err))}</p>`;
      }
    }, 450);
  });

  render();
})();
