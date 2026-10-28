/*
  About
  The facts MusicBrainz keeps about the group (debut, origin, label,
  other spellings, links) plus a short Wikipedia summary when one exists.
*/
(function () {
  const Pages = (window.Pages = window.Pages || {});

  const LOCALES = { ko: 'Korean', ja: 'Japanese', zh: 'Chinese', en: 'English', th: 'Thai', ru: 'Russian', es: 'Spanish' };

  function fallbackText(artist, members) {
    const names = members.map((m) => m.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0] || '';
    const where = artist['begin-area']?.name || artist.area?.name || 'South Korea';
    return `<p>TXT is a ${H.esc((artist.type || 'group').toLowerCase())} from ${H.esc(where)} that debuted on
      ${H.fmtDate(artist['life-span']?.begin, true)}.${list ? ` The members are ${H.esc(list)}.` : ''}</p>`;
  }

  Pages.about = async function (view, ctx) {
    H.title('About');
    view.innerHTML = `<section class="page wrap">${H.loading('Looking them up')}</section>`;

    const artist = await API.artist();
    if (!ctx.alive()) return;

    const members = D.members(artist);
    const current = members.filter((m) => !m.ended);
    const debut = artist['life-span']?.begin;
    const label = D.label(artist);
    const origin = artist['begin-area']?.name || '';
    const country = artist.area?.name || '';
    const aliases = (artist.aliases || [])
      .filter((a, i, arr) => a.name !== artist.name && arr.findIndex((b) => b.name === a.name) === i)
      .slice(0, 8);
    const links = H.linkGroups(artist.relations);

    view.innerHTML = `
      <section class="page wrap about">
        <div class="about-intro">
          <div>
            <h1 class="script">About TXT${H.star(2, 'title-star')}</h1>
            <div class="about-text" id="about-text">${H.loading('Fetching a short summary')}</div>
          </div>
          <figure class="polaroid about-polaroid" aria-label="TXT group portrait">
            <img src="assets/photos/about-txt.jpg" alt="" loading="lazy">
          </figure>
        </div>

        <dl class="stats">
          <div class="stat">${H.icon('calendar')}<dt>Debut</dt><dd>${H.fmtDate(debut, true)}</dd></div>
          <div class="stat">${H.icon('people')}<dt>Members</dt><dd>${current.length}</dd></div>
          <div class="stat">${H.icon('pin')}<dt>From</dt><dd>${H.esc([origin, country].filter(Boolean).join(', ') || 'Unknown')}</dd></div>
          <div class="stat">${H.icon('building')}<dt>Label</dt><dd>${H.esc(label || 'Not listed')}</dd></div>
        </dl>

        <div class="about-more">
          ${aliases.length ? `
          <section>
            <h2 class="script small">Also written as</h2>
            <ul class="alias-list">${aliases.map((a) => `
              <li><span lang="${H.esc(a.locale || '')}">${H.esc(a.name)}</span>${a.locale && LOCALES[a.locale] ? `<small>${LOCALES[a.locale]}</small>` : ''}</li>`).join('')}
            </ul>
          </section>` : ''}
          ${links.length ? `
          <section class="about-links">
            <h2 class="script small">Find them online</h2>
            <div class="link-groups">${H.linkGroupsHTML(links)}</div>
          </section>` : ''}
        </div>

      </section>`;

    const box = view.querySelector('#about-text');
    try {
      const wiki = await API.wikiSummary(artist.relations);
      if (!ctx.alive()) return;
      box.innerHTML = wiki
        ? `<p>${H.esc(wiki.text)}</p>
           <p class="source">Read more on <a href="${H.esc(wiki.url)}" target="_blank" rel="noopener">Wikipedia</a>.</p>`
        : fallbackText(artist, current);
    } catch {
      if (ctx.alive()) box.innerHTML = fallbackText(artist, current);
    }
  };
})();
