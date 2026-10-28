/*
  Members, and a page for each member.
  The group lookup gives us who is in TXT; each member then gets their
  own lookup for birthday, birthplace and Korean name. Tiles show up
  right away and fill in as those answers arrive.
*/
(function () {
  const Pages = (window.Pages = window.Pages || {});
  const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const rightChevron = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.5 6.5 L15 12 L9.5 17.5"/></svg>';

  function tile(m, all, biasId) {
    return `
      <a class="member-tile ${D.toneFor(all, m.id)}" href="#/members/${m.id}" data-member="${m.id}">
        ${H.star(H.hash(m.id) % 1000, 'mt-star')}
        ${D.photo(m.name) ? `<img class="member-tile-photo" src="${D.photo(m.name)}" alt="" loading="lazy">` : ''}
        ${m.id === biasId ? '<span class="mt-bias">my bias</span>' : ''}
        <span class="mt-text">
          <span class="mt-name">${H.esc(m.name)}</span>
          <span class="mt-meta">${m.begin ? `With TXT since ${H.fmtDate(m.begin)}` : '&nbsp;'}</span>
        </span>
        <span class="mt-go" aria-hidden="true">${rightChevron}</span>
      </a>`;
  }

  function fillTile(el, p) {
    if (!el) return;
    const bits = [];
    if (p.birth) bits.push(`Born ${H.fmtDate(p.birth)}`);
    if (p.birthPlace) bits.push(`in ${p.birthPlace}`);
    if (bits.length) el.querySelector('.mt-meta').textContent = bits.join(' ');
  }

  Pages.members = async function (view, ctx) {
    H.title('Members');
    view.innerHTML = `<section class="page wrap">${H.loading('Finding the members')}</section>`;

    const artist = await API.artist();
    if (!ctx.alive()) return;

    const all = D.members(artist);
    const current = all.filter((m) => !m.ended);
    const former = all.filter((m) => m.ended);
    const biasId = H.bias.get()?.id;
    const count = NUMBER_WORDS[current.length] || current.length;

    view.innerHTML = `
      <section class="page wrap">
        ${UI.pageHead('Meet the Members', '', 6)}
        <p class="annot members-annot">each card opens their page ${H.arrow()}</p>
        <div class="member-grid">${current.map((m) => tile(m, all, biasId)).join('')}</div>
        ${former.length ? `
          <h2 class="script small former-title">Former members</h2>
          <div class="member-grid is-former">${former.map((m) => tile(m, all, biasId)).join('')}</div>` : ''}
      </section>`;

    // the API queue spaces these out, so they arrive about a second apart
    await Promise.all(all.map(async (m) => {
      try {
        const p = D.person(await API.member(m.id));
        if (ctx.alive()) fillTile(view.querySelector(`[data-member="${m.id}"]`), p);
      } catch {
        /* leave the tile as it is; the member page will show the error if they open it */
      }
    }));
  };

  /* ---------- one member ---------- */

  function factRows(p, rel) {
    const age = H.age(p.birth);
    const rows = [
      ['person', 'Full name', p.legal || ''],
      ['cake', 'Birthday', p.birth ? `${H.fmtDate(p.birth, true)}${age !== null ? `, age ${age}` : ''}` : ''],
      ['star', 'Star sign', H.zodiac(p.birth)],
      ['pin', 'Born in', p.birthPlace],
      ['flag', 'Country', p.country],
      ['calendar', 'With TXT since', rel && rel.begin ? `${H.fmtDate(rel.begin, true)}${rel.original ? ', as an original member' : ''}` : ''],
      ['tag', 'Also known as', [...new Set([...(p.name === 'Yeonjun' ? ['최연준'] : p.hangul ? [p.hangul] : []), ...p.otherNames.filter(n => !H.hasHangul(n))])].join(', ')],
    ];
    return rows.filter(([, , value]) => value).map(([icon, label, value]) => `
      <div class="fact">${H.icon(icon)}<dt>${label}</dt><dd>${H.esc(value)}</dd></div>`).join('');
  }

  function birthdayNote(p) {
    const days = H.daysToBirthday(p.birth);
    if (days === null) return '';
    if (days === 0) return `<p class="sticky-note">It's ${H.esc(p.name)}'s birthday today!</p>`;
    const turning = H.age(p.birth) + 1;
    return `<p class="sticky-note">${H.esc(p.name)} turns ${turning} ${H.relDays(days)}<small>${H.fmtDate(p.birth, true).replace(/, \d+$/, '')}</small></p>`;
  }

  function biasButton(p, on) {
    return `${H.star(9, on ? 'filled' : '')}<span>${on ? `${H.esc(p.name)} is your bias` : `Pick ${H.esc(p.name)} as my bias`}</span>`;
  }

  Pages.member = async function (view, ctx) {
    const [id] = ctx.params;
    view.innerHTML = `<section class="page wrap">${H.loading('Looking them up')}</section>`;

    const [artist, raw] = await Promise.all([API.artist(), API.member(id)]);
    if (!ctx.alive()) return;

    const all = D.members(artist);
    const current = all.filter((m) => !m.ended);
    const rel = all.find((m) => m.id === id);
    const p = D.person(raw);
    if (rel) p.name = rel.name;
    const tone = D.toneFor(all, id);
    const isBias = H.bias.get()?.id === id;
    const links = H.linkGroups(raw.relations);
    H.title(p.name);

    const i = current.findIndex((m) => m.id === id);
    const prev = i >= 0 ? current[(i - 1 + current.length) % current.length] : null;
    const next = i >= 0 ? current[(i + 1) % current.length] : null;

    view.innerHTML = `
      <section class="page wrap member-page">
        ${UI.back('#/members', 'Back to members')}
        <div class="member-layout">
          <div class="member-side">
            <div class="portrait ${tone}">
              ${D.photo(p.name) ? `<img class="member-portrait-photo" src="${D.photo(p.name)}" alt="Portrait of ${H.esc(p.name)}">` : `<span class="portrait-hangul">${H.esc(p.name)}</span>`}
            </div>
            ${birthdayNote(p)}
            <button class="btn bias-btn" type="button" aria-pressed="${isBias}">${biasButton(p, isBias)}</button>
            <p class="bias-help">Saved in this browser only. Your pick glows a little pinker on the home page sky.</p>
          </div>

          <div class="member-main">
            <h1 class="script member-name">${H.esc(p.name)}</h1>
            ${H.tabs('member', [
              { key: 'profile', label: 'Profile', html: `<dl class="facts">${factRows(p, rel)}</dl><div class="member-wiki" id="member-wiki"></div>` },
              { key: 'releases', label: 'Solo and features', html: H.loading('Finding their own releases') },
              { key: 'links', label: 'Links', html: links.length ? `<div class="link-groups">${H.linkGroupsHTML(links)}</div>` : '<p class="muted">No links are listed for this member yet.</p>' },
            ])}
          </div>
        </div>

        ${prev && next && current.length > 1 ? `
        <nav class="member-pager" aria-label="Other members">
          <a href="#/members/${prev.id}"><span>Previous</span>${H.esc(prev.name)}</a>
          <a href="#/members/${next.id}"><span>Next</span>${H.esc(next.name)}</a>
        </nav>` : ''}
      </section>`;

    const btn = view.querySelector('.bias-btn');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      if (on) H.bias.set({ id, name: p.name });
      else H.bias.clear();
      btn.setAttribute('aria-pressed', on);
      btn.innerHTML = biasButton(p, on);
    });

    // solo releases load only when someone opens that tab
    const relPanel = view.querySelector('#panel-member-releases');
    relPanel.addEventListener('tabopen', async () => {
      try {
        const groups = (await API.releaseGroups(id)).sort(D.byNewest);
        if (!ctx.alive()) return;
        relPanel.innerHTML = groups.length
          ? `<p class="muted">Releases credited to ${H.esc(p.name)} by name, outside the group's own discography.</p>
             <div class="disc-grid">${groups.map((g) => UI.discCard(g, id)).join('')}</div>`
          : `<p class="muted">No solo releases are listed for ${H.esc(p.name)} on their own yet.</p>`;
      } catch (err) {
        if (ctx.alive()) relPanel.innerHTML = H.errorBlock(err);
      }
    }, { once: true });

    try {
      const wiki = await API.wikiSummary(raw.relations);
      if (!ctx.alive() || !wiki) return;
      view.querySelector('#member-wiki').innerHTML = `
        <p>${H.esc(wiki.text)}</p>
        <p class="source">Summary from <a href="${H.esc(wiki.url)}" target="_blank" rel="noopener">Wikipedia</a>, shared under CC BY-SA.</p>`;
    } catch {
      /* the profile reads fine without it */
    }
  };
})();
