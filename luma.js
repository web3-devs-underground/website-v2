// Meet Us — upcoming events, fed live from the Luma calendar.
// Renders minimal clickable cards (cover, date, title, location); each opens the
// Luma event page in a new tab. Falls back to a bundled snapshot if the API is
// unreachable (offline / CORS), so the block never renders empty.
(function(){
  "use strict";
  // Live events are fetched through our own /api/luma proxy (server-side), which
  // avoids the browser CORS block that previously forced the snapshot fallback.
  var API = "/api/luma";
  var MAX_CARDS = 3;

  // Snapshot fallback — refresh occasionally (last updated 2026-06-12).
  var SNAPSHOT = [
    { name:"Shared Liquidity to Unlock DeFi Capital | Web3 Devs Underground", start_at:"2026-07-15T14:00:00.000Z",
      timezone:"Asia/Jerusalem", url:"https://lu.ma/7p4xrxd7", loc:"Online",
      cover:"https://images.lumacdn.com/uploads/xn/a144d842-4b43-4c5e-8dc6-3185a89e6e43.png" },
    { name:"Monthly Meetup of the Web3 Developers Underground community", start_at:"2026-07-29T15:00:00.000Z",
      timezone:"Asia/Jerusalem", url:"https://lu.ma/2xrvt423", loc:"Tel Aviv-Yafo",
      cover:"https://images.lumacdn.com/uploads/vw/c0bb79d7-1027-494f-b24c-ee29c5053dd7.png" },
    { name:"How ZK Enhances Privacy | Web3 Devs Underground", start_at:"2026-08-12T14:00:00.000Z",
      timezone:"Asia/Jerusalem", url:"https://lu.ma/eo69kght", loc:"Online",
      cover:"https://images.lumacdn.com/uploads/j5/5c473daf-2399-4550-92d5-e88db08fc969.png" },
    { name:"Monthly Meetup of the Web3 Developers Underground community", start_at:"2026-06-24T15:00:00.000Z",
      timezone:"Asia/Jerusalem", url:"https://lu.ma/y18xh2e3", loc:"Tel Aviv-Yafo",
      cover:"https://images.lumacdn.com/uploads/yt/0e683d46-2f81-4336-ae59-139b474433c2.png" }
  ];

  var grid = document.getElementById("lumaEvents");
  if (!grid) return;

  function fmtDate(ev){
    try{
      var d = new Date(ev.start_at);
      var f = new Intl.DateTimeFormat("en-GB", {
        weekday:"short", day:"numeric", month:"short",
        hour:"2-digit", minute:"2-digit", hour12:false,
        timeZone: ev.timezone || "Asia/Jerusalem"
      });
      return f.format(d).replace(",", " ·");
    }catch(_){ return ""; }
  }

  function render(events){
    events = (events||[]).slice().filter(function(ev){ return new Date(ev.start_at).getTime() >= Date.now() - 36e5; }).sort(function(a,b){ return a.start_at < b.start_at ? -1 : 1; });
    grid.innerHTML = "";
    if (!events.length){
      var empty = document.createElement("a");
      empty.className = "ev-empty";
      empty.href = "https://luma.com/web3devs_underground";
      empty.target = "_blank"; empty.rel = "noopener noreferrer";
      empty.textContent = "No upcoming events yet — open the calendar";
      grid.appendChild(empty);
      return;
    }
    events.slice(0, MAX_CARDS).forEach(function(ev){
      var a = document.createElement("a");
      a.className = "ev-card reveal";
      a.href = ev.url; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.setAttribute("aria-label", ev.name);

      var cover = document.createElement("div");
      cover.className = "ev-cover";
      if (ev.cover){
        var img = document.createElement("img");
        img.src = ev.cover; img.alt = ""; img.loading = "lazy";
        cover.appendChild(img);
      }
      a.appendChild(cover);

      var body = document.createElement("div");
      body.className = "ev-body";
      var dt = document.createElement("div");
      dt.className = "ev-date"; dt.textContent = fmtDate(ev);
      var nm = document.createElement("div");
      nm.className = "ev-name"; nm.textContent = ev.name;
      var loc = document.createElement("div");
      loc.className = "ev-loc"; loc.textContent = ev.loc || "";
      body.appendChild(dt); body.appendChild(nm); body.appendChild(loc);
      a.appendChild(body);

      grid.appendChild(a);
    });
    if (window.__reveal) window.__reveal(grid);
  }

  function fromApi(data){
    return (data.entries || [])
      .map(function(en){ return en.event; })
      .filter(Boolean)
      .map(function(ev){
        return {
          name: ev.name,
          start_at: ev.start_at,
          timezone: ev.timezone,
          url: "https://lu.ma/" + ev.url,
          cover: ev.cover_url,
          loc: ev.location_type === "offline"
            ? ((ev.geo_address_info && ev.geo_address_info.city) || "In person")
            : "Online"
        };
      })
      .sort(function(a,b){ return a.start_at < b.start_at ? -1 : 1; });
  }

  // Render the snapshot immediately (no empty flash), then swap in live data.
  render(SNAPSHOT.filter(function(ev){ return new Date(ev.start_at) > new Date(); }));

  var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
  var to = ctrl ? setTimeout(function(){ try{ ctrl.abort(); }catch(_){} }, 8000) : null;
  fetch(API, ctrl ? { signal: ctrl.signal } : undefined)
    .then(function(r){ if(to) clearTimeout(to); if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data){ var evs = fromApi(data); if (evs.length) render(evs); })
    .catch(function(){ if(to) clearTimeout(to); /* timeout or error -> keep snapshot */ });
})();
