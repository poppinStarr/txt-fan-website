/*
  data.js
  Turns raw MusicBrainz JSON into the shapes the pages actually need.
  Keeping this separate from the page code makes the pages easier to read
  and means each rule (what counts as an EP, which edition to show…) lives
  in exactly one place.
*/
(function () {
  const D = {};
  const TXT = () => API.TXT_ID;

  D.displayName = (name) => {
    const original = String(name || '').trim();
    // Live MusicBrainz records sometimes return the Korean primary name.
    // Normalize those names before photo lookup, titles, cards and constellation labels.
    const koreanNames = {
      '최연준': 'Yeonjun', '연준': 'Yeonjun',
      '최수빈': 'Soobin', '수빈': 'Soobin',
      '최범규': 'Beomgyu', '범규': 'Beomgyu',
      '강태현': 'Taehyun', '태현': 'Taehyun',
      '휴닝카이': 'Kai', '카이': 'Kai', 'Kai Kamal Huening': 'Kai'
    };
    if (koreanNames[original]) return koreanNames[original];
    const n = original.toLowerCase().replace(/[^a-z]/g, '');
    if (n.includes('yeonjun')) return 'Yeonjun';
    if (n.includes('soobin')) return 'Soobin';
    if (n.includes('taehyun')) return 'Taehyun';
    if (n.includes('huening') || n === 'kai') return 'Kai';
    if (n.includes('beomgyu')) return 'Beomgyu';
    return H.niceName(name);
  };
  D.photo = (name) => {
    const n = D.displayName(name).toLowerCase();
    return ['yeonjun','soobin','taehyun','kai','beomgyu'].includes(n) ? `assets/photos/${n}.jpg` : '';
  };

  /* ---------- members ---------- */

  D.members = (artist) => {
    const byId = new Map();
    for (const r of artist.relations || []) {
      if (r.type !== 'member of band' || r.direction !== 'backward' || !r.artist) continue;
      const prev = byId.get(r.artist.id);
      const m = {
        id: r.artist.id,
        name: D.displayName(r.artist.name || r['target-credit']),
        sortName: r.artist['sort-name'],
        begin: r.begin,
        end: r.end,
        ended: !!r.ended,
        original: (r.attributes || []).includes('original'),
      };
      if (!prev) { byId.set(m.id, m); continue; }
      // a member can have several relationships (different periods):
      // keep the earliest start, and only call them former if every period has ended
      if (m.begin && (!prev.begin || m.begin < prev.begin)) { prev.begin = m.begin; prev.original = m.original || prev.original; }
      prev.ended = prev.ended && m.ended;
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  };

  // the five tile colours; each member keeps the same one everywhere on the site
  D.toneFor = (members, id) => {
    const i = members.findIndex((m) => m.id === id);
    return `tone-${(i < 0 ? 0 : i) % 5 + 1}`;
  };

  D.person = (artist) => {
    const aliases = artist.aliases || [];
    const korean =
      aliases.find((a) => a.locale === 'ko' && a.primary && !/legal/i.test(a.type || '')) ||
      aliases.find((a) => a.locale === 'ko' && !/legal/i.test(a.type || '')) ||
      aliases.find((a) => H.hasHangul(a.name) && !/legal/i.test(a.type || ''));
    const legal = aliases.filter((a) => /legal/i.test(a.type || ''));
    const legalLatin = legal.find((a) => !H.hasHangul(a.name));
    const legalHangul = legal.find((a) => H.hasHangul(a.name));
    return {
      id: artist.id,
      name: D.displayName([artist.name, ...aliases.map(a => a.name)].map(D.displayName).find(n => ['Yeonjun','Soobin','Taehyun','Kai','Beomgyu'].includes(n)) || artist.name),
      hangul: korean ? korean.name : (H.hasHangul(artist.name) ? artist.name : ''),
      legal: legalLatin ? legalLatin.name : '',
      legalHangul: legalHangul ? legalHangul.name : '',
      birth: artist['life-span']?.begin || '',
      birthPlace: artist['begin-area']?.name || '',
      country: artist.area?.name || '',
      otherNames: aliases
        .filter((a) => !/legal/i.test(a.type || '') && a.name !== (korean && korean.name))
        .map((a) => a.name)
        .filter((n, i, arr) => n.toLowerCase() !== artist.name.toLowerCase() && arr.indexOf(n) === i)
        .slice(0, 6),
    };
  };

  D.label = (artist) => {
    const rels = (artist.relations || []).filter((r) => r['target-type'] === 'label' && r.label);
    const current = rels.find((r) => !r.ended) || rels[0];
    return current ? current.label.name : '';
  };

  D.topTags = (entity, n = 6) => {
    const list = (entity.genres && entity.genres.length ? entity.genres : entity.tags) || [];
    return [...list].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, n).map((t) => t.name);
  };

  /* ---------- releases ---------- */

  const OTHER_SECONDARY = ['Compilation', 'Live', 'Remix', 'Soundtrack', 'DJ-mix', 'Mixtape/Street', 'Demo', 'Interview'];

  D.category = (rg) => {
    const secondary = rg['secondary-types'] || [];
    if (secondary.some((s) => OTHER_SECONDARY.includes(s))) return 'other';
    const primary = (rg['primary-type'] || '').toLowerCase();
    return ['album', 'ep', 'single'].includes(primary) ? primary : 'other';
  };

  D.typeLabel = (rg) => {
    const primary = rg['primary-type'] || 'Release';
    const secondary = (rg['secondary-types'] || []).map((s) => s.toLowerCase());
    return secondary.length ? `${primary} (${secondary.join(', ')})` : primary;
  };

  // names of anyone credited alongside TXT, e.g. a collaboration single
  D.withArtists = (credit = [], selfId = TXT()) =>
    credit.filter((c) => c.artist && c.artist.id !== selfId).map((c) => c.name || c.artist.name);

  D.creditLine = (credit = []) => credit.map((c) => (c.name || c.artist?.name || '') + (c.joinphrase || '')).join('');

  D.byNewest = (a, b) => (b['first-release-date'] || '').localeCompare(a['first-release-date'] || '');

  /*
    Albums often have a dozen editions. Show the first official one
    by default, preferring Korean or worldwide releases.
  */
  D.sortEditions = (releases) => {
    const score = (r) =>
      (r.status === 'Official' ? 0 : 20) + (['KR', 'XW'].includes(r.country) ? 0 : r.country === 'JP' ? 2 : 4);
    return [...releases].sort((a, b) => {
      const s = score(a) - score(b);
      if (s) return s;
      return (a.date || '9999').localeCompare(b.date || '9999');
    });
  };

  D.formats = (release) => {
    const media = release.media || [];
    const names = [...new Set(media.map((m) => m.format).filter(Boolean))];
    return names.join(' + ');
  };

  D.trackCount = (release) => (release.media || []).reduce((n, m) => n + (m['track-count'] || (m.tracks || []).length || 0), 0);

  D.labelLine = (release) =>
    [...new Set((release['label-info'] || []).map((li) => li.label?.name).filter(Boolean))].join(', ');

  D.catalog = (release) =>
    [...new Set((release['label-info'] || []).map((li) => li['catalog-number']).filter(Boolean))].join(', ');

  // the songwriting and production credits for one recording
  D.credits = (rec) => {
    const roles = {
      'Written by': new Set(), 'Lyrics by': new Set(), 'Music by': new Set(),
      'Produced by': new Set(), 'Arranged by': new Set(),
    };
    let lyricsUrl = null;
    const add = (role, artist) => artist && roles[role].add(artist.name);

    for (const r of rec.relations || []) {
      if (r['target-type'] === 'artist') {
        if (r.type === 'producer') add('Produced by', r.artist);
        if (r.type === 'arranger' || r.type === 'instrument arranger') add('Arranged by', r.artist);
      }
      if (r['target-type'] === 'work' && r.work) {
        for (const w of r.work.relations || []) {
          if (w.type === 'writer') add('Written by', w.artist);
          if (w.type === 'lyricist') add('Lyrics by', w.artist);
          if (w.type === 'composer') add('Music by', w.artist);
          if (w.type === 'arranger') add('Arranged by', w.artist);
          if (w.type === 'lyrics' && w.url && !lyricsUrl) lyricsUrl = w.url.resource;
        }
      }
    }
    const rows = Object.entries(roles).filter(([, set]) => set.size).map(([role, set]) => [role, [...set]]);
    return { rows, lyricsUrl };
  };

  /* ---------- events ---------- */

  const ROLE = {
    'main performer': 'Headlining',
    'guest performer': 'Guest performance',
    'support act': 'Supporting act',
    host: 'Hosting',
  };
  D.roleLabel = (type) => ROLE[type] || H.cap(type || '');

  D.events = (artist) => {
    const byId = new Map();
    for (const r of artist.relations || []) {
      if (r['target-type'] !== 'event' || !r.event) continue;
      const e = r.event;
      const existing = byId.get(e.id);
      if (existing) { existing.roles.push(r.type); continue; }
      byId.set(e.id, {
        id: e.id,
        name: e.name,
        type: e.type || 'Event',
        begin: e['life-span']?.begin || '',
        end: e['life-span']?.end || '',
        time: e.time || '',
        cancelled: !!e.cancelled,
        roles: [r.type],
      });
    }
    return [...byId.values()];
  };

  // MusicBrainz setlists use "* song", "@ artist" and "# comment" lines,
  // with links written as [mbid|Name]
  D.setlist = (text) => {
    if (!text) return [];
    const clean = (s) => s.replace(/\[(?:[0-9a-f-]{36}\|)?([^\]]+)\]/g, '$1').trim();
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const mark = line[0];
      const body = clean(line.slice(1));
      if (mark === '*') return { kind: 'song', text: body };
      if (mark === '@') return { kind: 'artist', text: body };
      if (mark === '#') return { kind: 'note', text: body };
      return { kind: 'song', text: clean(line) };
    });
  };

  window.D = D;
})();
