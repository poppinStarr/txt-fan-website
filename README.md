# TXT, together

A fan-made guide to TOMORROW X TOGETHER: the members, every release, and their live shows.
Everything on the site is read live from the [MusicBrainz API](https://musicbrainz.org/doc/MusicBrainz_API).
Plain HTML, CSS and JavaScript, no build step and no API key.

## Running it

- **Quickest:** double-click `index.html`. It works straight from the folder.
- **Local server:** `npx serve .` or the VS Code Live Server extension.
- **GitHub Pages:** push the folder to a repo, then Settings → Pages → deploy from the `main` branch, root folder.

Routing uses the URL hash (`#/music`, `#/members/<id>`), so every page works on GitHub Pages without extra config.

## Pages

| Page | What it shows |
| --- | --- |
| Home | A dusk sky with the members drawn as a constellation (each star links to that member), the debut day count (D+), the newest release and the next show |
| About | Debut date, origin, label, other spellings of the name, tags, official links, and a short Wikipedia summary |
| Members | One tile per member with their Korean name, birthday and birthplace |
| Member | Profile facts, star sign, a birthday countdown, solo releases, links, and a "pick as my bias" toggle saved in the browser |
| Music | The full discography, filterable by type, searchable by title, grouped by year |
| Release | Cover, tracklist, songwriting and production credits per song, every edition, release details and streaming links |
| Events | Upcoming and past concerts, festivals and award shows as ticket stubs, with a shows-per-year chart |
| Event | Venue (with a map link), performers, tour, and the setlist when one has been entered |

The search button (or the `/` key) searches every TXT song on MusicBrainz.

## Where the data comes from

| Need | Request |
| --- | --- |
| Group, members, links, label, events | `GET /ws/2/artist/9d027d72-…?inc=aliases+tags+genres+url-rels+artist-rels+label-rels+event-rels` |
| One member | `GET /ws/2/artist/<id>?inc=aliases+tags+url-rels+artist-rels` |
| Discography | `GET /ws/2/release-group?artist=<id>&inc=artist-credits&limit=100&offset=…` (paged) |
| One release | `GET /ws/2/release-group/<id>?inc=tags+genres+artist-credits+url-rels` |
| Its editions | `GET /ws/2/release?release-group=<id>&inc=labels+media&limit=100` |
| A tracklist | `GET /ws/2/release/<id>?inc=recordings+labels+artist-credits+url-rels` |
| Song credits | `GET /ws/2/recording/<id>?inc=artist-rels+work-rels+work-level-rels+url-rels` |
| One event | `GET /ws/2/event/<id>?inc=artist-rels+place-rels+area-rels+series-rels` |
| Song search | `GET /ws/2/recording?query=recording:(…) AND arid:<TXT id>` |
| Cover art | `https://coverartarchive.org/release-group/<id>/front-250` |
| Summaries | MusicBrainz → Wikidata (`wbgetentities`) → Wikipedia (`/api/rest_v1/page/summary/…`) |

All responses come back as JSON with `fmt=json`, and MusicBrainz allows requests straight from the browser (CORS), so there's no server.

### Being polite to the API

MusicBrainz asks for roughly one request per second. `js/api.js` handles that:

- every request waits in a queue with a 1.1 second gap
- a `503` (busy) is retried up to three times with a pause
- answers are cached in `localStorage` for 12 hours, so revisiting a page costs nothing
- song credits and solo releases only load when someone opens them

## Files

```
index.html          page shell, nav, footer, search dialog
css/style.css       all styles
js/helpers.js       dates, star signs, link labels, hand-drawn SVG stars and arrows
js/api.js           every network request, the rate-limit queue and the cache
js/data.js          turns raw MusicBrainz JSON into what the pages need
js/ui.js            markup shared between pages (release cards, event tickets)
js/pages/*.js       one file per section
js/app.js           hash router, tabs, cover fallbacks, song search
assets/favicon.svg
```

## Credits

- Data: [MusicBrainz](https://musicbrainz.org) (CC0)
- Cover art: [Cover Art Archive](https://coverartarchive.org)
- Summaries: [Wikipedia](https://www.wikipedia.org) (CC BY-SA), linked on each page where used
- Fonts: [Nanum Pen Script](https://fonts.google.com/specimen/Nanum+Pen+Script) and [Pretendard](https://github.com/orioncactus/pretendard), both under the SIL Open Font License

A fan project, not affiliated with BIGHIT MUSIC or HYBE.
