// Vercel serverless function — latest videos from the YouTube channel.
// The browser can't read YouTube's RSS directly (CORS), so the site fetches
// /api/youtube; this reads the public RSS feed server-side and returns the newest
// videos as JSON, which index.html renders into the Watch cards. Cached 1h.
//
// Channel: Web3 Devs Underground. The channel ID is public (not a secret), so it's
// fine to keep here. To change channels, update CHANNEL_ID (or set a YT_CHANNEL_ID
// environment variable in Vercel, which takes precedence).
module.exports = async (req, res) => {
  const CHANNEL_ID = process.env.YT_CHANNEL_ID || 'UCRfgLdabcXDFKhv_BFazjYw';
  try {
    const feed = await fetch(
      'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID
    );
    if (!feed.ok) {
      res.status(502).json({ error: 'feed ' + feed.status });
      return;
    }
    const xml = await feed.text();
    const items = [];
    const re = /<entry>([\s\S]*?)<\/entry>/g;
    let e;
    while ((e = re.exec(xml)) && items.length < 6) {
      const b = e[1];
      const id = (b.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
      let title = (b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
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
          url: 'https://www.youtube.com/watch?v=' + id,
          thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg',
        });
      }
    }
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({ channelId: CHANNEL_ID, items: items });
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
};
