// Vercel serverless function — server-side Luma events for the "Meet Us" section.
// The browser can't call Luma directly (CORS), so the site fetches /api/luma and
// this function fetches Luma server-side and returns { entries: [ { event } ] },
// which luma.js already knows how to render into our custom cards.
//
// Auth: set LUMA_API_KEY in Vercel → Project → Settings → Environment Variables
// (paste your "secret-..." Luma API key there). NEVER commit the key to the repo.
// If the official API is unavailable, it falls back to Luma's public calendar feed
// so the section still updates.
//
// Cached at the edge for 30 min.
module.exports = async (req, res) => {
  const KEY = process.env.LUMA_API_KEY || '';
  const CAL_ID = 'cal-iIQRUXB2ToNqfFJ';
  const since = new Date(Date.now() - 36e5).toISOString();

  async function official() {
    const url =
      'https://public-api.lu.ma/public/v1/calendar/list-events?after=' +
      encodeURIComponent(since);
    const r = await fetch(url, {
      headers: { 'x-luma-api-key': KEY, accept: 'application/json' },
    });
    if (!r.ok) throw new Error('luma official ' + r.status);
    return r.json();
  }
  async function publicFeed() {
    const url =
      'https://api.lu.ma/calendar/get-items?calendar_api_id=' +
      CAL_ID +
      '&period=future&pagination_limit=6';
    const r = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'web3devs-site/1.0' },
    });
    if (!r.ok) throw new Error('luma public ' + r.status);
    return r.json();
  }

  try {
    let data;
    if (KEY) {
      try {
        data = await official();
      } catch (e) {
        data = await publicFeed(); // fall back if the official call fails
      }
    } else {
      data = await publicFeed();
    }
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json(data);
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
};
