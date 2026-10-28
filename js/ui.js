/*
  ui.js
  Pieces of markup used on more than one page.
*/
(function () {
  const UI = {};

  // one release in a grid: cover, title, type and date
  UI.discCard = (rg, selfId) => {
    const others = D.withArtists(rg['artist-credit'], selfId);
    return `
      <a class="disc" href="#/music/${rg.id}">
        <span class="disc-cover">${H.cover(H.coverRG(rg.id, 250), rg.title)}</span>
        <span class="disc-title">${H.esc(rg.title)}</span>
        <span class="disc-meta">${H.esc(D.typeLabel(rg))}, ${H.fmtDate(rg['first-release-date'])}</span>
        ${others.length ? `<span class="disc-with">with ${H.esc(others.join(', '))}</span>` : ''}
      </a>`;
  };

  // one event, drawn as a ticket stub
  UI.ticket = (e) => {
    const p = H.parseDate(e.begin);
    const start = H.toDate(e.begin);
    const days = start ? H.daysBetween(H.today(), start) : null;
    const upcoming = days !== null && days >= 0;
    const until = e.end && e.end !== e.begin ? `, until ${H.fmtDate(e.end)}` : '';
    const roles = e.roles.map(D.roleLabel).join(' and ').toLowerCase();
    return `
      <a class="ticket${upcoming ? ' is-upcoming' : ''}${e.cancelled ? ' is-cancelled' : ''}" href="#/events/${e.id}">
        <span class="stub" aria-hidden="true">
          <span class="stub-month">${p && p.m ? H.monthShort(p.m) : 'Date'}</span>
          <span class="stub-day">${p && p.d ? p.d : '?'}</span>
          <span class="stub-year">${p ? p.y : 'unknown'}</span>
        </span>
        <span class="ticket-body">
          <span class="ticket-name">${H.esc(e.name)}</span>
          <span class="ticket-meta">
            <span class="visually-hidden">${H.fmtDate(e.begin, true)}. </span>${H.esc(e.type)}, ${H.esc(roles)}${e.time ? `, ${H.esc(e.time)}` : ''}${until}
          </span>
          ${e.cancelled ? '<span class="badge">Cancelled</span>' : upcoming ? `<span class="ticket-when">${H.relDays(days)}</span>` : ''}
        </span>
      </a>`;
  };

  UI.back = (href, text) =>
    `<a class="back" href="${href}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M14.5 6.5 L9 12 L14.5 17.5"/></svg>${H.esc(text)}</a>`;

  UI.pageHead = (title, lede, seed = 2) => `
    <header class="page-head">
      <h1 class="script">${H.esc(title)}${H.star(seed, 'title-star')}</h1>
      ${lede ? `<p class="lede">${lede}</p>` : ''}
    </header>`;

  UI.countryName = (code) =>
    ({
      KR: 'South Korea', JP: 'Japan', XW: 'Worldwide', XE: 'Europe', US: 'United States', CN: 'China',
      TW: 'Taiwan', HK: 'Hong Kong', GB: 'United Kingdom', TH: 'Thailand', ID: 'Indonesia', PH: 'Philippines',
    }[code] || code || '');

  window.UI = UI;
})();
