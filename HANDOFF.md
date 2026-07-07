# Web3 Devs Underground — Website Handoff

A single‑page marketing site for **Web3 Devs Underground** (web3devs.org) plus a **Careers** page.
Static HTML / CSS / vanilla JavaScript — **no build step, no framework, no dependencies to install**.
Just host the folder.

---

## 1. Quick start

**Preview locally:** double‑click `index.html` (opens in your browser). Everything works from the file system except the pretty `/careers` URL and the Luma live feed (those need a real server — see below).

**Deploy:** drag the whole folder into **Netlify**, **Vercel**, or **Cloudflare Pages** (or any static host / S3). No configuration required for a basic deploy.

**One single file:** `web3devs-underground-full.html` is the entire homepage inlined into one portable file (images/scripts embedded). Handy for emailing/previewing the homepage without the asset folders. Not used for the real deployment.

---

## 2. Pages

| Page | File | URL |
|---|---|---|
| Home | `index.html` | `/` |
| Careers | `careers.html` | `/careers` (or `/careers.html`) |
| 404 / Not found | `404.html` | served on any missing path |

---

## 3. File inventory

### Deploy these (the live site)
| File / folder | Purpose |
|---|---|
| `index.html` | Homepage — all markup + CSS (inline `<style>`). |
| `careers.html` | Careers page — self‑contained markup + CSS. |
| `404.html` | Branded not‑found page. |
| `flow.js` | WebGL animated background (red flow + “WEB3DEVS” halftone, scroll/mouse reactive). |
| `site.js` | Two interactive components: the 3D **speaker sphere** and the draggable **Previous Events** timeline. |
| `events.js` | Photo manifest for the timeline (`window.W3D_EVENTS`). |
| `luma.js` | “Meet Us” block — pulls upcoming events live from the Luma calendar, with a built‑in fallback list. |
| `favicon.svg` | Site icon. |
| `logo-united.svg` | The “WEB3DEVS UNDERGROUND + Powered by MasterKey” lockup (used in nav, footer, 404, OG image). |
| `masterkey-logo.avif` | MasterKey logo in the sponsors block. |
| `og-image.png` | 1200×630 social/link‑share preview image (Space Grotesk). |
| `team/` | Team photos — **use the `.webp` files** (optimized). |
| `speakers/` | 30+ company logos shown on the speaker sphere. |
| `social/` | X / YouTube / Telegram / LinkedIn tile images (community block). |
| `robots.txt` | Crawl rules — open to all, incl. AI crawlers. |
| `sitemap.xml` | URL list for search engines. |
| `llms.txt` | Plain‑text brief for AI/LLMs. |
| `_redirects` | Netlify rule: serve `careers.html` at `/careers`. |
| `vercel.json` | Vercel clean‑URL config. |

### Source / not required at runtime (safe to keep or delete)
| File | Note |
|---|---|
| `team/*.png` | Original full‑size photos. **Superseded by the `.webp` versions** — can be deleted to save space. |
| `community-banner.svg`, `join-mobile.svg`, `_bg.svg` | Design reference / source SVGs used during build. |
| `smooth-scroll.js` | Disabled (kept as a stub). Not referenced. |
| `team.md` | Notes. |
| `web3devs-underground-full.html` | Portable one‑file homepage (preview only). |
| `HANDOFF.md` | This document. |

---

## 4. Tech & design tokens

- Plain HTML/CSS/JS. Fonts loaded from Google Fonts: **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (mono/labels).
- Colors (CSS variables in each file’s `:root`): background `#0e0e0e`, ink `#f4f2ef`, muted `#908f8e`, brand red `#FF1516`, yellow `#f8db4c`.
- Responsive breakpoint: **mobile layout at ≤768px**.

---

## 5. How to update content

**Links (Telegram, Luma, socials, forms, email)** — edit the `href`s directly in `index.html` / `careers.html` (search for the URL). Key ones:
- Join / Telegram: `https://t.me/+-sEflgfrqDoyYWVk`
- Events / Luma: `https://luma.com/web3devs_underground`
- Apply to Speak (Google Form), YouTube, X, LinkedIn company, `info@web3devs.org`.

**Meet Us events** — pulled live from Luma automatically. The fallback list (shown if the feed is unavailable) lives in `luma.js` → `SNAPSHOT`. Limit is 3 nearest upcoming events.

**Team members** — markup is in `index.html` under `Founders` / `Managers`. To change a photo: drop a new square image in `team/`, resize to ~480px, save as `.webp`, and update the `src`.

**Speaker logos** — add/remove files in `speakers/` and edit the `SPEAKERS` array in `site.js` (each entry: name, file, background color).

**Careers jobs** — static cards in `careers.html` under `Open Positions`. Edit/add the `.job-card` blocks; the search box filters them automatically.

**Hero / headlines / copy** — plain text in the markup; edit in place.

---

## 6. Performance (already optimized)

- Team photos converted to right‑sized **WebP** (~2.5MB → ~160KB) and **lazy‑loaded**.
- Scripts `defer`‑loaded; heavy animation loops **pause when off‑screen / tab hidden**.
- Sticky‑nav blur removed to keep scrolling smooth.
- Portable single file reduced from ~4.4MB → ~1.1MB.

If scrolling ever feels heavy on low‑end devices, the next lever is rendering the WebGL background at lower resolution / 30fps (ask your developer; it’s a small change in `flow.js`).

---

## 7. SEO & AI visibility (already set up)

- Per‑page `<title>`, meta description, canonical, theme‑color.
- **Open Graph + Twitter Card** tags + `og-image.png` → rich link previews when shared.
- **schema.org JSON‑LD** (Organization + WebSite / WebPage) with founders, location, and social profiles.
- `sitemap.xml`, `robots.txt` (welcomes ChatGPT/Perplexity/Claude/Google‑AI crawlers), and `llms.txt`.

---

## 8. Cross‑browser

Tested/hardened for current Chrome, Edge, Firefox, Safari. Graceful fallbacks for older Safari; the WebGL background silently no‑ops where WebGL2 isn’t available (the site keeps its dark background).

---

## 9. ⚠️ Before you go live — checklist

1. **Replace the domain.** The placeholder `https://web3devs.org/` appears in: meta `og:`/`twitter:`/`canonical` tags (both HTML pages), `sitemap.xml`, `robots.txt`, `llms.txt`, and the JSON‑LD. Set all to your real domain.
2. **Serve over HTTPS** (default on Netlify/Vercel/Cloudflare).
3. **`/careers` pretty URL:** works automatically on Vercel/Cloudflare; on Netlify via `_redirects`. On **GitHub Pages** it won’t — ask your dev to move careers into a `careers/index.html` folder instead.
4. **Confirm the Luma calendar id** in `luma.js` is current, and that all CTA links (Telegram invite, Google Form, socials) are live.
5. **Submit** `sitemap.xml` in Google Search Console + Bing Webmaster Tools.
6. Optional: add analytics (e.g. Plausible / GA) before the closing `</body>`.

---

*Static site — no servers, databases, or build pipeline. Everything needed is in this folder.*
