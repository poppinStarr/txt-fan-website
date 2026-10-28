/*
  api.js
  Every request to the outside world goes through here.

  MusicBrainz (https://musicbrainz.org/doc/MusicBrainz_API) is free and
  needs no key, but it asks apps to stay around one request per second.
  So requests wait in a small queue, a 503 gets retried with a pause,
  and answers are cached in localStorage for 12 hours. After the first
  visit, moving between pages is instant and costs no requests at all.
*/
(function () {
  const MB = 'https://musicbrainz.org/ws/2';
  const TXT = '9d027d72-790e-40ec-bbb7-61aa613457de';

  const CACHE_PREFIX = 'txt-cache:';
  const CACHE_HOURS = 12;
  const GAP_MS = 1100;

  const inFlight = new Map();
  let queue = Promise.resolve();
  let lastRequest = 0;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // each call waits for the one before it, then for the 1.1s gap
  function waitTurn() {
    const turn = queue.then(async () => {
      const wait = lastRequest + GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastRequest = Date.now();
    });
    queue = turn.catch(() => {});
    return turn;
  }

  function readCache(url) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + url);
      if (!raw) return null;
      const { t, data } = JSON.parse(raw);
      return Date.now() - t < CACHE_HOURS * 3600 * 1000 ? data : null;
    } catch {
      return null;
    }
  }

  function writeCache(url, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + url, JSON.stringify({ t: Date.now(), data }));
    } catch {
      // storage is full (or blocked): drop our old entries and carry on
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith(CACHE_PREFIX))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* nothing else to do */ }
    }
  }

  class ApiError extends Error {
    constructor(status, url) {
      super(`Request failed (${status}) ${url}`);
      this.status = status;
      this.url = url;
    }
  }

  async function getJSON(url, { cache = true, throttle = true } = {}) {
    if (inFlight.has(url)) return inFlight.get(url);
    const stored = cache ? readCache(url) : null;
    if (stored) return stored;

    const request = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (throttle) await waitTurn();
        let res;
        try {
          res = await fetch(url);
        } catch {
          if (attempt === 3) throw new ApiError(0, url);
          await sleep(1000);
          continue;
        }
        if (res.status === 503 || res.status === 429) {
          await sleep(1500 * attempt);
          continue;
        }
        if (!res.ok) throw new ApiError(res.status, url);
        const data = await res.json();
        if (cache) writeCache(url, data);
        return data;
      }
      throw new ApiError(503, url);
    })();

    inFlight.set(url, request);
    request.finally(() => inFlight.delete(url)).catch(() => {});
    return request;
  }

  function mbUrl(path, params = {}) {
    const url = new URL(`${MB}/${path}`);
    Object.entries({ ...params, fmt: 'json' }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
    return url.toString();
  }

  const mb = (path, params, opts) => getJSON(mbUrl(path, params), opts);

  // browse endpoints return 100 items at most, so keep paging until we have them all
  async function browseAll(entity, params, listKey) {
    const all = [];
    let offset = 0;
    let total = Infinity;
    while (offset < total) {
      const page = await mb(entity, { ...params, limit: 100, offset });
      const list = page[listKey] || [];
      total = page[`${entity}-count`] ?? list.length;
      all.push(...list);
      if (!list.length) break;
      offset += list.length;
    }
    return all;
  }

  // Lucene treats these as syntax; escape them so song titles with ":" or "!" still search
  const luceneEscape = (text) => text.replace(/([+\-!(){}[\]^"~*?:\\/]|&&|\|\|)/g, '\\$1');

  const API = {
    TXT_ID: TXT,

    // one lookup gives the group, its members, links, label and live events
    artist: () =>
      mb(`artist/${TXT}`, { inc: 'aliases+tags+genres+url-rels+artist-rels+label-rels+event-rels' }),

    member: (id) => mb(`artist/${id}`, { inc: 'aliases+tags+url-rels+artist-rels' }),

    releaseGroups: (artistId = TXT) =>
      browseAll('release-group', { artist: artistId, inc: 'artist-credits' }, 'release-groups'),

    releaseGroup: (id) => mb(`release-group/${id}`, { inc: 'tags+genres+artist-credits+url-rels' }),

    // every edition of an album (versions, Japanese pressings, digital…)
    releasesOf: (rgId) => browseAll('release', { 'release-group': rgId, inc: 'labels+media' }, 'releases'),

    release: (id) => mb(`release/${id}`, { inc: 'recordings+labels+artist-credits+url-rels' }),

    // work-level-rels pulls in the songwriters and lyric links attached to the song itself
    recording: (id) => mb(`recording/${id}`, { inc: 'artist-rels+work-rels+work-level-rels+url-rels' }),

    event: (id) => mb(`event/${id}`, { inc: 'artist-rels+place-rels+area-rels+series-rels' }),

    searchSongs: (text) =>
      mb('recording', { query: `recording:(${luceneEscape(text)}) AND arid:${TXT}`, limit: 25 }, { cache: false }),

    /*
      Short bios come from Wikipedia. MusicBrainz links each artist to
      Wikidata, Wikidata knows the English Wikipedia title, and Wikipedia's
      summary endpoint returns a clean paragraph. Three hops, all CORS-friendly.
    */
    async wikiSummary(relations = []) {
      const urls = relations.filter((r) => r.url).map((r) => r.url.resource);
      let title = null;

      const enwiki = urls.find((u) => /^https?:\/\/en\.wikipedia\.org\/wiki\//.test(u));
      if (enwiki) title = decodeURIComponent(enwiki.split('/wiki/')[1]);

      if (!title) {
        const wikidata = urls.find((u) => /wikidata\.org\/wiki\/Q\d+/.test(u));
        if (!wikidata) return null;
        const qid = wikidata.match(/Q\d+/)[0];
        const data = await getJSON(
          `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=sitelinks&sitefilter=enwiki&format=json&origin=*`,
          { throttle: false }
        );
        title = data?.entities?.[qid]?.sitelinks?.enwiki?.title;
        if (!title) return null;
      }

      const summary = await getJSON(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        { throttle: false }
      );
      if (!summary || summary.type === 'disambiguation' || !summary.extract) return null;
      return {
        text: summary.extract,
        url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    },
  };

  window.API = API;
})();
