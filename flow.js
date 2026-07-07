/* Flow gradient background — WebGL2 red flow + ASCII "WEB3DEVS" halftone.
   Sits behind the page content, blended (screen) over the site's dark bg +
   blob gradients. Scrolls with the page via a u_scroll offset. Mouse-reactive. */
(() => {
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) { return; } // no WebGL2 -> site keeps its normal background, effect just absent

  /* glyph atlas: the brand text tiled across the grid */
  const RAMP = ['W', 'E', 'B', '3', 'D', 'E', 'V', 'S'];
  const CELL = 64;
  const atlas = document.createElement('canvas');
  atlas.width = CELL * RAMP.length; atlas.height = CELL;
  const a = atlas.getContext('2d');
  a.fillStyle = '#000'; a.fillRect(0, 0, atlas.width, atlas.height);
  a.fillStyle = '#fff';
  a.textAlign = 'center'; a.textBaseline = 'middle';
  a.font = `700 ${Math.floor(CELL * 0.78)}px "IBM Plex Mono", "Courier New", monospace`;
  RAMP.forEach((ch, i) => a.fillText(ch, i * CELL + CELL / 2, CELL / 2 + 2));

  const atlasTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, atlasTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const VERT = `#version 300 es
  in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

  const FRAG = `#version 300 es
  precision highp float;
  out vec4 outColor;

  uniform vec2  u_res;       // pixels
  uniform float u_time;
  uniform vec2  u_mouse;     // 0..1, smoothed (screen space)
  uniform float u_scroll;    // page scroll offset in device px
  uniform sampler2D u_atlas; // glyph ramp
  uniform float u_ramp;      // number of glyphs
  uniform float u_cellPx;    // halftone cell size in px

  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for(int i = 0; i < 6; i++){ v += amp * noise(p); p = rot * p * 2.02; amp *= 0.5; }
    return v;
  }

  void main(){
    vec2 fragS = gl_FragCoord.xy;                          // screen pixels
    vec2 fragF = gl_FragCoord.xy - vec2(0.0, u_scroll);    // field pixels (scrolls with page)
    vec2 screenUv = fragS / u_res;
    vec2 fieldUv  = fragF / u_res;
    vec2 asp = vec2(u_res.x / u_res.y, 1.0);
    vec2 p = fieldUv * asp;
    float t = u_time * 0.022;

    // flowing domain-warped noise field (big, slow blobs) — scrolls with the page
    vec2 q = vec2(fbm(p * 2.3 + vec2(0.0, t)), fbm(p * 2.3 + vec2(5.2, -t)));
    vec2 r = vec2(fbm(p * 2.3 + q * 1.6 + vec2(1.7, 9.2) + t * 0.6),
                  fbm(p * 2.3 + q * 1.6 + vec2(8.3, 2.8) - t * 0.6));
    float f = fbm(p * 2.3 + r * 2.0);
    f = smoothstep(0.20, 0.70, f);

    // mouse pushes the energy away: a soft dark void follows the cursor (screen space)
    vec2 sp = screenUv * asp;
    vec2 m = u_mouse * asp;
    float dark = exp(-distance(sp, m) * 2.7) * 0.6;
    f = clamp(f - dark, 0.0, 1.0);

    // red palette: black -> deep red -> vivid red
    vec3 c0 = vec3(0.018, 0.018, 0.022);
    vec3 c1 = vec3(0.150, 0.020, 0.030);
    vec3 c2 = vec3(0.430, 0.040, 0.050);
    vec3 c3 = vec3(0.760, 0.070, 0.090);
    vec3 c4 = vec3(0.920, 0.130, 0.140);
    vec3 col = mix(c0, c1, smoothstep(0.06, 0.34, f));
    col = mix(col, c2, smoothstep(0.32, 0.55, f));
    col = mix(col, c3, smoothstep(0.55, 0.78, f));
    col = mix(col, c4, smoothstep(0.78, 0.98, f));

    // ASCII / halftone overlay — letters scroll with the page
    vec2 cell = vec2(u_cellPx);
    vec2 cellId = floor(fragF / cell);
    vec2 cellUv = fract(fragF / cell);
    cellUv.y = 1.0 - cellUv.y;
    float gi = mod(cellId.x, u_ramp);
    vec2 atlasUv = vec2((gi + cellUv.x) / u_ramp, cellUv.y);
    float glyph = texture(u_atlas, atlasUv).r;

    vec3 final = col * (0.04 + 0.96 * glyph);

    // gentle vignette (screen space, stays centred)
    float vig = smoothstep(1.35, 0.45, distance(screenUv, vec2(0.5)));
    final *= mix(0.82, 1.0, vig);

    // slightly softened presence (motion is the main "calm down" lever, set via u_time)
    final *= 0.92;

    // alpha = luminance so dark gaps are transparent and the site's bg/gradients show through
    float lum = max(final.r, max(final.g, final.b));
    float alpha = clamp(lum * 1.6, 0.0, 0.95);
    outColor = vec4(max(final, 0.0), alpha);
  }`;

  function compile(type, src){
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);

  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    mouse: gl.getUniformLocation(prog, 'u_mouse'),
    scroll: gl.getUniformLocation(prog, 'u_scroll'),
    atlas: gl.getUniformLocation(prog, 'u_atlas'),
    ramp: gl.getUniformLocation(prog, 'u_ramp'),
    cellPx: gl.getUniformLocation(prog, 'u_cellPx'),
  };
  gl.uniform1i(U.atlas, 0);
  gl.uniform1f(U.ramp, RAMP.length);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlasTex);

  // premultiplied-alpha blending so the transparent gaps reveal the page background
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const host = canvas.parentNode;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize(){
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const w = host.clientWidth, h = host.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * DPR));
    canvas.height = Math.max(1, Math.floor(h * DPR));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.cellPx, 8.0 * DPR);
  }
  window.addEventListener('resize', resize); resize();

  const mouse = { x: 0.5, y: 0.5 }, target = { x: 0.5, y: 0.5 };
  window.addEventListener('pointermove', (e) => {
    target.x = e.clientX / window.innerWidth;
    target.y = 1.0 - e.clientY / window.innerHeight;
  });

  const start = performance.now();
  let scrollCur = window.scrollY || window.pageYOffset || 0;
  function frame(now){
    if(document.hidden){ requestAnimationFrame(frame); return; }
    mouse.x += (target.x - mouse.x) * 0.06;
    mouse.y += (target.y - mouse.y) * 0.06;
    // page scroll stays fully native; only the background's own offset is lightly smoothed
    const sy = window.scrollY || window.pageYOffset || 0;
    scrollCur += (sy - scrollCur) * 0.2;
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.time, (now - start) / 1000);
    gl.uniform2f(U.mouse, mouse.x, mouse.y);
    gl.uniform1f(U.scroll, scrollCur * DPR);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
