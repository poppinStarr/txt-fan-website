/*
  helpers.js
  Small utilities shared by every page: escaping, dates, durations,
  star signs, link labels, and the hand-drawn SVG bits (stars, arrows).
*/
(function () {
  const H = {};

  H.esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  /* ---------- dates ----------
     MusicBrainz dates can be "2019", "2019-03" or "2019-03-04",
     so everything here copes with partial dates. */

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  H.parseDate = (s) => {
    if (!s) return null;
    const [y, m, d] = String(s).split('-').map(Number);
    if (!y) return null;
    return { y, m: m || null, d: d || null };
  };

  H.fmtDate = (s, long = false) => {
    const p = H.parseDate(s);
    if (!p) return 'Date unknown';
    if (!p.m) return String(p.y);
    const name = (long ? MONTH : MON)[p.m - 1];
    return p.d ? `${name} ${p.d}, ${p.y}` : `${name} ${p.y}`;
  };

  H.monthShort = (m) => MON[m - 1] || '';

  H.toDate = (s) => {
    const p = H.parseDate(s);
    return p ? new Date(p.y, (p.m || 1) - 1, p.d || 1) : null;
  };

  H.today = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };

  H.daysBetween = (a, b) => Math.round((b - a) / 86400000);

  H.relDays = (n) => {
    if (n === 0) return 'today';
    if (n === 1) return 'tomorrow';
    if (n === -1) return 'yesterday';
    return n > 0 ? `in ${n.toLocaleString()} days` : `${(-n).toLocaleString()} days ago`;
  };

  H.age = (birth) => {
    const p = H.parseDate(birth);
    if (!p || !p.m || !p.d) return null;
    const t = H.today();
    let age = t.getFullYear() - p.y;
    const beforeBirthday = t.getMonth() + 1 < p.m || (t.getMonth() + 1 === p.m && t.getDate() < p.d);
    if (beforeBirthday) age--;
    return age;
  };

  H.daysToBirthday = (birth) => {
    const p = H.parseDate(birth);
    if (!p || !p.m || !p.d) return null;
    const t = H.today();
    let next = new Date(t.getFullYear(), p.m - 1, p.d);
    if (next < t) next = new Date(t.getFullYear() + 1, p.m - 1, p.d);
    return H.daysBetween(t, next);
  };

  // [month, first day of the next sign, sign before that day]
  const ZODIAC = [
    [1, 20, 'Capricorn'], [2, 19, 'Aquarius'], [3, 21, 'Pisces'], [4, 20, 'Aries'],
    [5, 21, 'Taurus'], [6, 21, 'Gemini'], [7, 23, 'Cancer'], [8, 23, 'Leo'],
    [9, 23, 'Virgo'], [10, 23, 'Libra'], [11, 22, 'Scorpio'], [12, 22, 'Sagittarius'],
  ];
  H.zodiac = (birth) => {
    const p = H.parseDate(birth);
    if (!p || !p.m || !p.d) return null;
    const [, cut, before] = ZODIAC[p.m - 1];
    return p.d < cut ? before : ZODIAC[p.m % 12][2];
  };

  H.duration = (ms) => {
    if (!ms) return '';
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  H.runtime = (ms) => {
    const m = Math.round(ms / 60000);
    return m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr ${m % 60} min`;
  };

  H.plural = (n, one, many = one + 's') => `${Number(n).toLocaleString()} ${n === 1 ? one : many}`;
  H.cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : '');

  // member names are stored in caps on MusicBrainz ("YEONJUN"); soften them for prose
  H.niceName = (name) =>
    name && name === name.toUpperCase() && /[A-Z]/.test(name)
      ? name.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase())
      : name;

  H.hasHangul = (s) => /[ᄀ-ᇿ㄰-㆏가-힯]/.test(s || '');

  /* ---------- links ---------- */

  const SITES = [
    ['music.youtube.com', 'YouTube Music'], ['youtube.com', 'YouTube'], ['youtu.be', 'YouTube'],
    ['twitter.com', 'X'], ['x.com', 'X'], ['instagram.com', 'Instagram'], ['tiktok.com', 'TikTok'],
    ['weverse.io', 'Weverse'], ['facebook.com', 'Facebook'], ['weibo.com', 'Weibo'],
    ['open.spotify.com', 'Spotify'], ['spotify.com', 'Spotify'], ['music.apple.com', 'Apple Music'],
    ['itunes.apple.com', 'iTunes'], ['deezer.com', 'Deezer'], ['tidal.com', 'TIDAL'],
    ['melon.com', 'Melon'], ['genie.co.kr', 'Genie'], ['bugs.co.kr', 'Bugs'],
    ['soundcloud.com', 'SoundCloud'], ['amazon.', 'Amazon'], ['line.me', 'LINE'],
    ['wikidata.org', 'Wikidata'], ['wikipedia.org', 'Wikipedia'], ['discogs.com', 'Discogs'],
    ['allmusic.com', 'AllMusic'], ['genius.com', 'Genius'], ['last.fm', 'Last.fm'],
    ['setlist.fm', 'setlist.fm'], ['songkick.com', 'Songkick'], ['bandsintown.com', 'Bandsintown'],
    ['vlive.tv', 'V LIVE'], ['imdb.com', 'IMDb'], ['vgmdb.net', 'VGMdb'], ['ibighit.com', 'BIGHIT MUSIC'],
  ];

  H.host = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
  };

  H.siteName = (url) => {
    const host = H.host(url);
    const hit = SITES.find(([d]) => host === d || host.endsWith('.' + d) || (d.endsWith('.') && host.includes(d)));
    return hit ? hit[1] : host;
  };

  H.handle = (url) => {
    try {
      const u = new URL(url);
      const first = u.pathname.split('/').filter(Boolean)[0] || '';
      if (/youtube\.com$/.test(u.hostname)) return first.startsWith('@') ? first : '';
      if (/twitter|x\.com|instagram|tiktok/.test(u.hostname) && first) return first.startsWith('@') ? first : '@' + first;
      return '';
    } catch { return ''; }
  };

  const GROUP_OF = {
    'official homepage': 'Official',
    'social network': 'Social', youtube: 'Social', 'video channel': 'Social', blog: 'Social',
    streaming: 'Listen', 'free streaming': 'Listen', 'purchase for download': 'Listen', 'download for free': 'Listen',
    wikidata: 'Look it up', wikipedia: 'Look it up', discogs: 'Look it up', allmusic: 'Look it up',
    'other databases': 'Look it up', lyrics: 'Look it up', songkick: 'Look it up', setlistfm: 'Look it up',
    'last.fm': 'Look it up', bandsintown: 'Look it up', vgmdb: 'Look it up',
  };

  H.linkGroups = (relations = []) => {
    const groups = {};
    const seen = new Set();
    for (const r of relations) {
      if (r['target-type'] !== 'url' || !r.url || r.ended) continue;
      const group = GROUP_OF[r.type];
      const href = r.url.resource;
      if (!group || seen.has(href)) continue;
      seen.add(href);
      const official = r.type === 'official homepage';
      groups[group] = groups[group] || [];
      groups[group].push({
        href,
        name: official ? 'Official site' : H.siteName(href),
        extra: official ? H.host(href) : H.handle(href),
      });
    }
    return ['Official', 'Social', 'Listen', 'Look it up']
      .filter((g) => groups[g])
      .map((g) => ({ title: g, links: groups[g] }));
  };

  H.linkGroupsHTML = (groups) =>
    groups.map((g) => `
      <div class="link-group">
        <h3>${g.title}</h3>
        <ul>${g.links.map((l) => `
          <li><a href="${H.esc(l.href)}" target="_blank" rel="noopener">${H.esc(l.name)}${l.extra ? ` <span>${H.esc(l.extra)}</span>` : ''}</a></li>`).join('')}
        </ul>
      </div>`).join('');

  /* ---------- covers ---------- */

  H.coverRG = (id, size = 250) => `https://coverartarchive.org/release-group/${id}/front-${size}`;
  H.coverRelease = (id, size = 500) => `https://coverartarchive.org/release/${id}/front-${size}`;

  // if the Cover Art Archive has nothing, app.js swaps the <img> for a drawn placeholder
  H.cover = (src, title, eager = false) =>
    `<img class="cover" src="${src}" alt="Cover of ${H.esc(title)}" ${eager ? '' : 'loading="lazy"'} decoding="async" data-cover="${H.esc(title)}">`;

  /* ---------- hand-drawn svg ---------- */

  // tiny seeded random so the same star always gets drawn the same way
  H.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  H.hash = (str) => {
    let h = 2166136261;
    for (const ch of String(str)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // A five-point star drawn like a pen would: slightly uneven points,
  // gently bowed lines, and a little overshoot where the line closes.
  H.starPath = (seed = 1) => {
    const r = H.rng(seed);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const radius = (i % 2 ? 19 : 46) * (1 + (r() - 0.5) * 0.16);
      const a = -Math.PI / 2 + (i * Math.PI) / 5 + (r() - 0.5) * 0.09;
      pts.push([50 + Math.cos(a) * radius, 54 + Math.sin(a) * radius]);
    }
    const f = (n) => n.toFixed(1);
    let d = `M${f(pts[0][0] - 1.2)} ${f(pts[0][1] + 2.4)}`;
    let prev = pts[0];
    const bend = (to) => {
      const mx = (prev[0] + to[0]) / 2 + (r() - 0.5) * 3.2;
      const my = (prev[1] + to[1]) / 2 + (r() - 0.5) * 3.2;
      d += ` Q${f(mx)} ${f(my)} ${f(to[0])} ${f(to[1])}`;
      prev = to;
    };
    [...pts.slice(1), pts[0]].forEach(bend);
    bend([pts[0][0] + (pts[1][0] - pts[0][0]) * 0.3, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.3]);
    return d;
  };

  H.star = (seed = 1, cls = '') =>
    `<svg class="sketch-star ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="${H.starPath(seed)}"/></svg>`;

  H.sparkle = (cls = '') =>
    `<svg class="sparkle ${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50 6 Q54 45 94 50 Q54 55 50 94 Q46 55 6 50 Q46 45 50 6Z"/></svg>`;

  H.arrow = (cls = '') =>
    `<svg class="sketch-arrow ${cls}" viewBox="0 0 120 60" aria-hidden="true" focusable="false"><path d="M6 10 C 28 46, 70 56, 108 32"/><path d="M93 25 L109 31 L100 46"/></svg>`;

  H.chevron = () =>
    `<svg class="chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 9.5 L12 14.5 L17 9.2"/></svg>`;

  // little line icons for fact lists
  const ICONS = {
    person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.6-3.8 3.4-6 7-6s6.4 2.2 7 6"/>',
    cake: '<path d="M4.5 20h15v-6.5c0-1-1-2-2-2h-11c-1 0-2 1-2 2V20Z"/><path d="M4.5 16c2 1.3 3.6 1.3 5 0 1.6 1.3 3.2 1.3 5 0 1.6 1.3 3.2 1.3 5 0"/><path d="M12 11.5V8"/><path d="M12 5.2c.8.9.8 1.8 0 2.4-.8-.6-.8-1.5 0-2.4Z"/>',
    star: '<path d="M12 3.8l2.3 5 5.4.5-4.1 3.6 1.2 5.3L12 15.5l-4.8 2.7 1.2-5.3-4.1-3.6 5.4-.5Z"/>',
    pin: '<path d="M12 21s-6-6.1-6-11a6 6 0 0 1 12 0c0 4.9-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4.5c3.5-1.6 6 1.4 9.5 0 1-.4 2-.6 3-.5v8.5c-1 0-2 .2-3 .6-3.5 1.4-6-1.6-9.5 0"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    disc: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.5-3.2 2.7-5 5.5-5s5 1.8 5.5 5"/><circle cx="16.5" cy="9" r="2.4"/><path d="M15.5 14.2c2.6-.2 4.6 1.4 5 4.3"/>',
    building: '<path d="M5 20.5V5.5l8-2v17M13 8.5l6 2v10M3.5 20.5h17"/><path d="M8 8.5h2M8 12h2M8 15.5h2M15.5 13h1.5M15.5 16.5h1.5"/>',
    tag: '<path d="M3.8 12.6V4.5h8.1l8.3 8.3-8.1 8.1Z"/><circle cx="8.3" cy="8.9" r="1.4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  };
  H.icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;

  /* ---------- states ---------- */

  H.loading = (text = 'Asking MusicBrainz') =>
    `<div class="loading" role="status">${H.sparkle()}${H.sparkle()}${H.sparkle()}<span>${H.esc(text)}…</span></div>`;

  H.errorText = (err) => {
    if (!navigator.onLine) return 'You seem to be offline. Reconnect, then try again.';
    if (err && err.status === 404) return 'MusicBrainz has no entry with this ID. The link may be out of date.';
    if (err && (err.status === 503 || err.status === 429))
      return 'MusicBrainz is busy (it allows about one request per second). Wait a few seconds, then try again.';
    return 'The request to MusicBrainz failed. Check your connection, then try again.';
  };

  H.errorBlock = (err) => `
    <div class="error-note" role="alert">
      <p class="hand">This part didn't load.</p>
      <p>${H.esc(H.errorText(err))}</p>
      <button class="btn" type="button" data-retry>Try again</button>
    </div>`;

  /* ---------- tabs ----------
     Markup only; app.js handles clicks and arrow keys for every tab set. */

  H.tabs = (id, tabs) => `
    <div class="tabs" role="tablist" aria-label="${H.esc(id)}">
      ${tabs.map((t, i) => `<button class="pill" role="tab" type="button" id="tab-${id}-${t.key}"
          aria-controls="panel-${id}-${t.key}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${H.esc(t.label)}</button>`).join('')}
    </div>
    ${tabs.map((t, i) => `<div class="tab-panel" role="tabpanel" id="panel-${id}-${t.key}"
        aria-labelledby="tab-${id}-${t.key}" ${i === 0 ? '' : 'hidden'}>${t.html || ''}</div>`).join('')}`;

  /* ---------- bias (the member you like most) ---------- */

  H.bias = {
    get() { try { return JSON.parse(localStorage.getItem('txt-bias')); } catch { return null; } },
    set(member) { try { localStorage.setItem('txt-bias', JSON.stringify(member)); } catch { /* private mode */ } },
    clear() { try { localStorage.removeItem('txt-bias'); } catch { /* private mode */ } },
  };

  H.title = (text) => { document.title = text ? `${text} | TXT, together` : 'TXT, together'; };

  window.H = H;
})();
