/*
  Discography, and a page for each release.

  Discography: every release group credited to TXT, filterable by type,
  searchable by title, grouped by year.

  Release page: MusicBrainz splits an album into a "release group"
  (the album as an idea) and "releases" (each physical or digital
  edition). We show the group, pick a sensible default edition for the
  tracklist, and let people switch to any other edition.
*/
(function () {
  const Pages = (window.Pages = window.Pages || {});

  const TYPES = [
    ['all', 'All'],
    ['album', 'Albums'],
    ['ep', 'EPs'],
    ['single', 'Singles'],
    ['other', 'Other'],
  ];

  const magnifier = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15.2l4.6 4.6"/></svg>';

  Pages.music = async function (view, ctx) {
    H.title('Discography');
    const state = {
      type: TYPES.some(([k]) => k === ctx.query.get('type')) ? ctx.query.get('type') : 'all',
      q: ctx.query.get('q') || '',
      sort: ctx.query.get('sort') === 'old' ? 'old' : 'new',
    };

    view.innerHTML = `
      <section class="page wrap">
        <div class="head-row">
          ${UI.pageHead('Discography', 'Every album, EP and single on MusicBrainz for TXT, Korean and Japanese releases alike.', 8)}
          <p class="annot disc-annot">tap a cover for the tracklist ${H.arrow()}</p>
        </div>
        <div class="music-controls"></div>
        <div class="disc-list">${H.loading('Gathering the discography')}</div>
      </section>`;

    const groups = (await API.releaseGroups()).map((g) => ({ ...g, cat: D.category(g) }));
    if (!ctx.alive()) return;

    const counts = { all: groups.length };
    groups.forEach((g) => { counts[g.cat] = (counts[g.cat] || 0) + 1; });

    const controls = view.querySelector('.music-controls');
    const list = view.querySelector('.disc-list');

    controls.innerHTML = `
      <div class="pills" role="group" aria-label="Release type">
        ${TYPES.filter(([k]) => k === 'all' || counts[k]).map(([k, label]) => `
          <button class="pill" type="button" data-type="${k}" aria-pressed="${state.type === k}">${label}<span class="count">${counts[k] || 0}</span></button>`).join('')}
      </div>
      <div class="music-tools">
        <label class="field search-field">${magnifier}<span class="visually-hidden">Filter by title</span>
          <input type="search" placeholder="Filter by title" value="${H.esc(state.q)}" autocomplete="off">
        </label>
        <label class="field select-field"><span class="visually-hidden">Sort order</span>
          <select>
            <option value="new"${state.sort === 'new' ? ' selected' : ''}>Newest first</option>
            <option value="old"${state.sort === 'old' ? ' selected' : ''}>Oldest first</option>
          </select>
        </label>
      </div>`;

    function syncUrl() {
      const qs = new URLSearchParams();
      if (state.type !== 'all') qs.set('type', state.type);
      if (state.q) qs.set('q', state.q);
      if (state.sort !== 'new') qs.set('sort', state.sort);
      const hash = `#/music${qs.toString() ? '?' + qs : ''}`;
      if (location.hash !== hash) history.replaceState(null, '', hash);
    }

    function draw() {
      const needle = state.q.trim().toLowerCase();
      const shown = groups
        .filter((g) => state.type === 'all' || g.cat === state.type)
        .filter((g) => !needle || `${g.title} ${D.withArtists(g['artist-credit']).join(' ')}`.toLowerCase().includes(needle))
        .sort((a, b) => {
          const x = a['first-release-date'] || '';
          const y = b['first-release-date'] || '';
          if (!x || !y) return x ? -1 : y ? 1 : 0; // undated always last
          return state.sort === 'new' ? y.localeCompare(x) : x.localeCompare(y);
        });

      if (!shown.length) {
        list.innerHTML = `
          <div class="empty">
            <p class="hand">Nothing here.</p>
            <p>No ${state.type === 'all' ? 'releases' : TYPES.find(([k]) => k === state.type)[1].toLowerCase()} match “${H.esc(state.q)}”. Try fewer words, or clear the filter.</p>
            <button class="btn" type="button" data-clear>Clear filter</button>
          </div>`;
        return;
      }

      const years = [];
      for (const g of shown) {
        const year = H.parseDate(g['first-release-date'])?.y || 'Undated';
        if (!years.length || years.at(-1).year !== year) years.push({ year, items: [] });
        years.at(-1).items.push(g);
      }
      list.innerHTML = years.map(({ year, items }) => `
        <section class="year-group" aria-label="${year}">
          <h2 class="year">${year}</h2>
          <div class="disc-grid">${items.map((g) => UI.discCard(g)).join('')}</div>
        </section>`).join('');
    }

    controls.addEventListener('click', (e) => {
      const pill = e.target.closest('[data-type]');
      if (!pill) return;
      state.type = pill.dataset.type;
      controls.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', b === pill));
      syncUrl();
      draw();
    });

    let typing;
    const input = controls.querySelector('input');
    input.addEventListener('input', () => {
      clearTimeout(typing);
      typing = setTimeout(() => { state.q = input.value; syncUrl(); draw(); }, 150);
    });

    controls.querySelector('select').addEventListener('change', (e) => {
      state.sort = e.target.value;
      syncUrl();
      draw();
    });

    list.addEventListener('click', (e) => {
      if (!e.target.closest('[data-clear]')) return;
      state.q = '';
      input.value = '';
      syncUrl();
      draw();
    });

    draw();
  };

  /* ---------- one release ---------- */

  // average the colourful pixels of the cover to tint the page, like an era colour
  function eraColour(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const size = 24;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = size;
          const g = canvas.getContext('2d');
          g.drawImage(img, 0, 0, size, size);
          const px = g.getImageData(0, 0, size, size).data;
          let r = 0, gr = 0, b = 0, total = 0;
          for (let i = 0; i < px.length; i += 4) {
            const max = Math.max(px[i], px[i + 1], px[i + 2]);
            const min = Math.min(px[i], px[i + 1], px[i + 2]);
            const weight = max - min + 6; // greys count, but colour counts more
            r += px[i] * weight;
            gr += px[i + 1] * weight;
            b += px[i + 2] * weight;
            total += weight;
          }
          resolve(`rgb(${Math.round(r / total)} ${Math.round(gr / total)} ${Math.round(b / total)})`);
        } catch {
          resolve(null); // the image host didn't allow reading pixels; keep the default glow
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  const LANGS = { kor: 'Korean', jpn: 'Japanese', eng: 'English', mul: 'Multiple languages', zxx: 'No lyrics' };

  function trackRow(t) {
    const rec = t.recording || {};
    const others = D.withArtists(t['artist-credit'] || rec['artist-credit']);
    return `
      <li class="track">
        <button class="track-btn" type="button" aria-expanded="false" data-recording="${rec.id}">
          <span class="track-num">${H.esc(t.number || t.position)}</span>
          <span class="track-title">${H.esc(t.title || rec.title)}${others.length ? ` <small>with ${H.esc(others.join(', '))}</small>` : ''}${rec.disambiguation ? ` <small>(${H.esc(rec.disambiguation)})</small>` : ''}</span>
          <span class="track-len">${H.duration(t.length || rec.length)}</span>
          ${H.chevron()}
        </button>
        <div class="track-panel" hidden></div>
      </li>`;
  }

  function tracklistHTML(rel) {
    const media = rel.media || [];
    const tracks = media.flatMap((m) => m.tracks || []);
    const total = tracks.reduce((sum, t) => sum + (t.length || t.recording?.length || 0), 0);
    const where = [H.fmtDate(rel.date, true), UI.countryName(rel.country)].filter((x) => x && x !== 'Date unknown').join(', ');
    return `
      <div class="tracks-top">
        <p class="muted">Showing the edition released ${H.esc(where || 'on an unknown date')}${rel.disambiguation ? ` (${H.esc(rel.disambiguation)})` : ''}.</p>
        <p class="annot tracks-annot">tap a song to see who made it ${H.arrow()}</p>
      </div>
      ${media.map((m) => `
        ${media.length > 1 ? `<h3 class="medium-head">Disc ${m.position}${m.format ? ` (${H.esc(m.format)})` : ''}${m.title ? `: ${H.esc(m.title)}` : ''}</h3>` : ''}
        <ol class="tracks">${(m.tracks || []).map(trackRow).join('')}</ol>`).join('')}
      ${tracks.length ? `<p class="tracks-total">${H.plural(tracks.length, 'track')}${total ? `, ${H.runtime(total)}` : ''}</p>` : '<p class="muted">No tracklist has been entered for this edition yet.</p>'}`;
  }

  function creditsHTML(rec) {
    const { rows, lyricsUrl } = D.credits(rec);
    return `
      ${rows.length
        ? `<dl class="credits">${rows.map(([role, names]) => `<dt>${role}</dt><dd>${H.esc(names.join(', '))}</dd>`).join('')}</dl>`
        : '<p class="muted">No songwriting or production credits are logged for this recording yet.</p>'}
      <p class="track-links">
        ${lyricsUrl ? `<a href="${H.esc(lyricsUrl)}" target="_blank" rel="noopener">Lyrics on ${H.esc(H.siteName(lyricsUrl))}</a>` : ''}
        <a href="https://musicbrainz.org/recording/${rec.id}" target="_blank" rel="noopener">This recording on MusicBrainz</a>
      </p>`;
  }

  function editionsHTML(releases, currentId) {
    return `
      <p class="muted">${H.plural(releases.length, 'edition')} on MusicBrainz. Versions can differ in tracks, so pick one to see its tracklist.</p>
      <ul class="editions">
        ${releases.map((r) => {
          const on = r.id === currentId;
          const meta = [H.fmtDate(r.date), UI.countryName(r.country), D.formats(r), D.labelLine(r), r.status !== 'Official' ? r.status : '']
            .filter((x) => x && x !== 'Date unknown');
          return `
            <li class="edition${on ? ' is-current' : ''}">
              <div>
                <strong>${H.esc(r.title)}</strong>${r.disambiguation ? ` <span class="muted">(${H.esc(r.disambiguation)})</span>` : ''}
                <span class="edition-meta">${H.esc(meta.join(', '))}</span>
              </div>
              <button class="pill" type="button" data-release="${r.id}" aria-pressed="${on}">${on ? 'Showing' : 'Show tracklist'}</button>
            </li>`;
        }).join('')}
      </ul>`;
  }

  function detailsHTML(rel, rgId) {
    const text = rel['text-representation'] || {};
    const rows = [
      ['Edition shown', rel.disambiguation ? `${rel.title} (${rel.disambiguation})` : rel.title],
      ['Released', H.fmtDate(rel.date, true)],
      ['Country', UI.countryName(rel.country)],
      ['Label', D.labelLine(rel)],
      ['Catalog number', D.catalog(rel)],
      ['Barcode', rel.barcode],
      ['Format', D.formats(rel)],
      ['Packaging', rel.packaging],
      ['Status', rel.status],
      ['Language', LANGS[text.language] || text.language],
    ].filter(([, v]) => v && v !== 'Date unknown');
    return `
      <dl class="details">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${H.esc(v)}</dd></div>`).join('')}</dl>
      <p class="track-links">
        <a href="https://musicbrainz.org/release/${rel.id}" target="_blank" rel="noopener">This edition on MusicBrainz</a>
        <a href="https://musicbrainz.org/release-group/${rgId}" target="_blank" rel="noopener">All editions on MusicBrainz</a>
      </p>`;
  }

  function listenLinks(rel) {
    const seen = new Set();
    const links = (rel.relations || [])
      .filter((r) => r.url && ['streaming', 'free streaming', 'purchase for download'].includes(r.type))
      .map((r) => ({ href: r.url.resource, name: H.siteName(r.url.resource) }))
      .filter((l) => !seen.has(l.name) && seen.add(l.name))
      .sort((a, b) => (a.name === 'Spotify' ? -1 : b.name === 'Spotify' ? 1 : 0))
      .slice(0, 3);
    return links.map((l, i) => `
      <a class="btn${i === 0 ? ' btn-solid' : ''}" href="${H.esc(l.href)}" target="_blank" rel="noopener">${i === 0 ? 'Listen on ' : ''}${H.esc(l.name)}</a>`).join('');
  }

  Pages.album = async function (view, ctx) {
    const [id] = ctx.params;
    view.innerHTML = `<section class="page wrap">${H.loading('Opening the release')}</section>`;

    const rg = await API.releaseGroup(id);
    if (!ctx.alive()) return;
    H.title(rg.title);

    const tags = D.topTags(rg, 6);
    view.innerHTML = `
      <section class="page wrap album">
        ${UI.back('#/music', 'Back to discography')}
        <div class="album-head">
          <figure class="polaroid album-cover">${H.cover(H.coverRG(id, 500), rg.title, true)}</figure>
          <div class="album-info">
            <p class="album-type">${H.esc(D.typeLabel(rg))}</p>
            <h1 class="album-title">${H.esc(rg.title)}</h1>
            <p class="album-credit">${H.esc(D.creditLine(rg['artist-credit']))}</p>
            <ul class="album-facts">
              <li>${H.icon('calendar')}Released ${H.fmtDate(rg['first-release-date'], true)}</li>
              <li class="fact-label" hidden>${H.icon('building')}<span></span></li>
              <li class="fact-tracks" hidden>${H.icon('disc')}<span></span></li>
            </ul>
            <div class="album-actions"></div>
            ${tags.length ? `<ul class="tag-list small">${tags.map((t, i) => `<li class="tag t${i % 3}">${H.esc(t)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
        <div class="album-about" hidden></div>
        <div class="album-body">
          ${H.tabs('album', [
            { key: 'tracks', label: 'Tracklist', html: H.loading('Loading the tracklist') },
            { key: 'editions', label: 'Editions', html: H.loading('Listing editions') },
            { key: 'details', label: 'Details', html: H.loading('Loading details') },
          ])}
        </div>
      </section>`;

    const page = view.querySelector('.album');
    const tracksPanel = view.querySelector('#panel-album-tracks');
    const editionsPanel = view.querySelector('#panel-album-editions');
    const detailsPanel = view.querySelector('#panel-album-details');

    eraColour(H.coverRG(id, 250)).then((c) => c && page.style.setProperty('--era', c));

    API.wikiSummary(rg.relations).then((wiki) => {
      if (!wiki || !ctx.alive()) return;
      const box = view.querySelector('.album-about');
      box.innerHTML = `<p>${H.esc(wiki.text)}</p>
        <p class="source">Summary from <a href="${H.esc(wiki.url)}" target="_blank" rel="noopener">Wikipedia</a>, shared under CC BY-SA.</p>`;
      box.hidden = false;
    }).catch(() => {});

    const releases = D.sortEditions(await API.releasesOf(id));
    if (!ctx.alive()) return;

    if (!releases.length) {
      const none = '<p class="muted">MusicBrainz has no editions of this release yet, so there is no tracklist to show.</p>';
      tracksPanel.innerHTML = editionsPanel.innerHTML = detailsPanel.innerHTML = none;
      return;
    }

    let currentId = releases[0].id;
    editionsPanel.innerHTML = editionsHTML(releases, currentId);

    async function show(releaseId) {
      currentId = releaseId;
      editionsPanel.innerHTML = editionsHTML(releases, currentId);
      tracksPanel.innerHTML = H.loading('Loading the tracklist');
      let rel;
      try {
        rel = await API.release(releaseId);
      } catch (err) {
        if (ctx.alive()) tracksPanel.innerHTML = H.errorBlock(err);
        return;
      }
      if (!ctx.alive() || currentId !== releaseId) return;

      tracksPanel.innerHTML = tracklistHTML(rel);
      detailsPanel.innerHTML = detailsHTML(rel, id);
      view.querySelector('.album-actions').innerHTML = listenLinks(rel);

      const label = D.labelLine(rel);
      const labelFact = view.querySelector('.fact-label');
      labelFact.hidden = !label;
      labelFact.querySelector('span').textContent = label;

      const tracks = (rel.media || []).flatMap((m) => m.tracks || []);
      const total = tracks.reduce((s, t) => s + (t.length || t.recording?.length || 0), 0);
      const trackFact = view.querySelector('.fact-tracks');
      trackFact.hidden = !tracks.length;
      trackFact.querySelector('span').textContent = `${H.plural(tracks.length, 'track')}${total ? `, ${H.runtime(total)}` : ''}`;
    }

    editionsPanel.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-release]');
      if (!btn || btn.dataset.release === currentId) return;
      show(btn.dataset.release);
      view.querySelector('#tab-album-tracks').click();
    });

    // open a song to load its credits (one request per song, then cached)
    tracksPanel.addEventListener('click', async (e) => {
      const btn = e.target.closest('.track-btn');
      if (!btn) return;
      const panel = btn.nextElementSibling;
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open);
      panel.hidden = !open;
      if (!open || panel.dataset.loaded) return;
      panel.innerHTML = H.loading('Finding the credits');
      try {
        const rec = await API.recording(btn.dataset.recording);
        panel.innerHTML = creditsHTML(rec);
        panel.dataset.loaded = '1';
      } catch (err) {
        panel.innerHTML = `<p class="muted">${H.esc(H.errorText(err))}</p>`;
      }
    });

    await show(currentId);
  };
})();
