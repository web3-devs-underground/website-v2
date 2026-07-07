# Web3 Devs Underground — Website

Marketing site for **Web3 Devs Underground** (Israel's largest hub for Web3 developers) — a homepage plus a Careers page. Powered by [MasterKey VC](https://www.masterkey.vc/).

Static **HTML / CSS / vanilla JavaScript** — no build step, no framework, no dependencies. Just host the folder.

---

## Pages

| Page | File | URL |
|---|---|---|
| Home | `index.html` | `/` |
| Careers | `careers.html` | `/careers` |
| 404 | `404.html` | served on any missing path |

`vercel.json` enables clean URLs, so `careers.html` is served at `/careers` automatically.

---

## Deploy (Vercel, via this repo)

This repo is meant to be connected to Vercel for automatic deploys:

1. In Vercel, **Add New… → Project → Import** this GitHub repository.
2. Framework preset: **Other** (it's static — leave the build command empty; output directory is the repo root).
3. Deploy. After that, **every push to `main` auto-deploys**; pull requests get preview URLs.
4. To use the real domain, add `web3devs.org` under **Project → Settings → Domains** and follow the DNS steps.

---

## Editing content

- **Links** (Telegram, Luma, socials, forms, email): edit the `href`s in `index.html` / `careers.html`.
- **Careers** — the "Join the Talent Pool" button and job cards link to the Fillout form (`https://masterkey.fillout.com/talent-pool`). Job cards are static `.job-card` blocks in `careers.html`; the search box filters them automatically.
- **Sponsor button** — `index.html`, currently points to `https://web3devs.org/become-sponsor`.
- **Previous Events timeline** — photos live in `events/` (optimized WebP) and are listed in `events.js`. One line per photo: `{ src, date, event, w, h }`. Rules: max 10 photos per event, and each photo's `date` must match the month it should appear under.
- **Meet Us events** — pulled live from the Luma calendar (`luma.js`); a fallback list lives in that file.
- **Team** — markup in `index.html`; photos in `team/` (use the `.webp` files).
- **Speaker logos** — files in `speakers/` + the `SPEAKERS` array in `site.js`.

See `HANDOFF.md` for the full technical notes (performance, SEO, cross-browser).

---

## Structure

```
index.html        Homepage
careers.html      Careers page
404.html          Not-found page
flow.js           Animated WebGL background
site.js           Speaker sphere + Previous Events timeline
events.js         Timeline photo manifest → events/
luma.js           Live "Meet Us" events from Luma
events/           Event photos (WebP)
team/             Team photos (WebP)
speakers/         Company logos
social/           Social tile icons
vercel.json       Clean-URL config
robots.txt, sitemap.xml, llms.txt   SEO / AI-crawler files
```
