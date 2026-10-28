/*
  Home
  A dusk sky with the current members drawn as a constellation
  (each star links to that member), then a short "what's new"
  built from the newest release and the next or latest show.
*/
(function () {
  const Pages = (window.Pages = window.Pages || {});

  const SKYLINE = `
    <svg class="skyline" viewBox="0 0 1440 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path class="far" d="M0 260 L0 183 L54 183 L54 134 L69 134 L69 120 L72 120 L72 104 L74 104 L74 120 L77 120 L77 134 L92 134 L92 138 L134 138 L134 124 L137 124 L137 108 L139 108 L139 124 L142 124 L142 138 L184 138 L184 149 L210 149 L210 135 L213 135 L213 119 L215 119 L215 135 L218 135 L218 149 L245 149 L245 148 L275 148 L275 134 L278 134 L278 118 L280 118 L280 134 L283 134 L283 148 L314 148 L314 122 L362 122 L362 128 L432 128 L432 149 L454 149 L454 135 L457 135 L457 119 L459 119 L459 135 L462 135 L462 149 L484 149 L484 163 L554 163 L554 155 L573 155 L573 141 L576 141 L576 125 L578 125 L578 141 L581 141 L581 155 L600 155 L600 195 L670 195 L670 156 L733 156 L733 192 L782 192 L782 149 L811 149 L811 135 L814 135 L814 119 L816 119 L816 135 L819 135 L819 149 L848 149 L848 131 L930 131 L930 191 L1017 191 L1017 143 L1052 143 L1052 195 L1080 195 L1080 181 L1083 181 L1083 165 L1085 165 L1085 181 L1088 181 L1088 195 L1117 195 L1117 145 L1161 145 L1161 132 L1250 132 L1250 180 L1265 180 L1265 166 L1268 166 L1268 150 L1270 150 L1270 166 L1273 166 L1273 180 L1289 180 L1289 166 L1310 166 L1310 152 L1313 152 L1313 136 L1315 136 L1315 152 L1318 152 L1318 166 L1339 166 L1339 115 L1430 115 L1430 188 L1440 188 L1440 260 Z"/>
      <g class="windows"><rect x="422" y="146" width="3" height="4"/><rect x="526" y="193" width="3" height="4"/><rect x="626" y="206" width="3" height="4"/><rect x="743" y="202" width="3" height="4"/><rect x="819" y="185" width="3" height="4"/><rect x="830" y="163" width="3" height="4"/><rect x="898" y="179" width="3" height="4"/><rect x="912" y="145" width="3" height="4"/><rect x="975" y="202" width="3" height="4"/><rect x="985" y="202" width="3" height="4"/><rect x="1073" y="206" width="3" height="4"/><rect x="1089" y="205" width="3" height="4"/><rect x="1196" y="151" width="3" height="4"/><rect x="1274" y="192" width="3" height="4"/><rect x="1315" y="180" width="3" height="4"/><rect x="1298" y="190" width="3" height="4"/><rect x="1395" y="138" width="3" height="4"/><rect x="1396" y="132" width="3" height="4"/><rect x="1371" y="181" width="3" height="4"/></g>
      <path class="near" d="M0 260 L0 226 L1440 226 L1440 260 Z M0 192 L1440 192 L1440 196 L0 196 Z M18 194 L21 194 L21 228 L18 228 Z M74 194 L77 194 L77 228 L74 228 Z M130 194 L133 194 L133 228 L130 228 Z M186 194 L189 194 L189 228 L186 228 Z M242 194 L245 194 L245 228 L242 228 Z M298 194 L301 194 L301 228 L298 228 Z M354 194 L357 194 L357 228 L354 228 Z M410 194 L413 194 L413 228 L410 228 Z M466 194 L469 194 L469 228 L466 228 Z M522 194 L525 194 L525 228 L522 228 Z M578 194 L581 194 L581 228 L578 228 Z M634 194 L637 194 L637 228 L634 228 Z M690 194 L693 194 L693 228 L690 228 Z M746 194 L749 194 L749 228 L746 228 Z M802 194 L805 194 L805 228 L802 228 Z M858 194 L861 194 L861 228 L858 228 Z M914 194 L917 194 L917 228 L914 228 Z M970 194 L973 194 L973 228 L970 228 Z M1026 194 L1029 194 L1029 228 L1026 228 Z M1082 194 L1085 194 L1085 228 L1082 228 Z M1138 194 L1141 194 L1141 228 L1138 228 Z M1194 194 L1197 194 L1197 228 L1194 228 Z M1250 194 L1253 194 L1253 228 L1250 228 Z M1306 194 L1309 194 L1309 228 L1306 228 Z M1362 194 L1365 194 L1365 228 L1362 228 Z M1418 194 L1421 194 L1421 228 L1418 228 Z M1188 120 L1254 120 L1254 178 L1188 178 Z M1184 120 L1221 98 L1258 120 Z M1194 178 L1198 178 L1198 226 L1194 226 Z M1218 178 L1222 178 L1222 226 L1218 226 Z M1244 178 L1248 178 L1248 226 L1244 226 Z M248 70 L250.5 70 L250.5 226 L248 226 Z M230 96 L268.5 96 L268.5 98 L230 98 Z M236 120 L262.5 120 L262.5 122 L236 122 Z M226 142 L272.5 142 L272.5 144 L226 144 Z"/>
    </svg>`;

  // a loose W, like Cassiopeia (which also has five bright stars).
  // [x, y, where the name goes] so labels never sit on the lines
  const SPOTS = [[8, 27, 'below'], [28, 41, 'left'], [47, 22, 'above'], [67, 35, 'below'], [89, 12, 'above'],
    [78, 52, 'below'], [18, 10, 'above']];

  function labelAt([x, y, side]) {
    if (side === 'above') return { x, y: y - 4.6, anchor: 'middle' };
    if (side === 'left') return { x: x - 3.2, y: y + 2.6, anchor: 'end' };
    return { x, y: y + 7.4, anchor: 'middle' };
  }

  function constellationSVG(members, biasId) {
    const pts = members.map((m, i) => SPOTS[i] || [10 + ((i * 17) % 80), 20 + ((i * 11) % 30), 'below']);
    const line = pts.slice(0, 5).map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
    const stars = members.map((m, i) => {
      const [x, y] = pts[i];
      const label = labelAt(pts[i]);
      return `
        <a class="c-star${m.id === biasId ? ' is-bias' : ''}" href="#/members/${m.id}" style="--i:${i}">
          <title>${H.esc(m.name)}</title>
          <circle class="halo" cx="${x}" cy="${y}" r="5.5"/>
          <circle class="core" cx="${x}" cy="${y}" r="0.95"/>
          <text x="${label.x}" y="${label.y}" text-anchor="${label.anchor}">${H.esc(m.name)}</text>
        </a>`;
    }).join('');

    return `
      <defs>
        <radialGradient id="star-halo">
          <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
          <stop offset=".22" stop-color="#ece6ff" stop-opacity=".35"/>
          <stop offset="1" stop-color="#ece6ff" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <path class="c-line" d="${line}" pathLength="1"/>
      ${stars}
      <g class="c-hint" aria-hidden="true">
        <text x="35" y="57.5">five stars, one sky.</text>
        <path d="M33.5 56.2 C 29.5 55.6, 28.2 52, 29 46.6"/><path d="M27.3 48.4 L29.1 46.2 L30.6 48.6"/>
      </g>`;
  }

  // the little stars behind everything; they twinkle unless reduced motion is on
  function startTwinkle(canvas) {
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        const towardHorizon = 1 - s.y / h;
        const twinkle = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(s.phase + (t / 1000) * s.speed);
        ctx.globalAlpha = Math.max(0, towardHorizon * twinkle);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const rand = H.rng(42);
      stars = Array.from({ length: Math.round((w * h) / 4800) }, () => ({
        x: rand() * w,
        y: Math.pow(rand(), 1.7) * h,
        r: rand() * 1.05 + 0.25,
        phase: rand() * Math.PI * 2,
        speed: 0.3 + rand() * 1.1,
      }));
      draw(performance.now());
    }

    function loop(t) {
      if (!document.hidden) draw(t);
      raf = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    if (!reduce) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }

  const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

  const withArticle = (rg) => {
    const t = D.typeLabel(rg);
    if (/^EP/.test(t)) return 'an ' + t;
    return (/^[aeiou]/i.test(t) ? 'an ' : 'a ') + t.toLowerCase();
  };

  const quickTile = (href, tone, note, label, seed) => `
    <a class="quick-tile ${tone}" href="${href}">
      ${H.star(seed, 'qt-star')}
      <span class="hand">${note}</span>
      <strong>${label}</strong>
    </a>`;

  function nowHTML(artist, groups, groupsFailed) {
    const today = H.today();
    const debut = artist['life-span']?.begin;
    const day = debut ? H.daysBetween(H.toDate(debut), today) + 1 : null;
    const members = D.members(artist).filter((m) => !m.ended);

    const latest = groups.filter((g) => g['first-release-date']).sort(D.byNewest)[0];

    const cover = latest ? `
      <figure class="polaroid now-cover">
        <img class="tour-poster" src="assets/photos/txt-tour-poster.jpg" alt="TXT STEAL THE WIND world tour poster featuring all five members" loading="lazy">
        <figcaption>TXT world tour poster</figcaption>
      </figure>` : '';

    return `
      <div class="now-grid${latest ? '' : ' no-cover'}">
        ${cover}
        <div class="now-text">
          <h2 class="script">What's new${H.star(11, 'title-star')}</h2>
          ${day ? `
          <p class="dday">
            <span class="dday-num">D+${day.toLocaleString()}</span>
            <span>TXT debuted on ${H.fmtDate(debut, true)}. Counting the way fans do, with debut day as day one, today is day ${day.toLocaleString()}.</span>
          </p>` : ''}
          ${latest ? `<p>The newest release is <a href="#/music/${latest.id}">${H.esc(latest.title)}</a>, ${H.esc(withArticle(latest))} out ${H.fmtDate(latest['first-release-date'], true)}.</p>` : ''}
          <p class="muted">${groupsFailed
            ? 'The discography didn\'t load this time. Refresh in a moment to try again.'
            : `${H.plural(groups.length, 'release')} in the discography.`}</p>
        </div>
      </div>
      <nav class="quick" aria-label="Sections of this site">
        ${quickTile('#/about', 'tone-1', 'who they are', 'About TXT', 3)}
        ${quickTile('#/members', 'tone-3', `all ${NUMBER_WORDS[members.length] || members.length} of them`, 'Members', 5)}
        ${quickTile('#/music', 'tone-2', 'every release', 'Discography', 8)}
      </nav>`;
  }

  Pages.home = async function (view, ctx) {
    H.title('');
    view.innerHTML = `
      <section class="hero">
        <div class="sky" aria-hidden="true">
          <canvas class="sky-stars"></canvas>
          <span class="cloud c1"></span><span class="cloud c2"></span><span class="cloud c3"></span>
          ${SKYLINE}
        </div>
        <svg class="constellation" viewBox="0 0 100 62" role="group" aria-label="The members, drawn as a constellation"></svg>
        <div class="hero-copy wrap">
          <p class="hero-kicker">TOMORROW X TOGETHER</p>
          <h1 class="hero-title"><img src="assets/txt-logo.svg" alt="TOMORROW X TOGETHER" width="480" height="120"></h1>
          <p class="hero-sub">together, tomorrow, and every night in between</p>
        </div>
        <button class="scroll-cue" type="button">scroll
          <svg viewBox="0 0 24 40" aria-hidden="true" focusable="false"><path d="M12 3 C 10.5 14, 13.5 24, 12 35"/><path d="M6.5 28.5 L12 35.5 L17 28"/></svg>
        </button>
      </section>
      <section class="home-photo wrap" aria-label="TXT group photo"><img src="assets/photos/home-txt.jpg" alt="TOMORROW X TOGETHER, all five members together" loading="lazy"></section>
      <section class="now wrap" id="now" aria-label="What's new">${H.loading("Checking what's new")}</section>`;

    ctx.onLeave(startTwinkle(view.querySelector('.sky-stars')));
    view.querySelector('.scroll-cue').addEventListener('click', () =>
      document.getElementById('now').scrollIntoView({ behavior: 'smooth', block: 'start' })
    );

    const artist = await API.artist();
    if (!ctx.alive()) return;

    const sky = view.querySelector('.constellation');
    sky.innerHTML = constellationSVG(D.members(artist).filter((m) => !m.ended), H.bias.get()?.id);
    requestAnimationFrame(() => sky.classList.add('is-drawn'));

    let groups = [];
    let failed = false;
    try {
      groups = await API.releaseGroups();
    } catch {
      failed = true;
    }
    if (!ctx.alive()) return;
    view.querySelector('#now').innerHTML = nowHTML(artist, groups, failed);
  };
})();
