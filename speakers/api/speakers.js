// Vercel serverless function — logos for the "Our Speakers" sphere.
// Source of truth: the "Website: Speakers & Partners" database in Notion
// (in the Web3 Devs Control Hub page). Edit rows there; the site updates
// automatically within ~15 minutes. No deploy needed.
//
// One-time setup:
//   1. Create an internal integration at https://www.notion.so/profile/integrations
//      and copy its secret token.
//   2. In Notion, open the database page -> ... menu -> Connections -> add the integration.
//   3. In Vercel -> Project -> Settings -> Environment Variables, add:
//        NOTION_API_KEY = the integration secret  (NEVER commit it to this repo)
//      (SPEAKERS_DB_ID is optional; the default below is the live database.)
//
// Rows with "Show" unchecked are skipped; rows are sorted by "Order".
// Edge-cached 15 min — kept short because logos uploaded directly into Notion
// use expiring URLs; externally-hosted logos (the originals) never expire.
module.exports = async (req, res) => {
  const KEY = process.env.NOTION_API_KEY || '';
  const DB = process.env.SPEAKERS_DB_ID || 'c79dae16-e597-4521-a2ee-273cc99e3822';
  if (!KEY) {
    // No key configured -> empty list; the site falls back to its built-in logos.
    res.status(200).json({ items: [], note: 'NOTION_API_KEY not set' });
    return;
  }
  try {
    const items = [];
    let cursor;
    do {
      const r = await fetch('https://api.notion.com/v1/databases/' + DB + '/query', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + KEY,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_size: 100,
          start_cursor: cursor,
          filter: { property: 'Show', checkbox: { equals: true } },
          sorts: [{ property: 'Order', direction: 'ascending' }],
        }),
      });
      if (!r.ok) throw new Error('notion ' + r.status);
      const data = await r.json();
      for (const page of data.results || []) {
        const p = page.properties || {};
        const name = ((p.Name || {}).title || [])
          .map((t) => t.plain_text).join('').trim();
        const f0 = (((p.Logo || {}).files || [])[0]) || {};
        const url = (f0.external && f0.external.url) || (f0.file && f0.file.url) || '';
        const bg = ((p.Background || {}).rich_text || [])
          .map((t) => t.plain_text).join('').trim() || '#0e0e0e';
        const type = (((p.Type || {}).select) || {}).name || '';
        if (name && url) items.push({ n: name, f: url, bg: bg, t: type });
      }
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=300');
    res.status(200).json({ items });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
