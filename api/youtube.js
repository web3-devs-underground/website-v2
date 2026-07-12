// Vercel serverless function — latest videos for the "Watch" section.
// Source: the "Online Events Series" playlist on the Web3 Devs Underground
// channel (NOT the whole channel), read via YouTube's public RSS feed.
// The browser can't read YouTube RSS directly (CORS), so the site fetches
// /api/youtube; this returns the newest playlist videos as JSON, which
// index.html renders into the Watch cards. Cached 1h.
//
// To change what's shown: set YT_PLAYLIST_ID in Vercel env vars (a PL... id),
// or update PLAYLIST_ID below. If the playlist feed ever fails, it falls back
// to the channel-wide feed so the section never goes empty.
// Playlist and channel IDs are public — fine to keep here.
module.exports = async (req, res) => {
  const PLAYLIST_ID =
    process.env.YT_PLAYLIST_ID || 'PLZbLLYXzA1_k5b2q8pFONAAMnqT0HDJqE'; // Online Events Series
  const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCRfgLdabcXDFKhv_BFazjYw';

  function parseFeed(xml, max) {
    const items = [];
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let e;
    while ((e = re.exec(xml))) {
      const b = e[1];
      const id = (b.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
      let title = (b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const published = (b.match(/<published>([^<]+)<\/published>/) || [])[1] || '';
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      if (id) {
        items.push({
          id: id,
          title: title,
          published: published,
          url: 'https://www.youtube.com/watch?v=' + id,
          thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
        });
      }
    }
    // Newest first — playlist feeds aren't guaranteed to be date-ordered.
    items.sort(function (a, b) {
      return a.published < b.published ? 1 : -1;
    });
    return items.slice(0, max);
  }

  try {
    let items = [];
    try {
      const feed = await fetch(
        'https://www.youtube.com/feeds/videos.xml?playlist_id=' + PLAYLIST_ID
      );
      if (feed.ok) items = parseFeed(await feed.text(), 6);
    } catch (e) {
      /* fall through to channel feed */
    }
    if (!items.length) {
      const feed = await fetch(
        'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID
      );
      if (!feed.ok) {
        res.status(502).json({ error: 'feed ' + feed.status });
        return;
      }
      items = parseFeed(await feed.text(), 6);
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ playlistId: PLAYLIST_ID, items: items });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
};
