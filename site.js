// web3devs.org — interactive components.
// Our Speakers — a rigid sphere of placeholder cards.
  // Idle: the whole sphere slowly auto-rotates. Hover: it rotates AS ONE body to bring the
  // pointed card to the front-centre (where it scales up + lifts); every card keeps a fixed
  // seat on the sphere. The selection map is frozen while the pointer is inside, so the
  // sphere can rotate freely without the focused card "fleeing the cursor".
  (function(){
    "use strict";
    var stage = document.getElementById('speakersSphere');
    var field = document.getElementById('sphereField');
    if(!stage || !field) return;

    // speaker company logos (local, transparent). bg = the fill rule per logo;
    // w = hand-tuned logo width (% of card) so they read at a balanced size, with
    // breathing room left/right. (5-logo test set.)
    // bg per rule: white logo -> brand colour (or #0e0e0e); dark logo -> #f4f2ef;
    // colour logo -> #0e0e0e (light parts) or #f4f2ef (dark parts). Logos are tight-cropped
    // and sized by a shared box in CSS so they read at a balanced size with side spacing.
    var SPEAKERS=[
      {n:'StarkWare',   f:'speakers/starkware.svg',         bg:'#2b2d6e'},
      {n:'Aztec',       f:'speakers/aztec.svg',              bg:'#0e0e0e'},
      {n:'Polygon',     f:'speakers/polygon.svg',            bg:'#0e0e0e'},
      {n:'Arbitrum',    f:'speakers/arbitrum.svg',           bg:'#0e0e0e'},
      {n:'Coinbase',    f:'speakers/coinbase.svg',           bg:'#0052ff'},
      {n:'Check Point', f:'speakers/checkpoint.svg',         bg:'#0e0e0e'},
      {n:'MetaMask',    f:'speakers/metamask.svg',           bg:'#f4f2ef'},
      {n:'Certora',     f:'speakers/certora.png',            bg:'#0e0e0e'},
      {n:'Hyperliquid', f:'speakers/hyperliquid.svg',        bg:'#0e0e0e'},
      {n:'HyperNative', f:'speakers/hypernative.svg',        bg:'#0e0e0e'},
      {n:'Hacken',      f:'speakers/hacken.svg',             bg:'#0e0e0e'},
      {n:'Lava',        f:'speakers/lava.png',               bg:'#0e0e0e'},
      {n:'Fireblocks',  f:'speakers/fireblocks.svg',         bg:'#0e0e0e'},
      {n:'Rapyd',       f:'speakers/rapyd.svg',              bg:'#0e0e0e'},
      {n:'Dynamic',     f:'speakers/dynamic.svg',            bg:'#0e0e0e'},
      {n:'o1Labs',      f:'speakers/o1labs.svg',             bg:'#0e0e0e'},
      {n:'TRES',        f:'speakers/tres.svg',               bg:'#f4f2ef'},
      {n:'Zama',        f:'speakers/zama.svg',               bg:'#f4f2ef'},
      {n:'Mina',        f:'speakers/mina.svg',               bg:'#f4f2ef'},
      {n:'Ethereum',    f:'speakers/ethereum.svg',           bg:'#0e0e0e'},
      {n:'Data-IL',     f:'speakers/datail.png',             bg:'#0e0e0e'},
      {n:'MAMRAM Seeds',f:'speakers/mamramseeds.svg',        bg:'#0e0e0e'},
      {n:'1inch',       f:'speakers/1inch.png',              bg:'#ffffff'},
      {n:'Kaspa',       f:'speakers/kaspa.png',              bg:'#0e0e0e'},
      {n:'Utila',       f:'speakers/utila.png',              bg:'#0e0e0e'},
      {n:'Team8',       f:'speakers/team8.png',              bg:'#ffffff'},
      {n:'Ginger Security', f:'speakers/ginger-security.png', bg:'#f4f2ef'},
      {n:'Partner',     f:'speakers/swap.png',               bg:'#011110'},
      {n:'Crypto Mondays', f:'speakers/cryptomondays.svg',   bg:'#0e0e0e'}
    ];

    // The live list is managed in Notion ("Website: Speakers & Partners" database)
    // and served by /api/speakers; the built-in SPEAKERS list above is only the
    // fallback so the sphere never renders empty if Notion is slow or unreachable.
    // Each entry: {n: name, f: image URL, bg: card colour}.
    function init(SPEAKERS){
    var CARD_COUNT  = SPEAKERS.length;
    var FOCUS_SCALE = 2.0;     // size of the card once it reaches front-centre
    var SETTLE_BASE = 0.0009;  // smaller = snappier; ~0.45s ease-out settle
    var DIM         = 0.5;     // opacity multiplier on the other cards while one is focused
    var DIM_BLUR    = 2;       // px added to the others while one is focused
    var STICK       = 4000;    // hysteresis (px^2) so focus doesn't jitter at card borders

    var reduce    = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hoverable = window.matchMedia('(hover: hover)').matches;
    var SPIN      = reduce ? 0 : 0.12;   // auto-spin rad/s -> full turn ~52s
    var TILT      = -0.18;               // gentle constant tilt so the sphere reads as 3D

    var GLYPH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L7 20"/></svg>';
    var ASPECTS = [1.3,1.0,0.74,1.0,0.86,1.15];

    function rand(a,b){return a+Math.random()*(b-a);}
    function lerp(a,b,t){return a+(b-a)*t;}
    function clamp01(v){return v<0?0:(v>1?1:v);}
    function wrap(a){while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;}

    // build cards on an even (Fibonacci) sphere
    var cards=[];
    var GOLDEN=Math.PI*(3-Math.sqrt(5));
    for(var i=0;i<CARD_COUNT;i++){
      var sp=SPEAKERS[i];
      var el=document.createElement('div');
      el.className='s-card s-logo';
      el.style.background=sp.bg;
      var lite=(sp.bg.toLowerCase()==='#f4f2ef');   // dark name text on light cards
      // name is hidden unless the logo image fails to load (then it is revealed)
      el.innerHTML='<span class="s-name" style="color:'+(lite?'#0e0e0e':'rgba(255,255,255,.92)')+'">'+sp.n+'</span>'
        +'<img src="'+sp.f+'" alt="'+sp.n+'" loading="lazy" draggable="false" '
        +'onerror="this.style.display=\'none\';var n=this.parentNode.querySelector(\'.s-name\');if(n)n.style.display=\'flex\'">';
      field.appendChild(el);
      var mob=window.matchMedia('(max-width:760px)').matches;
      var w=mob?74:105, h=mob?47:67;   // ~30% smaller overall, a further 30% on mobile
      el.style.width=w+'px'; el.style.height=h+'px';
      // each card is centred on its projected point by the translate(-50%,-50%) in its
      // transform; an extra negative margin here would double-centre and shift the whole
      // sphere up-left, so it is intentionally omitted.
      var uy=1-(i/(CARD_COUNT-1))*2;
      var rr=Math.sqrt(Math.max(0,1-uy*uy));
      var th=GOLDEN*i;
      cards.push({el:el,w:w,h:h,ux:Math.cos(th)*rr,uy:uy,uz:Math.sin(th)*rr,rot0:rand(-6,6),f:0});
    }

    var R=200, PERSP=480, XSTRETCH=1;
    function layout(){
      var W=stage.clientWidth, H=stage.clientHeight, m=Math.min(W,H);
      R=Math.max(120, m*0.40); PERSP=R*2.4;
      // on wide desktop, stretch the sphere horizontally into a 3D ellipse so cards
      // spread out to the left and right (the underlying sphere stays invisible).
      XSTRETCH = Math.max(1, Math.min(1.75, (W/H) / 1.25));
    }
    layout();
    window.addEventListener('resize', layout);

    // project a card to screen space at a given sphere orientation (rotate Y then X)
    function project(c, aY, aX){
      var cY=Math.cos(aY),sY=Math.sin(aY),cX=Math.cos(aX),sX=Math.sin(aX);
      var x1=c.ux*cY+c.uz*sY, z1=-c.ux*sY+c.uz*cY, y1=c.uy;
      var y2=y1*cX-z1*sX, z2=y1*sX+z1*cX;
      var pz=z2*R, scale=PERSP/(PERSP-pz);
      return {x:x1*R*scale*XSTRETCH, y:y2*R*scale, scale:scale, z:pz};
    }
    // orientation that rotates a card to the front pole -> it projects to (0,0) at max depth
    function frontAngles(c){
      var r=Math.sqrt(c.ux*c.ux + c.uz*c.uz);
      return {aY:Math.atan2(-c.ux, c.uz), aX:Math.atan2(c.uy, r)};
    }
    // pointer -> container-local px
    function toLocal(e){
      var r=stage.getBoundingClientRect();
      return {x:e.clientX-(r.left+r.width/2), y:e.clientY-(r.top+r.height/2)};
    }

    var spinY=0, visY=0, visX=TILT, selY=0;
    var hovering=false, pointer={x:0,y:0}, hero=-1, dragging=false;

    function distToCard(i){ var pj=project(cards[i],selY,TILT); var dx=pointer.x-pj.x, dy=pointer.y-pj.y; return dx*dx+dy*dy; }
    // nearest card to the pointer in the FROZEN selection layout, with stickiness
    function pickHero(){
      var best = hero>=0 ? hero : 0;
      var bestD = distToCard(best) - (hero>=0 ? STICK : 0);
      for(var k=0;k<cards.length;k++){ if(k===best) continue; var d=distToCard(k); if(d<bestD){bestD=d;best=k;} }
      return best;
    }

    if(hoverable){
      stage.addEventListener('mousemove', function(e){ if(!hovering){hovering=true; selY=visY;} var p=toLocal(e); pointer.x=p.x; pointer.y=p.y; });
      stage.addEventListener('mouseleave', function(){ hovering=false; spinY=visY; });
    }else{
      // touch: drag horizontally to spin the sphere with your finger; tap a card to focus it
      var sx=0,sy=0,lx=0,moved=false;
      stage.addEventListener('pointerdown', function(e){
        dragging=true; moved=false; sx=lx=e.clientX; sy=e.clientY; selY=visY;
        try{ stage.setPointerCapture(e.pointerId); }catch(_){}
      });
      stage.addEventListener('pointermove', function(e){
        if(!dragging) return;
        var dx=e.clientX-lx; lx=e.clientX;
        if(Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy)>6) moved=true;
        spinY -= dx*0.011; visY=spinY; hovering=false;       // 1:1 finger rotation
      });
      function endTouch(e){
        if(!dragging) return; dragging=false;
        if(!moved){                                          // a tap -> focus / release nearest card
          var p=toLocal(e); pointer.x=p.x; pointer.y=p.y; selY=visY;
          var pick=pickHero();
          if(hovering && pick===hero){ hovering=false; } else hovering=true;
        }
        spinY=visY;                                          // resume auto-spin from here
      }
      stage.addEventListener('pointerup', endTouch);
      stage.addEventListener('pointercancel', function(){ dragging=false; spinY=visY; });
    }

    var last=performance.now(), sphereVis=true;
    if('IntersectionObserver' in window){ sphereVis=false;
      new IntersectionObserver(function(es){ sphereVis=es[0].isIntersecting; },{rootMargin:'250px'}).observe(stage); }
    function frame(now){
      if(!sphereVis){ last=now; requestAnimationFrame(frame); return; }
      var dt=Math.min(0.05,(now-last)/1000); last=now;
      var k=(1-Math.pow(SETTLE_BASE,dt));

      if(hovering){
        hero=pickHero();
        var T=frontAngles(cards[hero]);
        visY += wrap(T.aY - visY)*k;     // rotate the whole sphere to bring hero to front
        visX += (T.aX - visX)*k;
      }else{
        hero=-1;
        if(!dragging) spinY += SPIN*dt;  // free auto-spin (paused while finger-dragging)
        visY += wrap(spinY - visY)*k;
        visX += (TILT - visX)*k;
      }

      var focusAmt=0;
      for(var i=0;i<cards.length;i++){
        var isHero=(i===hero);
        cards[i].f += ((isHero?1:0) - cards[i].f)*k;
        if(cards[i].f>focusAmt) focusAmt=cards[i].f;
      }
      for(i=0;i<cards.length;i++){
        var c=cards[i];
        var pj=project(c, visY, visX);
        var p=c.f, isH=(i===hero);
        var depthT=clamp01((pj.z+R)/(2*R));
        var sc=lerp(pj.scale, FOCUS_SCALE, p);
        var rot=lerp(c.rot0, 0, p);
        c.el.style.transform='translate(-50%,-50%) translate('+pj.x.toFixed(2)+'px,'+pj.y.toFixed(2)+'px) scale('+sc.toFixed(3)+') rotateZ('+rot.toFixed(2)+'deg)';
        c.el.style.zIndex = isH ? 9999 : Math.round(1000+pj.z);
        c.el.style.boxShadow='0 '+(14+72*p).toFixed(0)+'px '+(34+92*p).toFixed(0)+'px rgba(0,0,0,'+(0.42+0.3*p).toFixed(2)+')';
        if(isH){ c.el.style.opacity='1'; c.el.style.filter='none'; }
        else{
          var op=lerp(0.5,1,depthT)*lerp(1,DIM,focusAmt);
          var bl=lerp(1.6,0,depthT)+DIM_BLUR*focusAmt;
          c.el.style.opacity=op.toFixed(3);
          c.el.style.filter = bl>0.05 ? ('blur('+bl.toFixed(2)+'px)') : 'none';
        }
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    } // end init()

    // Boot: try the live Notion-backed list first (2.5s budget), then fall back.
    // init() runs exactly once either way.
    var booted=false;
    function boot(list){ if(booted) return; booted=true; init(list); }
    if(window.fetch){
      var bootT=setTimeout(function(){ boot(SPEAKERS); }, 2500);
      fetch('/api/speakers')
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          clearTimeout(bootT);
          var items=((d && d.items) || []).filter(function(s){ return s && s.n && s.f; });
          boot(items.length >= 3 ? items : SPEAKERS);
        })
        .catch(function(){ clearTimeout(bootT); boot(SPEAKERS); });
    }else{
      boot(SPEAKERS);
    }
  })();

// Previous Events — interactive timeline gallery (embedded).
  // Drag, horizontal trackpad scroll, tap a month tick, or use arrow keys to scrub.
  // Cards skew in 3D with velocity; the ruler tick crossing centre grows + lights up.
  (function(){
    "use strict";
    var stage=document.getElementById('tlStage');
    var lane=document.getElementById('tlLane');
    var rulerTrack=document.getElementById('rulerTrack');
    if(!stage || !lane || !rulerTrack) return;

    var MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var CATS=['Meetup','Workshop','Conference','Hackathon','Panel','AMA'];
    var COUNT=12;                       // ~1 per month
    var GLYPH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16l-5-5L7 20"/></svg>';

    // tunables
    var LERP=0.10;            // scroll momentum
    var WHEEL_SENS=0.00050;   // wheel delta -> progress
    var SNAP_IDLE=150;        // ms of stillness before month-snap
    var SMOOTH_V=0.16;        // velocity smoothing
    var ROT_GAIN=0.42;        // px/frame -> degrees of 3D turn
    var PERSP=900;            // per-card perspective depth

    var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hoverable=window.matchMedia('(hover: hover)').matches;

    function seeded(i){ var x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); }
    function lerp(a,b,t){return a+(b-a)*t;}
    function clamp(v,a,b){return v<a?a:(v>b?b:v);}
    function clamp01(v){return v<0?0:(v>1?1:v);}

    // build cards (newest -> oldest, left -> right). card 0 = most recent photo.
    // Photos come from events.js (window.W3D_EVENTS); placeholders when the manifest is empty.
    var EVENTS=(window.W3D_EVENTS||[]).filter(function(e){return e && e.src && e.date;});
    EVENTS.sort(function(a,b){return a.date<b.date?1:(a.date>b.date?-1:0);}); // newest -> oldest
    var cards=[];
    if(EVENTS.length){
      EVENTS.forEach(function(ev,i){
        var d=new Date(ev.date+'T00:00:00');
        var monthIdx=d.getMonth();
        var el=document.createElement('div'); el.className='tl-card';
        var media=document.createElement('div'); media.className='media';
        var img=document.createElement('img');
        img.src=ev.src; img.alt=ev.event||''; img.loading='lazy'; img.draggable=false;
        media.appendChild(img);
        var cap=document.createElement('span'); cap.className='cap';
        cap.textContent=(ev.event||'Event')+' · '+MONTHS[monthIdx]+' '+d.getDate();
        media.appendChild(cap);
        el.appendChild(media); lane.appendChild(el);
        var asp=(ev.w&&ev.h)?clamp(ev.w/ev.h,0.66,1.5):lerp(0.66,1.5,seeded(i+5.5));
        cards.push({el:el, media:media, cap:cap,
                    monthIdx:monthIdx, ym:String(ev.date).slice(0,7), aspect:asp, hr:seeded(i)});
      });
    }else{
      for(var i=0;i<COUNT;i++){
        var monthIdx=(11 - i % 12 + 12)%12;        // Dec, Nov, ... Jan
        var el=document.createElement('div'); el.className='tl-card';
        var media=document.createElement('div'); media.className='media';
        media.innerHTML=GLYPH
          +'<span class="idx">'+String(i+1).padStart(2,'0')+'</span>'
          +'<span class="cap">'+CATS[i%CATS.length]+' &middot; '+MONTHS[monthIdx]+'</span>';
        el.appendChild(media); lane.appendChild(el);
        cards.push({el:el, media:media, cap:media.querySelector('.cap'),
                    monthIdx:monthIdx, ym:'ph-'+i, aspect:lerp(0.66,1.5,seeded(i+5.5)), hr:seeded(i)});
      }
    }

    // ruler ticks — one per photo; the month label sits on the first tick of each month,
    // so the number of lines in a month equals the number of photos that month
    var seenYM={};
    cards.forEach(function(c){
      var t=document.createElement('div'); t.className='tick';
      if(!seenYM[c.ym]){ seenYM[c.ym]=true; t.innerHTML='<span class="lbl">'+MONTHS[c.monthIdx]+'</span>'; }
      rulerTrack.appendChild(t); c.tick=t; c.lbl=t.querySelector('.lbl');
    });

    var W=0,H=0,mobile=false,stageH=0,c0=0,cL=0,span=1,RANGE=400,ROT_MAX=22,ANCHOR=0;

    function layout(){
      W=stage.clientWidth; H=stage.clientHeight; mobile=W<760;
      ROT_MAX=mobile?7:22;
      var topSafe=18, bottomSafe=96;
      stageH=H-topSafe-bottomSafe;
      var MAXH=stageH*(mobile?0.62:0.72), MINHR=0.5, MAXWR=mobile?0.64:0.42, GAP=mobile?26:52;
      var x=0;
      for(var i=0;i<cards.length;i++){
        var c=cards[i];
        var h=lerp(MAXH*MINHR, MAXH, c.hr);
        var w=h*c.aspect;
        var maxW=W*MAXWR; if(w>maxW){ w=maxW; h=w/c.aspect; }
        var y=topSafe + seeded(i+99.3)*(stageH-h);
        c.x=x; c.y=y; c.w=w; c.h=h; c.cx=x+w/2;
        c.el.style.width=w+'px'; c.el.style.height=h+'px';
        c.el.style.transform='translate3d('+x+'px,'+y+'px,0)';
        c.el.style.perspective=PERSP+'px';
        c.tick.style.left=c.cx+'px';
        x+=w+GAP;
      }
      c0=cards[0].cx; cL=cards[cards.length-1].cx; span=Math.max(1,cL-c0);
      RANGE=(span/(cards.length-1))*0.92;
      rulerTrack.style.width=(x)+'px';
      // left-aligned: first card starts near the left edge (not screen centre)
      var PAD = mobile?16:82;
      ANCHOR = PAD + (cards[0]?cards[0].w/2:0);
    }

    // ---- state ----
    var progress=0, target=0, prevTrackX=0, smoothV=0;
    var dragging=false, lastX=0, lastInput=-1e9, started=false;
    var trackXof=function(p){ return (ANCHOR - c0) - p*span; };
    function monthProgress(i){ return (cards[i].cx - c0)/span; }
    function nearestMonth(p){
      var best=0,bd=1e9; for(var i=0;i<cards.length;i++){var d=Math.abs(monthProgress(i)-p); if(d<bd){bd=d;best=i;}} return best;
    }
    function go(){ if(!started){started=true; stage.classList.add('go');} }

    // ---- input ----
    // horizontal trackpad/wheel swipes scrub the timeline; vertical wheel scrolls the page
    stage.addEventListener('wheel', function(e){
      if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)) return;
      e.preventDefault(); go();
      target=clamp01(target+e.deltaX*WHEEL_SENS); lastInput=performance.now();
    }, {passive:false});

    stage.addEventListener('pointerdown', function(e){
      var t=e.target.closest && e.target.closest('.tick');
      if(t){ var mi=cards.findIndex(function(c){return c.tick===t;}); if(mi>=0){ go(); target=monthProgress(mi); lastInput=performance.now(); } return; }
      dragging=true; started||go(); stage.classList.add('dragging');
      lastX=e.clientX; lastInput=performance.now();
      try{ stage.setPointerCapture(e.pointerId); }catch(_){}
    });
    stage.addEventListener('pointermove', function(e){
      if(!dragging) return;
      var dx=e.clientX-lastX; lastX=e.clientX;
      target=clamp01(target - dx/span); lastInput=performance.now();
    });
    function endDrag(){ if(dragging){ dragging=false; stage.classList.remove('dragging'); lastInput=performance.now(); } }
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    // click a month label/tick to scrub there
    rulerTrack.addEventListener('click', function(e){
      var t=e.target.closest('.tick'); if(!t) return;
      var i=cards.findIndex(function(c){return c.tick===t;});
      if(i>=0){ go(); target=monthProgress(i); lastInput=performance.now(); }
    });

    // keyboard: arrows step month-to-month (when the timeline is focused)
    stage.addEventListener('keydown', function(e){
      if(e.key!=='ArrowLeft' && e.key!=='ArrowRight') return;
      e.preventDefault();
      go(); var cur=nearestMonth(target);
      cur=clamp(cur+(e.key==='ArrowRight'?1:-1),0,cards.length-1);
      target=monthProgress(cur); lastInput=performance.now();
    });

    var resizeT;
    window.addEventListener('resize', function(){ clearTimeout(resizeT); resizeT=setTimeout(function(){ layout(); }, 120); });

    // ---- render loop ----
    layout();
    prevTrackX=trackXof(progress);
    var lastCenter=-1, usingMouse=false;
    cards.forEach(function(c,i){
      c.el.addEventListener('pointerenter', function(e){
        if(e.pointerType==='touch') return;
        usingMouse=true;
        cards.forEach(function(cc,j){ cc.cap.classList.toggle('show', j===i); });
      });
      c.el.addEventListener('pointerleave', function(e){
        if(e.pointerType==='touch') return;
        c.cap.classList.remove('show');
      });
    });

    var tlVis=true;
    if('IntersectionObserver' in window){ tlVis=false;
      new IntersectionObserver(function(es){ tlVis=es[0].isIntersecting; },{rootMargin:'250px'}).observe(stage); }
    function loop(now){
      if(!tlVis){ prevTrackX=trackXof(clamp01(progress)); requestAnimationFrame(loop); return; }
      if(dragging){
        progress=target;
      } else {
        if(now-lastInput>SNAP_IDLE){ target=monthProgress(nearestMonth(target)); }
        progress += (target-progress)*(reduce?0.5:LERP);
      }
      progress=clamp01(progress);

      var trackX=trackXof(progress);
      var rawV=trackX-prevTrackX; prevTrackX=trackX;
      smoothV += (rawV-smoothV)*SMOOTH_V;
      var baseRot=reduce?0:clamp(smoothV*ROT_GAIN, -ROT_MAX, ROT_MAX);

      lane.style.transform='translate3d('+trackX.toFixed(2)+'px,0,0)';
      rulerTrack.style.transform='translate3d('+trackX.toFixed(2)+'px,0,0)';

      var centerX=ANCHOR, cIdx=-1, cDist=1e9;
      for(var i=0;i<cards.length;i++){
        var c=cards[i];
        var scx=trackX+c.cx;
        var dist=Math.abs(scx-centerX);
        if(dist<cDist){cDist=dist;cIdx=i;}

        // velocity skew in 3D — strongest at the edges, flat at the centre, zero at rest
        var df=clamp(dist/(W*0.5),0,1);
        var rot=baseRot*(0.55+0.95*df);
        c.media.style.transform='rotateY('+rot.toFixed(2)+'deg)';

        // ruler tick: the card crossing the centre grows taller + brighter (smooth)
        var hl=1-clamp(dist/RANGE,0,1); hl=hl*hl*(3-2*hl); // smoothstep
        c.tick.style.height=lerp(10,32,hl).toFixed(1)+'px';
        c.tick.style.opacity=lerp(0.32,1,hl).toFixed(3);
        c.tick.style.background = hl>0.5 ? 'var(--acc)' : 'var(--ink)';
        c.tick.style.boxShadow = hl>0.6 ? '0 0 10px rgba(248,219,76,'+(0.45*hl).toFixed(2)+')' : 'none';
        if(c.lbl){
          c.lbl.style.color = hl>0.45 ? 'var(--ink)' : 'var(--muted)';
          c.lbl.style.opacity=lerp(0.5,1,hl).toFixed(3);
        }
      }

      // mobile (no hover): reveal the centred card's caption
      if(!usingMouse && cIdx!==lastCenter){
        cards.forEach(function(c,j){ c.cap.classList.toggle('show', j===cIdx); });
        lastCenter=cIdx;
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();
