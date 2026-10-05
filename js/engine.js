// Small engine: SVG helpers, tweens, pointer input, guide bubble, cards and level lifecycle.
const NS = 'http://www.w3.org/2000/svg';
const $ = id => document.getElementById(id);
const stage = $('stage');
const layers = { bg: $('bg'), world: $('world'), fx: $('fx') };

function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
// Group built from an SVG markup string, positioned with place().
function art(parent, markup, x = 0, y = 0, attrs = {}) {
  const g = el('g', attrs, parent);
  g.innerHTML = markup;
  place(g, x, y);
  return g;
}
function place(g, x, y, s, r) {
  g._x = x; g._y = y;
  if (s !== undefined) g._s = s;
  if (r !== undefined) g._r = r;
  const sc = g._s === undefined ? 1 : g._s, rot = g._r || 0;
  g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})${rot ? ` rotate(${rot.toFixed(2)})` : ''}${sc !== 1 ? ` scale(${sc.toFixed(3)})` : ''}`);
}
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = {
  linear: t => t,
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
function mixColor(c1, c2, t) {
  const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const a = p(c1), b = p(c2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

// ---------- Image sprites (art/*.webp, produced by tools/process-art.py) ----------
const SPR = typeof SPRITES === 'undefined' ? {} : SPRITES;
// Draws a sprite centred on (x, y), sized by width or height in stage units.
// g.inner is a nested group used for squash/bounce so effects never fight with place().
function sprite(parent, name, x, y, { w, h, attrs = {} } = {}) {
  const s = SPR[name];
  const ar = s ? s.h / s.w : 1;
  const W = w || (h ? h / ar : 120), H = h || W * ar;
  const g = el('g', attrs, parent);
  const inner = el('g', {}, g);
  if (s) {
    el('image', { href: s.src, x: -W / 2, y: -H / 2, width: W, height: H, preserveAspectRatio: 'none' }, inner);
  } else { // art not generated yet: labelled placeholder
    el('rect', { x: -W / 2, y: -H / 2, width: W, height: H, rx: 18, fill: '#FFF7E6', stroke: '#C98647', 'stroke-width': 3, 'stroke-dasharray': '10 8' }, inner);
    const t = el('text', { y: 8, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#C98647' }, inner);
    t.textContent = name;
  }
  g.inner = inner; g._w = W; g._h = H; g._name = name;
  place(g, x, y);
  return g;
}

// Full-stage background image; falls back to the vector kitchen while art is missing.
function setBg(name, fallback = {}) {
  const s = SPR[name];
  layers.bg.innerHTML = s
    ? `<image href="${s.src}" x="0" y="0" width="1000" height="700" preserveAspectRatio="xMidYMid slice"/>`
    : Art.kitchen(fallback);
}

// Round containers seen from above: where their inside (liquid area) is, in stage units.
// The circle itself is measured from the art (SPRITES[name].disc, tools/process-art.py);
// inner = inside radius as a fraction of the outer rim, read off each picture.
const DISC = {
  bowl_water: { inner: 0.8 }, bucket: { inner: 0.8 }, wok: { inner: 0.88 }, clay_pot: { inner: 0.8 },
  mill_base: { inner: 0.5, groove: 0.66 }, pan: { inner: 0.86 }, plate: { inner: 0.74 },
};
function discOf(g) {
  const c = DISC[g._name] || { inner: 0.8 };
  const m = SPR[g._name] && SPR[g._name].disc;
  const x = m ? g._x + (m.x - 0.5) * g._w : g._x, y = m ? g._y + (m.y - 0.5) * g._h : g._y;
  const R = m ? m.r * g._w : Math.min(g._w, g._h) / 2;
  return { x, y, R, r: R * c.inner, groove: R * (c.groove || c.inner) };
}

// Hand tools are moved by their working tip (blade, bristles, mesh), as a fraction of the picture.
const TIP = { knife: [0.25, 0.85], brush: [0.2, 0.88], skimmer: [0.28, 0.72], wooden_paddle: [0.3, 0.72] };
// Position of a tool's centre that puts its tip at (x, y).
function tipAt(g, x, y) {
  const [fx, fy] = TIP[g._name] || [0.5, 0.5];
  return [x + (0.5 - fx) * g._w, y + (0.5 - fy) * g._h];
}

// ---------- Juice: squash, hop and wobble on a sprite's inner group ----------
const Juice = {
  // Groups made with art() have no inner group yet: wrap their children so place() keeps working.
  inner(g) {
    if (!g.inner) {
      const i = el('g');
      while (g.firstChild) i.appendChild(g.firstChild);
      g.appendChild(i);
      g.inner = i;
    }
    return g.inner;
  },
  run(g, dur, fn) {
    const t = Juice.inner(g), t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / dur, 0, 1);
      t.setAttribute('transform', fn(k));
      if (k < 1) requestAnimationFrame(step); else t.removeAttribute('transform');
    };
    requestAnimationFrame(step);
  },
  pop(g, amt = 0.2, dur = 420) {
    Juice.run(g, dur, k => { const d = Math.sin(k * Math.PI * 3) * (1 - k) * amt; return `scale(${1 + d} ${1 - d})`; });
  },
  hop(g, height = 30, dur = 420) {
    Juice.run(g, dur, k => { const y = -Math.sin(k * Math.PI) * height, sq = k > 0.85 ? (1 - k) * 0.6 : 0; return `translate(0 ${y}) scale(${1 + sq} ${1 - sq})`; });
  },
  wobble(g, deg = 10, dur = 500) {
    Juice.run(g, dur, k => `rotate(${Math.sin(k * Math.PI * 4) * deg * (1 - k)})`);
  },
};

function svgPoint(e) {
  const p = stage.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(stage.getScreenCTM().inverse());
}

// ---------- Level context: everything a level touches is tracked so it can be torn down ----------
let current = null;

function makeCtx(onDone) {
  const token = {};
  const timers = [];
  const cleanups = [];
  const layer = el('g', {}, layers.world);
  const ctx = {
    layer,
    alive: () => current === token,
    later(ms, fn) { const id = setTimeout(() => { if (ctx.alive()) fn(); }, ms); timers.push(() => clearTimeout(id)); return id; },
    every(ms, fn) { const id = setInterval(() => { if (ctx.alive()) fn(); }, ms); timers.push(() => clearInterval(id)); return id; },
    wait(ms) { return new Promise(res => ctx.later(ms, res)); },
    tween(dur, fn, ez = ease.out) {
      return new Promise(res => {
        const t0 = performance.now();
        const step = now => {
          if (!ctx.alive()) return;
          const t = clamp((now - t0) / dur, 0, 1);
          fn(ez(t), t);
          if (t < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
    },
    loop(fn) { // per-frame callback with dt in seconds; return false to stop
      let last = performance.now(), stopped = false;
      const step = now => {
        if (!ctx.alive() || stopped) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (fn(dt) === false) return;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      const stop = () => { stopped = true; };
      cleanups.push(stop);
      return stop;
    },
    onCleanup(fn) { cleanups.push(fn); },
    say(html) { Guide.say(html); },
    progress(f) { UI.progress(f); },
    hint(x, y, parent) { return Hint.show(x, y, parent || layers.fx); },
    done(stars = 3) { if (!ctx.alive()) return; onDone(stars); },
    destroy() {
      timers.forEach(f => f()); cleanups.forEach(f => { try { f(); } catch (e) {} });
      layer.remove(); layers.fx.innerHTML = '';
      Input.clear();
    },
  };
  current = token;
  return ctx;
}
function endCurrent() { current = null; }

// ---------- Pointer input on the stage ----------
// Each finger is tracked by pointerId. Levels use one finger at a time; the points battle sets
// Input.multi so two children can play at once.
const Input = {
  handlers: [], pointers: new Map(), multi: false,
  busy() { return !this.multi && this.pointers.size > 0; },
  // Register a draggable/tappable node. opts: { start(p,e), move(p,e), end(p,e,moved), tap(p) }
  on(node, opts) {
    node.classList.add('tap');
    const h = { node, opts, enabled: true };
    node.addEventListener('pointerdown', e => {
      if (!h.enabled || Input.busy()) return;
      e.preventDefault(); e.stopPropagation();
      Snd.init();
      const p = svgPoint(e);
      Input.pointers.set(e.pointerId, { h, start: p, moved: false });
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      opts.start && opts.start(p, e);
    });
    this.handlers.push(h);
    return h;
  },
  // A whole-stage gesture (e.g. circular grinding) while it is enabled.
  stageHandler: null,
  clear() { this.handlers = []; this.pointers.clear(); this.stageHandler = null; this.multi = false; },
};
stage.addEventListener('pointerdown', e => {
  if (Input.busy() || !Input.stageHandler || Input.pointers.has(e.pointerId)) return;
  e.preventDefault(); Snd.init();
  const p = svgPoint(e);
  Input.pointers.set(e.pointerId, { h: { opts: Input.stageHandler, enabled: true }, start: p, moved: false });
  try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  Input.stageHandler.start && Input.stageHandler.start(p, e);
});
stage.addEventListener('pointermove', e => {
  const a = Input.pointers.get(e.pointerId);
  if (!a) return;
  const p = svgPoint(e);
  if (Math.hypot(p.x - a.start.x, p.y - a.start.y) > 10) a.moved = true;
  a.h.opts.move && a.h.opts.move(p, e);
});
const endPointer = e => {
  const a = Input.pointers.get(e.pointerId);
  if (!a) return;
  Input.pointers.delete(e.pointerId);
  const p = svgPoint(e);
  if (!a.moved && a.h.opts.tap) a.h.opts.tap(p, e);
  a.h.opts.end && a.h.opts.end(p, e, a.moved);
};
stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);

// ---------- Pointing hand hint ----------
const Hint = {
  show(x, y, parent) {
    const g = art(parent, Art.hand(), x, y);
    g.setAttribute('pointer-events', 'none');
    return () => g.remove();
  },
};

// ---------- Effects ----------
const FX = {
  burst(x, y, { n = 10, colors = ['#FFD84A', '#FF9F43', '#FFFFFF', '#7FD1AE'], spread = 70 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const d = spread * (0.6 + Math.random() * 0.6);
      const g = art(layers.fx, Art.sparkleStar(6 + Math.random() * 7, colors[i % colors.length]), x, y);
      const t0 = performance.now();
      const step = now => {
        const t = clamp((now - t0) / 650, 0, 1), k = ease.out(t);
        place(g, x + Math.cos(a) * d * k, y + Math.sin(a) * d * k - 20 * k, 1 - t * 0.7, t * 180);
        g.setAttribute('opacity', 1 - t);
        if (t < 1) requestAnimationFrame(step); else g.remove();
      };
      requestAnimationFrame(step);
    }
  },
  ring(x, y, { color = '#FFFFFF', r = 40, width = 4, dur = 600, ry } = {}) {
    const e = el('ellipse', { cx: x, cy: y, rx: 2, ry: 1, fill: 'none', stroke: color, 'stroke-width': width }, layers.fx);
    const t0 = performance.now();
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1), k = ease.out(t);
      e.setAttribute('rx', r * k); e.setAttribute('ry', (ry || r * 0.35) * k);
      e.setAttribute('opacity', 1 - t);
      if (t < 1) requestAnimationFrame(step); else e.remove();
    };
    requestAnimationFrame(step);
  },
  drops(x, y, { n = 6, color = '#7CC6E6', spread = 40, fall = 60, dir = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const vx = (Math.random() - 0.5) * spread + dir * 40, vy = -30 - Math.random() * 40;
      const d = el('ellipse', { cx: x, cy: y, rx: 4, ry: 5.5, fill: color, stroke: '#3E6FB0', 'stroke-width': 1 }, layers.fx);
      const t0 = performance.now();
      const step = now => {
        const t = clamp((now - t0) / 600, 0, 1);
        d.setAttribute('cx', x + vx * t * 1.5);
        d.setAttribute('cy', y + vy * t + (fall + 120) * t * t);
        d.setAttribute('opacity', 1 - t * t);
        if (t < 1) requestAnimationFrame(step); else d.remove();
      };
      requestAnimationFrame(step);
    }
  },
  // Liquid splash: droplets fly out and fall, plus a ripple.
  splash(x, y, { color = '#BFE7F7', n = 10, power = 1, ring = true } = {}) {
    if (ring) FX.ring(x, y, { r: 60 * power, color: '#FFFFFF', width: 5 });
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6, v = (90 + Math.random() * 120) * power;
      const r0 = 4 + Math.random() * 6;
      const d = el('circle', { cx: x, cy: y, r: r0, fill: color, stroke: '#FFFFFF', 'stroke-width': 1.5 }, layers.fx);
      const t0 = performance.now();
      const step = now => {
        const t = clamp((now - t0) / 650, 0, 1);
        d.setAttribute('cx', x + Math.cos(a) * v * t);
        d.setAttribute('cy', y + Math.sin(a) * v * t + 260 * t * t);
        d.setAttribute('r', r0 * (1 - t * 0.6));
        d.setAttribute('opacity', 1 - t);
        if (t < 1) requestAnimationFrame(step); else d.remove();
      };
      requestAnimationFrame(step);
    }
  },
  confetti(n = 70) {
    const cols = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF9F43', '#C77DFF'];
    for (let i = 0; i < n; i++) {
      const x = Math.random() * 1000, delay = Math.random() * 500, spin = (Math.random() - 0.5) * 900;
      const drift = (Math.random() - 0.5) * 160, dur = 1600 + Math.random() * 900;
      const p = el('rect', { x: -7, y: -4, width: 14, height: 8, rx: 2, fill: cols[i % cols.length] }, layers.fx);
      const t0 = performance.now() + delay;
      const step = now => {
        const t = clamp((now - t0) / dur, 0, 1);
        if (now >= t0) p.setAttribute('transform', `translate(${x + drift * t + Math.sin(t * 9) * 20} ${-20 + 760 * t}) rotate(${spin * t}) scale(1 ${Math.cos(t * 14)})`);
        if (t < 1) requestAnimationFrame(step); else p.remove();
      };
      requestAnimationFrame(step);
    }
  },
  shake(mag = 8, dur = 260) {
    const w = layers.world, t0 = performance.now();
    const step = now => {
      const t = clamp((now - t0) / dur, 0, 1), m = mag * (1 - t);
      w.setAttribute('transform', t < 1 ? `translate(${(Math.random() - 0.5) * 2 * m} ${(Math.random() - 0.5) * 2 * m})` : '');
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  // Big bubbly praise word that pops and floats away.
  praise(x, y, text) {
    const g = el('g', { 'pointer-events': 'none' }, layers.fx);
    const t = el('text', { 'text-anchor': 'middle', 'font-size': 54, 'font-weight': 900, fill: '#FFD23F', stroke: '#8A3B12', 'stroke-width': 10, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, g);
    t.textContent = text;
    const t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / 1100, 0, 1);
      const s = k < 0.25 ? ease.back(k / 0.25) : 1;
      g.setAttribute('transform', `translate(${x} ${y - 40 * Math.max(0, k - 0.5)}) scale(${s}) rotate(${-6 + Math.sin(k * 8) * 2})`);
      g.setAttribute('opacity', k > 0.75 ? (1 - k) / 0.25 : 1);
      if (k < 1) requestAnimationFrame(step); else g.remove();
    };
    requestAnimationFrame(step);
  },
  float(x, y, text, color = '#C9601E') {
    const t = el('text', { x, y, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 900, fill: color, stroke: '#FFFDF5', 'stroke-width': 5, 'paint-order': 'stroke' }, layers.fx);
    t.textContent = text;
    const t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / 900, 0, 1);
      t.setAttribute('y', y - 50 * ease.out(k)); t.setAttribute('opacity', 1 - k * k);
      if (k < 1) requestAnimationFrame(step); else t.remove();
    };
    requestAnimationFrame(step);
  },
};

// ---------- Guide (mascot + speech bubble) ----------
const Guide = {
  last: '',
  init() {
    $('mascotBox').innerHTML = SPR.char_maomao_happy ? `<img id="mascotImg" src="${SPR.char_maomao_happy.src}" alt="毛毛">` : Art.mascot();
    $('btnRepeat').addEventListener('click', () => { Snd.init(); Voice.say(this.last); this.bounce(); });
  },
  say(html) {
    this.last = html;
    const b = $('bubble');
    $('bubbleText').innerHTML = html;
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    this.bounce();
    Voice.say(html);
  },
  bounce() {
    const m = $('mascotBox');
    m.classList.remove('talk'); void m.offsetWidth; m.classList.add('talk');
  },
  // Briefly switch the guide's picture to another pose (cheer, wow, point).
  pose(name, ms = 1600) {
    const img = $('mascotImg'), s = SPR[`char_maomao_${name}`];
    if (!img || !s) return;
    img.src = s.src;
    clearTimeout(this._pose);
    this._pose = setTimeout(() => { img.src = SPR.char_maomao_happy.src; }, ms);
  },
};

// The mascot jumps into the scene to celebrate.
const Mascot = {
  cheer(text = '好棒！', { x = 130, pose = 'cheer' } = {}) {
    Guide.pose(pose);
    const name = SPR[`char_maomao_${pose}`] ? `char_maomao_${pose}` : null;
    const g = name ? sprite(layers.fx, name, x, 820, { h: 230 }) : art(layers.fx, Art.mascotInner(), x, 820);
    g.setAttribute('pointer-events', 'none');
    const t0 = performance.now();
    const step = now => {
      const t = (now - t0) / 1600;
      const y = t < 0.25 ? lerp(820, 585, ease.back(t / 0.25)) : t < 0.8 ? 585 - Math.abs(Math.sin((t - 0.25) * 14)) * 18 : lerp(585, 840, ease.inOut((t - 0.8) / 0.2));
      place(g, x, y);
      if (t < 1) requestAnimationFrame(step); else g.remove();
    };
    requestAnimationFrame(step);
    setTimeout(() => FX.praise(x + 150, 470, text), 250);
    Snd.sparkle();
  },
};

// ---------- HTML UI ----------
const UI = {
  progress(f) { $('progressFill').style.width = `${clamp(f, 0, 1) * 100}%`; },
  show(id, on) { $(id).hidden = !on; },
  // Modal card. buttons: [{label, alt, onClick}]
  card({ art: artMarkup = '', stars = null, title = '', text = '', buttons = [], speak = true, html = null }) {
    $('cardArt').innerHTML = artMarkup ? `<svg viewBox="-60 -60 120 120">${artMarkup}</svg>` : '';
    $('cardStars').innerHTML = stars === null ? '' :
      [0, 1, 2].map(i => `<span class="s ${i < stars ? '' : 'dim'}" style="animation-delay:${i * 0.15}s">★</span>`).join('');
    $('cardTitle').innerHTML = title;
    $('cardText').innerHTML = text;
    const box = $('cardBtns');
    box.innerHTML = '';
    if (html) box.appendChild(html);
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'bigbtn' + (b.alt ? ' alt' : '');
      btn.textContent = b.label;
      btn.addEventListener('click', () => { Snd.init(); Snd.click(); b.onClick(); });
      box.appendChild(btn);
    });
    $('modal').hidden = false;
    if (speak) Voice.say(`${title}。${text}`);
  },
  closeCard() { $('modal').hidden = true; },
};
