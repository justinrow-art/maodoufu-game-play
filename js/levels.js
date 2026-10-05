// The eight levels. Each level draws into ctx.layer and calls ctx.done(stars) when finished.
// Art comes from image sprites (art/*.webp); liquids, fire, foam and mould growth are drawn in code on top.

// Distance from point p to segment ab.
function segDist(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y;
  const t = clamp(((p.x - a.x) * vx + (p.y - a.y) * vy) / (vx * vx + vy * vy), 0, 1);
  return Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t));
}
const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
// Narration read aloud on a level's fact card (also used by tools/build-voice.mjs).
const factSpeech = lv => lv.fact.title + lv.fact.text;

// Fly a node to (x,y) with a small hop.
function flyTo(ctx, g, x, y, { dur = 450, hop = 60, s } = {}) {
  const x0 = g._x, y0 = g._y, s0 = g._s === undefined ? 1 : g._s, s1 = s === undefined ? s0 : s;
  return ctx.tween(dur, k => place(g, lerp(x0, x, k), lerp(y0, y, k) - Math.sin(k * Math.PI) * hop, lerp(s0, s1, k)), ease.inOut);
}
function setSprite(g, name) {
  const s = SPR[name], im = g.inner && g.inner.querySelector('image');
  if (s && im) im.setAttribute('href', s.src);
}
// Rounded text label, used for names the art itself must not contain (AI images carry no text).
function pill(parent, text, x, y, { size = 22, color = INK } = {}) {
  const w = text.length * size + 28, h = size + 18;
  return art(parent, `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#FFF7E6" stroke="${INK}" stroke-width="3"/>
    <text y="${(size * 0.36).toFixed(1)}" text-anchor="middle" font-size="${size}" font-weight="900" fill="${color}">${text}</text>`, x, y, { 'pointer-events': 'none' });
}
const PRAISE = ['好棒！', '太厲害了！', '做得好！', '真棒！', '哇～'];
const praise = (x, y) => FX.praise(x, y, PRAISE[Math.floor(Math.random() * PRAISE.length)]);
function randInDisc(D, f = 0.7) {
  const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * D.r * f;
  return [D.x + Math.cos(a) * r, D.y + Math.sin(a) * r];
}
let uid = 0;
// Move a round container so its measured circle is centred on (x, y).
function centerDisc(g, x, y) {
  const m = SPR[g._name] && SPR[g._name].disc;
  place(g, m ? x - (m.x - 0.5) * g._w : x, m ? y - (m.y - 0.5) * g._h : y);
}

// Liquid surface inside a round container. fill(f) makes it more opaque as the level rises.
function liquid(parent, D, fill = 'url(#gMilk)') {
  const id = `lq${uid++}`;
  const g = el('g', { 'pointer-events': 'none' }, parent);
  g.innerHTML = `<defs><clipPath id="${id}"><circle cx="${D.x}" cy="${D.y}" r="${D.r}"/></clipPath></defs>
    <g clip-path="url(#${id})">
      <circle class="lq" cx="${D.x}" cy="${D.y}" r="${D.r}" fill="${fill}"/>
      <path class="shine" d="M${D.x - D.r * 0.55} ${D.y - D.r * 0.35} q${D.r * 0.3} ${-D.r * 0.22} ${D.r * 0.62} ${-D.r * 0.12}" stroke="#FFFFFF" stroke-width="${D.r * 0.06}" fill="none" stroke-linecap="round" opacity=".7"/>
    </g>`;
  const c = g.querySelector('.lq'), shine = g.querySelector('.shine');
  return {
    g, clip: id,
    fill(f) { const k = clamp(f, 0, 1); c.setAttribute('opacity', k > 0 ? (0.3 + 0.7 * k).toFixed(2) : 0); shine.setAttribute('opacity', (0.7 * k).toFixed(2)); },
  };
}

// Puffy white tofu-curd blob markup.
function curdBlob(s = 1) {
  return `<g transform="scale(${s})"><ellipse cx="2" cy="6" rx="30" ry="16" fill="#C9B88F" opacity=".35"/>
    <path d="M-28 2 q-6 -16 12 -18 q8 -12 24 -3 q18 -2 18 12 q8 12 -8 16 q-22 7 -40 1 q-12 -3 -6 -8Z" fill="#FFFDF6" stroke="#E6D9B8" stroke-width="2"/>
    <path d="M-14 -7 q9 -5 18 0" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
}

// Vertical thermometer/gauge with a green target zone. Returns set(value).
function gauge(parent, x, top, bottom, { min = 0, max = 1, lo, hi, label = '', labels = [] }) {
  const y = v => lerp(bottom, top, (clamp(v, min, max) - min) / (max - min));
  const g = art(parent, `
    <rect x="-30" y="${top - 18}" width="60" height="${bottom - top + 36}" rx="30" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
    <rect x="-18" y="${y(hi)}" width="36" height="${y(lo) - y(hi)}" rx="8" fill="#9BDB86" stroke="#3E8A3A" stroke-width="2.5"/>
    <circle cx="0" cy="${bottom + 34}" r="34" fill="#FFFFFF" stroke="${INK}" stroke-width="4"/>
    <circle cx="0" cy="${bottom + 34}" r="24" fill="#FF6B57"/>
    <rect class="merc" x="-9" width="18" rx="9" fill="#FF6B57"/>
    <circle cx="-8" cy="${bottom + 26}" r="6" fill="#FFFFFF" opacity=".7"/>
    ${labels.map(([v, t]) => `<text x="-40" y="${y(v) + 7}" text-anchor="end" font-size="20" font-weight="900" fill="${INK}" stroke="#FFF7E6" stroke-width="5" paint-order="stroke">${t}</text>`).join('')}
    ${label ? `<text y="${bottom + 98}" text-anchor="middle" font-size="22" font-weight="900" fill="${INK}" stroke="#FFF7E6" stroke-width="6" paint-order="stroke">${label}</text>` : ''}`, x, 0, { 'pointer-events': 'none' });
  const merc = g.querySelector('.merc');
  return v => { const yy = y(v); merc.setAttribute('y', yy); merc.setAttribute('height', bottom + 20 - yy); };
}

// Flame tongues licking out around the lower rim of a pot. Returns setLevel(0..1).
function rimFire(parent, D) {
  const g = el('g', { 'pointer-events': 'none' }, parent);
  let s = `<ellipse class="glow" cx="${D.x}" cy="${D.y + D.R * 0.15}" rx="${D.R * 1.18}" ry="${D.R * 1.08}" fill="url(#gGlow)"/>`;
  for (let i = 0; i < 9; i++) {
    const a = (20 + i * 17.5) * Math.PI / 180, x = D.x + Math.cos(a) * D.R * 0.97, y = D.y + Math.sin(a) * D.R * 0.97;
    s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 180 / Math.PI - 90).toFixed(1)})"><g class="tongue">
      <path class="flicker" style="animation-delay:${(i * 0.07).toFixed(2)}s" d="M-20 0 q-6 34 20 62 q26 -28 20 -62Z" fill="url(#gFire)"/>
      <path class="flicker" d="M-9 0 q-3 20 9 36 q12 -16 9 -36Z" fill="#FFE27A"/></g></g>`;
  }
  g.innerHTML = s;
  const tongues = [...g.querySelectorAll('.tongue')], glow = g.querySelector('.glow');
  return f => {
    tongues.forEach((t, i) => t.setAttribute('transform', `scale(${(0.25 + f * (0.8 + (i % 3) * 0.15)).toFixed(2)})`));
    glow.setAttribute('opacity', (0.2 + f * 0.8).toFixed(2));
  };
}

// One tofu piece cut from the slab picture, so pieces always match the slab.
// size is the piece's on-screen width; col/row choose which part of the slab it shows.
function tofuPiece(parent, x, y, size, col = 1, row = 0, cols = 4, rows = 2) {
  const s = SPR.tofu_slab;
  const id = `pc${uid++}`;
  const W = size * cols / 0.9, H = s ? W * s.h / s.w : W / 2;
  const cw = (W * 0.9) / cols, ch = (H * 0.9) / rows;
  const px = -W / 2 + W * 0.05 + (col + 0.5) * cw, py = -H / 2 + H * 0.05 + (row + 0.5) * ch;
  const g = el('g', {}, parent);
  const inner = el('g', {}, g);
  inner.innerHTML = `<defs><clipPath id="${id}"><rect x="${-cw / 2 + 2}" y="${-ch / 2 + 2}" width="${cw - 4}" height="${ch - 4}" rx="${cw * 0.12}"/></clipPath></defs>
    <rect x="${-cw / 2 + 4}" y="${-ch / 2 + 8}" width="${cw - 4}" height="${ch - 4}" rx="${cw * 0.12}" fill="#5A3418" opacity=".2"/>
    ${s ? `<g clip-path="url(#${id})"><image href="${s.src}" x="${-W / 2 - px}" y="${-H / 2 - py}" width="${W}" height="${H}" preserveAspectRatio="none"/></g>`
      : `<rect x="${-cw / 2}" y="${-ch / 2}" width="${cw}" height="${ch}" rx="${cw * 0.12}" fill="#FBF4E4" stroke="${INK}" stroke-width="2"/>`}
    <rect x="${-cw / 2 + 2}" y="${-ch / 2 + 2}" width="${cw - 4}" height="${ch - 4}" rx="${cw * 0.12}" fill="none" stroke="#FFFFFF" stroke-width="2" opacity=".6"/>`;
  g.inner = inner; g._w = cw; g._h = ch;
  place(g, x, y);
  return g;
}

const LEVELS = [
  // ---------------------------------------------------------------- 1. 泡黃豆
  {
    key: 'soak', name: '泡黃豆', icon: 'soak', pic: 'bowl_water', bg: 'bg_counter',
    fact: {
      title: '黃豆喝飽水了！',
      text: '小朋友，做豆腐的第一步，就是把黃豆<b>泡水一整個晚上</b>喔（大約 8～12 小時）！黃豆喝飽水以後，會<b>變胖、變軟</b>，等一下就很好磨成豆漿啦！',
    },
    run(ctx) {
      const L = ctx.layer;
      ctx.say('小朋友，我們來泡黃豆囉！把黃豆<em>拖進水碗</em>裡，點一下也可以喔～');
      sprite(L, 'sack_beans', 160, 395, { w: 260 });
      const bowl = sprite(L, 'bowl_water', 660, 430, { w: 470 });
      centerDisc(bowl, 660, 430);
      const D = discOf(bowl);
      const inBowl = el('g', {}, L);
      el('circle', { cx: D.x, cy: D.y, r: D.r, fill: '#6FBFE3', opacity: 0.25, 'pointer-events': 'none' }, L);
      art(L, `<path d="M${-D.r * 0.5} ${-D.r * 0.45} q${D.r * 0.3} ${-D.r * 0.18} ${D.r * 0.62} ${-D.r * 0.08}" stroke="#FFFFFF" stroke-width="9" fill="none" stroke-linecap="round" opacity=".55"/>`, D.x, D.y, { 'pointer-events': 'none' });

      const spots = [[60, 575], [140, 610], [220, 575], [300, 610], [380, 575], [70, 665], [160, 668], [250, 660], [335, 645], [445, 598]];
      let count = 0;
      const total = spots.length;
      let hintOff = ctx.hint(spots[2][0] + 14, spots[2][1] + 12);
      const intoBowl = async b => {
        b._hd.enabled = false;
        const [tx, ty] = randInDisc(D, 0.72);
        await flyTo(ctx, b, tx, ty, { hop: 110, s: 0.95 });
        inBowl.appendChild(b);
        Snd.plop();
        FX.splash(tx, ty, { color: '#BFE7F7', n: 9 });
        Juice.pop(b, 0.3);
        count++;
        ctx.progress(count / total);
        if (count % 4 === 0 && count < total) praise(tx, ty - 80);
        if (count === total) night();
      };
      spots.forEach(([x, y], i) => {
        const b = sprite(L, 'bean_dry', x, y, { w: 66 });
        place(b, x, y, 1, (i * 47) % 70 - 35);
        b._hd = Input.on(b, {
          start() { if (hintOff) { hintOff(); hintOff = null; } L.appendChild(b); place(b, b._x, b._y, 1.3); Snd.pop(); Juice.pop(b); },
          move(p) { place(b, p.x, p.y, 1.3); },
          end(p, e, moved) {
            if (!b._hd.enabled) return;
            if (!moved || Math.hypot(p.x - D.x, p.y - D.y) < D.R) intoBowl(b);
            else flyTo(ctx, b, x, y, { hop: 20, s: 1 });
          },
        });
      });

      async function night() {
        await ctx.wait(500);
        ctx.say('黃豆要泡<em>一整個晚上</em>喔～噓，晚安囉！');
        const dark = el('rect', { x: 0, y: 0, width: 1000, height: 700, fill: '#14204A', opacity: 0 }, layers.fx);
        const sky = art(layers.fx, `<circle r="56" fill="#FFF4C4"/><circle cx="22" cy="-14" r="50" fill="#14204A"/>
          ${[[-200, 40], [160, -30], [260, 70], [-320, -10], [380, 20], [-90, -60]].map(([x, y], i) => `<g class="twinkle" style="animation-delay:${i * 0.3}s" transform="translate(${x} ${y})">${Art.sparkleStar(11, '#FFF6C8')}</g>`).join('')}`, 500, 230, { opacity: 0 });
        await ctx.tween(900, k => { dark.setAttribute('opacity', k * 0.62); sky.setAttribute('opacity', k); });
        for (let i = 0; i < 3; i++) { FX.float(D.x + 40 + i * 40, D.y - 60 - i * 30, 'Z', '#FFFFFF'); await ctx.wait(450); }
        await ctx.wait(700);
        await ctx.tween(900, k => { dark.setAttribute('opacity', (1 - k) * 0.62); sky.setAttribute('opacity', 1 - k); });
        dark.remove(); sky.remove();
        ctx.say('哇～天亮了！黃豆喝飽水，變得<em>胖嘟嘟</em>的耶！');
        const beans = [...inBowl.children];
        for (let i = 0; i < beans.length; i++) {
          const b = beans[i];
          setSprite(b, 'bean_soaked');
          Snd.tone(500 + i * 60, 0.12, { type: 'triangle', vol: 0.15, slide: 900 + i * 60 });
          ctx.tween(380, k => place(b, b._x, b._y, lerp(0.95, 1.3, k)), ease.back);
          Juice.pop(b, 0.25);
          await ctx.wait(110);
        }
        Mascot.cheer('胖嘟嘟！');
        await ctx.wait(1700);
        ctx.done(3);
      }
    },
  },

  // ---------------------------------------------------------------- 2. 磨豆漿
  {
    key: 'grind', name: '磨豆漿', icon: 'grind', pic: 'mill_top', bg: 'bg_counter',
    fact: {
      title: '磨出白白的豆漿！',
      text: '泡好的黃豆一邊加水、一邊放進<b>石磨</b>，轉呀轉、轉呀轉，黃豆就被磨得碎碎的，流出白白的<b>生豆漿</b>啦！',
    },
    run(ctx) {
      const L = ctx.layer;
      ctx.say('我們來磨豆漿吧！按住<em>石磨</em>，<em>轉圈圈</em>～一圈、兩圈，要轉 4 圈喔！');
      const CX = 400, CY = 440;
      const base = sprite(L, 'mill_base', 0, 0, { h: 480 });
      centerDisc(base, CX, CY);
      const D = discOf(base);
      const bk = sprite(L, 'bucket', 850, 585, { h: 210 });
      const BD = discOf(bk);
      const milkIn = liquid(L, BD);
      milkIn.fill(0);
      // milk running round the groove and out of the spout
      const C = 2 * Math.PI * D.groove;
      const groove = el('circle', { cx: D.x, cy: D.y, r: D.groove, fill: 'none', stroke: '#FFFDF5', 'stroke-width': D.R * 0.1, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${C}`, opacity: 0.95, 'pointer-events': 'none' }, L);
      const spoutX = base._x + base._w / 2 - 14;
      const stream = el('path', { d: `M${spoutX} ${D.y} Q${BD.x - 20} ${D.y - 10} ${BD.x - 10} ${BD.y - 10}`, stroke: '#FFFDF5', 'stroke-width': 12, fill: 'none', 'stroke-linecap': 'round', opacity: 0, 'pointer-events': 'none' }, L);
      // upper stone rotates about the mill centre
      const top = el('g', {}, L);
      // the upper stone covers the base's centre stone and leaves the milk groove visible
      const tm = SPR.mill_top && SPR.mill_top.disc;
      const stoneR = D.R * 0.56;
      const st = sprite(top, 'mill_top', 0, 0, { w: tm ? stoneR / tm.r : stoneR * 2 / 0.62 });
      if (tm) place(st, -(tm.x - 0.5) * st._w, -(tm.y - 0.5) * st._h);
      const beans = el('g', {}, top);
      for (let i = 0; i < 7; i++) {
        const b = sprite(beans, 'bean_soaked', -stoneR * 0.55 + (i % 4) * 22, -stoneR * 0.5 + Math.floor(i / 4) * 22, { w: 30 });
        place(b, b._x, b._y, 1, i * 40);
      }
      const ring = el('circle', { cx: CX, cy: CY, r: stoneR * 1.45, fill: 'none', stroke: '#FF9F43', 'stroke-width': 6, 'stroke-dasharray': '16 14', 'pointer-events': 'none' }, L);
      let theta = 0;
      const draw = () => top.setAttribute('transform', `translate(${CX} ${CY}) rotate(${theta * 180 / Math.PI})`);
      draw();
      let hintOff = ctx.hint(CX + stoneR * 1.3, CY + 10);

      let total = 0, quarter = 0, turns = 0, finished = false, grab = 0;
      const goal = Math.PI * 2 * 4;
      const ang = p => Math.atan2(p.y - CY, p.x - CX);
      Input.stageHandler = {
        start(p) { grab = ang(p) - theta; },
        move(p) {
          if (finished) return;
          const d = wrapAngle(ang(p) - grab - theta);
          if (Math.abs(d) > 1.2) { grab = ang(p) - theta; return; }
          theta += d; total += Math.abs(d);
          draw();
          if (hintOff && total > 0.8) { hintOff(); hintOff = null; ring.remove(); }
          const f = clamp(total / goal, 0, 1);
          ctx.progress(f);
          groove.setAttribute('stroke-dasharray', `${C * Math.min(1, f * 2.5)} ${C}`);
          const q = Math.floor(total / (Math.PI / 2));
          if (q > quarter) {
            quarter = q;
            Snd.grind();
            stream.setAttribute('opacity', 0.95);
            milkIn.fill(0.15 + f * 0.85);
            const keep = Math.round((1 - f) * 7);
            [...beans.children].forEach((b, i) => b.setAttribute('opacity', i < keep ? 1 : 0));
            FX.splash(BD.x - 6, BD.y - 6, { color: '#FFFDF5', n: 4, power: 0.5, ring: false });
            Juice.pop(bk, 0.06);
          }
          const t = Math.floor(total / (Math.PI * 2));
          if (t > turns) {
            turns = t;
            Juice.pop(st, 0.06);
            if (t < 4) FX.praise(CX, CY - stoneR - 60, `第 ${t} 圈！`);
          }
          if (f >= 1) finish();
        },
      };
      async function finish() {
        finished = true;
        Input.stageHandler = null;
        await ctx.wait(300);
        stream.setAttribute('opacity', 0);
        Mascot.cheer('磨好了！');
        ctx.say('哇～好棒！桶子裡裝滿白白的<em>生豆漿</em>囉！');
        await ctx.wait(2000);
        ctx.done(3);
      }
    },
  },

  // ---------------------------------------------------------------- 3. 過濾、煮豆漿
  {
    key: 'boil', name: '濾渣煮漿', icon: 'boil', pic: 'wok', bg: 'bg_counter',
    fact: {
      title: '豆漿煮滾了！',
      text: '小朋友記住喔：生豆漿要先用<b>布袋過濾</b>，留在布袋裡的是<b>豆渣</b>。然後一定要把豆漿<b>煮滾</b>，煮熟了才可以吃！冒出來的泡泡，也要撈乾淨喔。',
    },
    async run(ctx) {
      const L = ctx.layer;
      // ---- phase A: squeeze the filter bag
      ctx.say('豆漿裡還有豆渣喔！小朋友，<em>捏一捏布袋</em>，把豆漿擠出來～');
      const bk = sprite(L, 'bucket', 500, 540, { h: 250 });
      const BD = discOf(bk);
      const milk = liquid(L, BD);
      milk.fill(0.05);
      el('path', { d: 'M500 0 V150', stroke: '#B48A58', 'stroke-width': 5 }, L);
      const pivot = el('g', {}, L);
      place(pivot, 500, 150);
      const bag = sprite(pivot, 'cloth_bag', 0, 140, { h: 300 });
      let squeezes = 0, swing = 0, swingV = 0;
      const need = 6;
      let hintOff = ctx.hint(540, 320);
      const stopSwing = ctx.loop(dt => {
        swingV += (-swing * 60 - swingV * 4) * dt;
        swing += swingV * dt;
        place(pivot, 500, 150, 1, swing);
      });
      await new Promise(res => {
        const squeeze = () => {
          if (squeezes >= need) return;
          if (hintOff) { hintOff(); hintOff = null; }
          squeezes++;
          swingV += (squeezes % 2 ? 1 : -1) * 70;
          Juice.pop(bag, 0.22, 500);
          Snd.squish(); setTimeout(() => Snd.drip(), 180);
          for (let i = 0; i < 3; i++) setTimeout(() => FX.splash(500 + (Math.random() - 0.5) * 60, BD.y - 20, { color: '#FFFDF5', n: 4, power: 0.6, ring: i === 0 }), 120 + i * 90);
          milk.fill(0.05 + 0.9 * squeezes / need);
          ctx.progress(squeezes / need * 0.4);
          if (squeezes === 3) praise(700, 330);
          if (squeezes === need) { h.enabled = false; res(); }
        };
        const h = Input.on(bag, { tap: squeeze, end(p, e, moved) { if (moved) squeeze(); } });
      });
      await ctx.wait(400);
      stopSwing();
      await ctx.tween(600, k => place(pivot, 500 - k * 330, 150 - k * 40, 1, -k * 10), ease.inOut);
      pivot.remove();
      const okara = sprite(L, 'okara_bowl', 170, 520, { w: 210 });
      pill(okara, '豆渣', 0, okara._h / 2 + 10);
      place(okara, 170, 520, 0.01);
      await ctx.tween(500, k => place(okara, 170, 520, k), ease.back);
      Snd.pop();
      ctx.say('哇～豆漿流下來了！留在布袋裡的，叫做<em>豆渣</em>喔！');
      await ctx.wait(2400);

      // ---- phase B: boil in the wok
      await ctx.tween(400, k => L.setAttribute('opacity', 1 - k));
      L.innerHTML = ''; L.setAttribute('opacity', 1);
      setBg('bg_stovetop');
      ctx.say('接下來要<em>煮豆漿</em>囉！把<em>木柴</em>拖到鍋子旁邊，火就會變大喔～');
      const fireLayer = el('g', {}, L);
      const wok = sprite(L, 'wok', 470, 430, { h: 470 });
      const D = discOf(wok);
      const setFire = rimFire(fireLayer, D);
      let fireLevel = 0.15;
      setFire(fireLevel);
      const soy = liquid(L, D);
      soy.fill(1);
      const bubbles = el('g', { 'clip-path': `url(#${soy.clip})` }, L);
      const steamG = art(L, Art.steam(4, 70, 70), D.x, D.y - D.r * 0.5, { opacity: 0, 'pointer-events': 'none' });
      const setTemp = gauge(L, 940, 200, 440, { min: 20, max: 100, lo: 96, hi: 100, labels: [[100, '100°'], [20, '20°']] });
      let temp = 20;
      setTemp(temp);
      const pile = sprite(L, 'firewood_pile', 120, 590, { w: 210 });
      hintOff = ctx.hint(130, 590);
      let logs = 0;
      const needLogs = 4;
      await new Promise(res => {
        let drag = null;
        const feed = async lg => {
          const a = (40 + logs * 30) * Math.PI / 180;
          await flyTo(ctx, lg, D.x + Math.cos(a) * D.R * 0.95, D.y + Math.sin(a) * D.R * 0.95, { hop: 40, s: 0.7 });
          lg.remove();
          logs++;
          Snd.crackle(); setTimeout(() => Snd.crackle(), 120);
          FX.burst(D.x, D.y + D.R, { n: 10, colors: ['#FFD84A', '#FF7A1A', '#FFB45C'], spread: 80 });
          Juice.pop(wok, 0.05);
          fireLevel = 0.15 + logs * 0.21;
          setFire(fireLevel);
          ctx.progress(0.4 + 0.3 * logs / needLogs);
          if (logs >= needLogs) { h.enabled = false; res(); }
        };
        const h = Input.on(pile, {
          start(p) {
            if (hintOff) { hintOff(); hintOff = null; }
            Juice.pop(pile, 0.1);
            drag = sprite(L, 'log', p.x, p.y, { w: 130, attrs: { 'pointer-events': 'none' } });
          },
          move(p) { if (drag) place(drag, p.x, p.y); },
          end(p, e, moved) {
            const lg = drag; drag = null;
            if (!lg) return;
            if (!moved || Math.hypot(p.x - D.x, p.y - D.y) < D.R + 90) feed(lg);
            else lg.remove();
          },
        });
      });
      ctx.say('火好旺喔！豆漿越來越燙了～');
      await new Promise(res => {
        ctx.loop(dt => {
          temp = Math.min(100, temp + dt * 26);
          setTemp(temp);
          steamG.setAttribute('opacity', clamp((temp - 50) / 40, 0, 1));
          if (temp > 50 && Math.random() < dt * (temp / 9)) {
            const [bx, by] = randInDisc(D, 0.85);
            const c = el('circle', { cx: bx, cy: by, r: 4 + Math.random() * 9, fill: 'rgba(255,255,255,.85)', stroke: '#E2D6B6', 'stroke-width': 2 }, bubbles);
            setTimeout(() => c.remove(), 450);
            if (Math.random() < 0.3) Snd.bubble();
          }
          ctx.progress(0.7 + 0.1 * (temp - 20) / 80);
          if (temp >= 100) { res(); return false; }
        });
      });
      ctx.say('咕嘟咕嘟～豆漿滾了！冒出好多<em>泡泡</em>，快<em>點一點</em>，把泡泡撈掉吧！');
      const foams = [];
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2 + 0.4, r = D.r * (i % 2 ? 0.55 : 0.3);
        const f = art(L, `<g class="pulse">
          <ellipse cx="2" cy="6" rx="46" ry="24" fill="#C9B88F" opacity=".25"/>
          ${[[-22, 0, 20], [2, -8, 24], [24, 2, 18], [-4, 12, 16], [14, 14, 13]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#FFFFFF" stroke="#E6D9B8" stroke-width="2"/>`).join('')}
          <circle cx="-4" cy="-14" r="6" fill="#EAF7FF"/></g>`, D.x + Math.cos(a) * r, D.y + Math.sin(a) * r);
        place(f, f._x, f._y, 0.01);
        ctx.tween(400 + i * 80, k => place(f, f._x, f._y, k), ease.back);
        foams.push(f);
      }
      hintOff = ctx.hint(foams[0]._x + 10, foams[0]._y + 10);
      const skim = sprite(L, 'skimmer', 800, 615, { w: 190, attrs: { 'pointer-events': 'none' } });
      let left = foams.length;
      await new Promise(res => {
        foams.forEach(f => {
          const h = Input.on(f, {
            tap: async () => {
              if (!h.enabled) return;
              h.enabled = false;
              if (hintOff) { hintOff(); hintOff = null; }
              const [sx, sy] = tipAt(skim, f._x, f._y);
              await flyTo(ctx, skim, sx, sy, { dur: 220, hop: 20 });
              Juice.wobble(skim, 14, 300);
              Snd.pop();
              FX.splash(f._x, f._y, { color: '#FFFFFF', n: 6, power: 0.6 });
              await ctx.tween(180, k => { f.setAttribute('opacity', 1 - k); place(f, f._x, f._y, 1 - k * 0.6); });
              f.remove();
              left--;
              ctx.progress(0.8 + 0.2 * (1 - left / foams.length));
              if (left === 3) praise(D.x, D.y - D.R - 30);
              if (left === 0) res();
            },
          });
        });
      });
      await flyTo(ctx, skim, 800, 615, { dur: 300 });
      Mascot.cheer('煮熟了！');
      ctx.say('耶～豆漿<em>煮熟</em>了，好香好香喔！');
      await ctx.wait(1900);
      ctx.done(3);
    },
  },

  // ---------------------------------------------------------------- 4. 點滷
  {
    key: 'curd', name: '點滷', icon: 'curd', pic: 'brine_bottle', bg: 'bg_counter',
    fact: {
      title: '豆漿變豆花了！',
      text: '在熱熱的豆漿裡<b>慢慢加入鹽滷</b>（也可以用石膏），再輕輕攪一攪，豆漿裡的<b>蛋白質</b>就會凝結起來，變成一朵一朵的<b>豆花</b>！這個步驟叫做「<b>點滷</b>」喔。',
    },
    async run(ctx) {
      const L = ctx.layer;
      ctx.say('現在要點滷囉！<em>按住</em>鹽滷瓶慢慢倒，指針到<em>綠色</em>就放手喔！');
      const pot = sprite(L, 'clay_pot', 430, 440, { h: 500 });
      const D = discOf(pot);
      const soy = liquid(L, D);
      soy.fill(1);
      const whey = liquid(L, D, 'url(#gWhey)');
      whey.fill(1);
      whey.g.setAttribute('opacity', 0);
      const curdG = el('g', { 'clip-path': `url(#${soy.clip})`, 'pointer-events': 'none' }, L);
      const curds = [];
      for (let i = 0; i < 20; i++) {
        const [cx, cy] = randInDisc(D, 0.82);
        curds.push(art(curdG, curdBlob(0.8 + Math.random() * 0.7), cx, cy, { opacity: 0 }));
      }
      art(L, Art.steam(4, 90, 70), D.x, D.y - D.r * 0.4, { 'pointer-events': 'none' });

      const GX = 950, GT = 190, GB = 470;
      const zoneLo = 0.5, zoneHi = 0.8;
      const setGauge = gauge(L, GX, GT, GB, { min: 0, max: 1, lo: zoneLo, hi: zoneHi, label: '鹽滷' });
      setGauge(0);
      const bottle = sprite(L, 'brine_bottle', 790, 330, { h: 230 });
      pill(bottle.inner, '鹽滷', 0, bottle._h * 0.15, { size: 22, color: '#2F5F9E' });
      let hintOff = ctx.hint(800, 360);
      let level = 0, holding = false, attempts = 0, over = false, poured = false;
      const tooMuch = () => {
        over = true; attempts++;
        Snd.wrong();
        FX.shake(6);
        ctx.say('哎呀，<em>倒太多</em>囉！鹽滷太多，豆腐會變苦苦的。沒關係，我們再試一次～');
        ctx.later(1200, () => { level = 0; over = false; });
      };
      await new Promise(res => {
        let dripT = 0;
        ctx.loop(dt => {
          const target = holding ? -65 : 0;
          bottle._r = lerp(bottle._r || 0, target, Math.min(1, dt * 10));
          place(bottle, 790, 330, 1, bottle._r);
          if (holding && bottle._r < -40) {
            level += dt * 0.25;
            dripT += dt;
            if (dripT > 0.1) {
              dripT = 0; Snd.drip();
              const mx = 790 - bottle._h * 0.42, my = 330 - bottle._h * 0.18;
              FX.drops(mx, my, { n: 1, color: '#BFE7F7', spread: 6, fall: 100, dir: -0.8 });
              if (Math.random() < 0.3) FX.ring(mx - 60, my + 120, { r: 24, color: '#FFFFFF' });
            }
            if (level > 0.98 && !over) { holding = false; tooMuch(); }
          }
          setGauge(level);
          if (poured) return Math.abs(bottle._r) > 1;
          ctx.progress(clamp(level, 0, 1) * 0.5);
        });
        const h = Input.on(bottle, {
          start() { if (hintOff) { hintOff(); hintOff = null; } if (!over) holding = true; },
          end() {
            if (!holding) return;
            holding = false;
            if (level >= zoneLo && level <= zoneHi) { h.enabled = false; poured = true; ctx.progress(0.5); res(); }
            else if (level < zoneLo) { ctx.say('還<em>不夠</em>喔，再按住倒一點點～'); }
            else tooMuch();
          },
        });
      });
      FX.praise(GX - 140, GT + 40, '剛剛好！');
      Snd.sparkle();
      ctx.say('剛剛好！你好厲害！現在拿木勺，<em>輕輕繞圈攪一攪</em>～');
      const paddle = sprite(L, 'wooden_paddle', D.x + D.r * 0.5, D.y, { h: 300, attrs: { 'pointer-events': 'none' } });
      const swirl = el('circle', { cx: D.x, cy: D.y, r: D.r * 0.62, fill: 'none', stroke: '#FF9F43', 'stroke-width': 6, 'stroke-dasharray': '16 14', 'pointer-events': 'none' }, L);
      hintOff = ctx.hint(D.x + D.r * 0.6, D.y + 20);
      const ang = p => Math.atan2(p.y - D.y, p.x - D.x);
      let prev = 0, total = 0, tick = 0;
      const goal = Math.PI * 3;
      await new Promise(res => {
        Input.stageHandler = {
          start(p) { prev = ang(p); },
          move(p) {
            const dx = p.x - D.x, dy = p.y - D.y, dist = Math.min(Math.hypot(dx, dy), D.r * 0.85), a = Math.atan2(dy, dx);
            const [px, py] = tipAt(paddle, D.x + Math.cos(a) * dist, D.y + Math.sin(a) * dist);
            place(paddle, px, py);
            const d = wrapAngle(ang(p) - prev); prev = ang(p);
            if (Math.abs(d) > 1.2) return;
            total += Math.abs(d);
            if (hintOff && total > 0.6) { hintOff(); hintOff = null; swirl.remove(); }
            const f = clamp(total / goal, 0, 1);
            curds.forEach((c, i) => {
              const o = clamp(f * 1.5 - i / curds.length * 0.5, 0, 1);
              if (o > 0 && c.getAttribute('opacity') === '0') Juice.pop(c, 0.3);
              c.setAttribute('opacity', o);
            });
            whey.g.setAttribute('opacity', f * 0.95);
            ctx.progress(0.5 + f * 0.5);
            if (Math.floor(total / 0.8) > tick) { tick = Math.floor(total / 0.8); Snd.squish(); }
            if (f >= 1) { Input.stageHandler = null; res(); }
          },
        };
      });
      Mascot.cheer('變豆花了！', { pose: 'wow' });
      ctx.say('哇～豆漿變成一朵一朵的<em>豆花</em>了！旁邊黃黃的水，叫做<em>豆清</em>喔！');
      await ctx.wait(2400);
      ctx.done(attempts === 0 ? 3 : 2);
    },
  },

  // ---------------------------------------------------------------- 5. 壓豆腐
  {
    key: 'press', name: '壓豆腐', icon: 'press', pic: 'curds_in_mold', bg: 'bg_counter',
    fact: {
      title: '豆花壓成豆腐了！',
      text: '把豆花舀進<b>鋪著布的木框</b>，包好、蓋上木板，再用<b>重重的石頭壓一壓</b>，把水擠出來，豆花就變成一整塊<b>豆腐</b>啦！做毛豆腐，要用比較<b>結實</b>的豆腐喔。',
    },
    async run(ctx) {
      const L = ctx.layer;
      ctx.say('我們來做豆腐囉！點一點<em>缸子</em>，把豆花舀進木框裡～');
      const vat = sprite(L, 'clay_pot', 180, 470, { h: 300 });
      const VD = discOf(vat);
      const vw = liquid(L, VD, 'url(#gWhey)');
      vw.fill(1);
      const vc = el('g', { 'clip-path': `url(#${vw.clip})`, 'pointer-events': 'none' }, L);
      for (let i = 0; i < 9; i++) { const [x, y] = randInDisc(VD, 0.8); art(vc, curdBlob(0.8 + Math.random() * 0.4), x, y); }
      const MX = 640, MY = 440;
      const mold = sprite(L, 'mold_box', MX, MY, { h: 400 });
      const filled = sprite(L, 'curds_in_mold', MX, MY, { h: 400, attrs: { opacity: 0, 'pointer-events': 'none' } });
      const skim = sprite(L, 'skimmer', 360, 600, { w: 200, attrs: { 'pointer-events': 'none' } });
      const scoopCurd = art(skim, curdBlob(0.9), (TIP.skimmer[0] - 0.5) * skim._w, (TIP.skimmer[1] - 0.5) * skim._h, { opacity: 0 });
      let hintOff = ctx.hint(190, 480);
      let scoops = 0;
      const needScoops = 4;
      await new Promise(res => {
        let busy = false;
        const scoop = async () => {
          if (busy || scoops >= needScoops) return;
          busy = true;
          if (hintOff) { hintOff(); hintOff = null; }
          await flyTo(ctx, skim, ...tipAt(skim, VD.x, VD.y), { dur: 250, hop: 20 });
          scoopCurd.setAttribute('opacity', 1);
          Snd.squish();
          FX.splash(VD.x, VD.y, { color: '#F3E7B8', n: 5, power: 0.5 });
          await flyTo(ctx, skim, ...tipAt(skim, MX, MY), { dur: 420, hop: 90 });
          scoopCurd.setAttribute('opacity', 0);
          Snd.plop();
          FX.splash(MX, MY, { color: '#FFFDF5', n: 8, power: 0.7 });
          Juice.pop(mold, 0.05);
          scoops++;
          filled.setAttribute('opacity', scoops / needScoops);
          ctx.progress(scoops / needScoops * 0.35);
          busy = false;
          if (scoops >= needScoops) { h.enabled = false; res(); }
        };
        const h = Input.on(vat, { tap: scoop, end(p, e, moved) { if (moved) scoop(); } });
      });
      await flyTo(ctx, skim, 360, 760, { dur: 300 });
      skim.remove();
      // lid drops on
      const lid = sprite(L, 'press_lid', MX, MY, { h: 360, attrs: { opacity: 0, 'pointer-events': 'none' } });
      await ctx.tween(380, k => { lid.setAttribute('opacity', k); place(lid, MX, MY - 120 * (1 - k), lerp(1.3, 1, k)); }, ease.out);
      Snd.thud(); FX.shake(8); Juice.pop(mold, 0.06);
      ctx.say('嘿咻！把大<em>石頭</em>拖到木板上，再<em>點石頭</em>，用力壓一壓！');
      const stone = sprite(L, 'press_stone', 900, 590, { w: 190 });
      hintOff = ctx.hint(905, 600);
      await new Promise(res => {
        const h = Input.on(stone, {
          start() { if (hintOff) { hintOff(); hintOff = null; } Juice.pop(stone, 0.1); },
          move(p) { place(stone, p.x, p.y); },
          end: async (p, e, moved) => {
            if (!moved || Math.hypot(p.x - MX, p.y - MY) < 240) {
              h.enabled = false;
              await flyTo(ctx, stone, MX, MY - 10, { dur: 400, hop: 60 });
              Snd.thud(); FX.shake(10);
              res();
            } else flyTo(ctx, stone, 900, 590, { hop: 20 });
          },
        });
      });
      let presses = 0;
      const needPress = 5;
      hintOff = ctx.hint(MX + 10, MY - 10);
      await new Promise(res => {
        let busy = false;
        const press = async () => {
          if (busy) return;
          busy = true;
          if (hintOff) { hintOff(); hintOff = null; }
          presses++;
          Juice.pop(stone, 0.22, 380);
          Juice.pop(lid, 0.04, 380);
          Snd.squish(); FX.shake(6);
          [[-200, 0], [200, 0], [0, -200], [0, 200]].forEach(([dx, dy]) => FX.splash(MX + dx, MY + dy, { color: '#9FD8F0', n: 5, power: 0.6, ring: false }));
          ctx.progress(0.35 + 0.45 * presses / needPress);
          if (presses === 3) praise(MX, MY - 230);
          await ctx.wait(330);
          busy = false;
          if (presses >= needPress) { h.enabled = false; res(); }
        };
        const h = Input.on(stone, { tap: press, end(p, e, moved) { if (moved) press(); } });
      });
      await ctx.wait(300);
      Snd.whoosh();
      await ctx.tween(500, k => {
        place(stone, MX + 400 * k, MY - 100 * k);
        place(lid, MX - 420 * k, MY - 60 * k);
        [stone, lid, filled].forEach(g => g.setAttribute('opacity', 1 - k));
      });
      const slab = sprite(L, 'tofu_slab', MX, MY, { w: 330 });
      place(slab, MX, MY, 0.01);
      await ctx.tween(600, k => place(slab, MX, MY - k * 10, k), ease.back);
      ctx.progress(1);
      FX.burst(MX, MY, { n: 16, spread: 140 });
      Mascot.cheer('豆腐做好了！');
      ctx.say('哇～一大塊<em>豆腐</em>做好了！你好棒喔！');
      await ctx.wait(2200);
      ctx.done(3);
    },
  },

  // ---------------------------------------------------------------- 6. 切塊、接菌、排上竹架
  {
    key: 'cut', name: '切塊排架', icon: 'cut', pic: 'tofu_slab', bg: 'bg_counter',
    fact: {
      title: '排好隊等長毛！',
      text: '豆腐切成小塊，刷上<b>毛黴菌</b>（是一種看不見的好菌喔），再排在<b>竹架或稻草</b>上。每一塊中間都要<b>留空隙</b>，讓空氣跑來跑去，毛毛才會長得好！',
    },
    async run(ctx) {
      const L = ctx.layer;
      ctx.say('要把豆腐切成小塊囉！手指按住，<em>順著虛線</em>滑過去，咻～');
      const SX = 350, SY = 440;
      const slab = sprite(L, 'tofu_slab', SX, SY, { w: 560 });
      const W = slab._w * 0.9, H = slab._h * 0.9, x0 = SX - W / 2, y0 = SY - H / 2;
      const lines = [];
      [0.25, 0.5, 0.75].forEach(u => lines.push({ a: { x: x0 + u * W, y: y0 }, b: { x: x0 + u * W, y: y0 + H } }));
      lines.push({ a: { x: x0, y: y0 + H / 2 }, b: { x: x0 + W, y: y0 + H / 2 } });
      const lineG = el('g', { 'pointer-events': 'none' }, L);
      lines.forEach(l => {
        l.e = el('line', { x1: l.a.x, y1: l.a.y, x2: l.b.x, y2: l.b.y, stroke: '#FF6B57', 'stroke-width': 6, 'stroke-dasharray': '14 10', 'stroke-linecap': 'round' }, lineG);
        l.cut = false;
      });
      const knife = sprite(L, 'knife', 860, 470, { h: 260, attrs: { 'pointer-events': 'none' } });
      let hintOff = ctx.hint(lines[0].a.x + 10, lines[0].a.y + 20);
      let cuts = 0;
      await new Promise(res => {
        let path = [];
        Input.stageHandler = {
          start(p) { path = [p]; place(knife, ...tipAt(knife, p.x, p.y)); if (hintOff) { hintOff(); hintOff = null; } },
          move(p) { path.push(p); place(knife, ...tipAt(knife, p.x, p.y)); },
          end() {
            lines.forEach(l => {
              if (l.cut) return;
              let hits = 0;
              for (let i = 0; i <= 10; i++) {
                const q = { x: lerp(l.a.x, l.b.x, i / 10), y: lerp(l.a.y, l.b.y, i / 10) };
                if (path.some((pp, j) => j > 0 && segDist(q, path[j - 1], pp) < 40)) hits++;
              }
              if (hits >= 7) {
                l.cut = true; cuts++;
                Snd.chop(); FX.shake(5);
                l.e.setAttribute('stroke', INK); l.e.setAttribute('stroke-dasharray', 'none'); l.e.setAttribute('stroke-width', 4);
                FX.burst((l.a.x + l.b.x) / 2, (l.a.y + l.b.y) / 2, { n: 8, spread: 60 });
                ctx.progress(cuts / lines.length * 0.3);
              }
            });
            path = [];
            if (cuts === lines.length) { Input.stageHandler = null; res(); }
          },
        };
      });
      await ctx.tween(300, k => knife.setAttribute('opacity', 1 - k));
      knife.remove();
      // swap the slab for 8 pieces cut from the same picture, then spread them apart
      const pw = W / 4;
      slab.remove(); lineG.remove();
      const pieces = [];
      for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
        const g = tofuPiece(L, x0 + (col + 0.5) * pw, y0 + (row + 0.5) * (H / 2), pw, col, row);
        g._col = col; g._row = row;
        pieces.push(g);
      }
      Snd.whoosh();
      await ctx.tween(500, k => pieces.forEach(g => place(g,
        x0 + (g._col + 0.5) * pw + (g._col - 1.5) * 22 * k,
        y0 + (g._row + 0.5) * (H / 2) + (g._row - 0.5) * 26 * k)), ease.back);
      praise(SX, y0 - 40);

      ctx.say('幫每一塊豆腐<em>刷上毛黴菌</em>吧！<em>點一點</em>豆腐，刷刷刷～');
      const bowl = sprite(L, 'spore_bowl', 850, 600, { w: 200 });
      pill(bowl, '毛黴菌水', 0, bowl._h / 2 + 4, { size: 20 });
      const brush = sprite(L, 'brush', 860, 470, { h: 190, attrs: { 'pointer-events': 'none' } });
      let dabbed = 0;
      hintOff = ctx.hint(pieces[5]._x + 10, pieces[5]._y);
      await new Promise(res => {
        let busy = false;
        pieces.forEach(g => {
          g._hd = Input.on(g, {
            tap: async () => {
              if (busy || g._dab) return;
              busy = true; g._dab = true;
              if (hintOff) { hintOff(); hintOff = null; }
              await flyTo(ctx, brush, ...tipAt(brush, g._x, g._y), { dur: 280, hop: 40 });
              Juice.wobble(brush, 22, 420);
              Juice.pop(g, 0.12);
              Snd.sparkle();
              const sp = el('g', { fill: '#8E8A82', opacity: 0.8, 'pointer-events': 'none' }, g);
              for (let i = 0; i < 12; i++) el('circle', { cx: (Math.random() - 0.5) * g._w * 0.8, cy: (Math.random() - 0.5) * g._h * 0.8, r: 1.8 }, sp);
              FX.burst(g._x, g._y, { n: 6, spread: 50, colors: ['#FFFFFF', '#E6E2D8', '#FFD84A'] });
              await ctx.wait(300);
              dabbed++;
              ctx.progress(0.3 + 0.3 * dabbed / 8);
              busy = false;
              if (dabbed === 8) res();
            },
            end(p, e, moved) { if (moved) this.tap(); },
          });
        });
      });
      await ctx.tween(400, k => { bowl.setAttribute('opacity', 1 - k); brush.setAttribute('opacity', 1 - k); });
      bowl.remove(); brush.remove();

      ctx.say('把豆腐<em>排到竹架</em>上，記得中間要<em>留空隙</em>喔！拖過去或點一下都可以～');
      // gather the pieces on the left to make room for a big tray
      const gx = 290, gy = 450, gs = 0.8, gap = pw * gs + 14;
      await ctx.tween(450, k => pieces.forEach(g => place(g,
        lerp(g._x, gx + (g._col - 1.5) * gap, k), lerp(g._y, gy + (g._row - 0.5) * gap, k), lerp(1, gs, k))), ease.inOut);
      const TX = 775, TY = 450;
      const tray = sprite(L, 'straw_tray', TX, TY, { w: 420, attrs: { opacity: 0 } });
      L.insertBefore(tray, L.firstChild);
      await ctx.tween(400, k => { tray.setAttribute('opacity', k); place(tray, TX, TY, lerp(0.8, 1, k)); }, ease.back);
      const inner = tray._w * 0.78, step = inner / 4;
      const slots = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
        slots.push({ x: TX - inner / 2 + (c + 0.5) * step, y: TY - step * 0.75 + r * step * 1.5, used: false });
      }
      const pieceScale = (step - 16) / pw;
      let placed = 0;
      hintOff = ctx.hint(pieces[3]._x + 10, pieces[3]._y);
      await new Promise(res => {
        pieces.forEach(g => {
          g._hd.enabled = false;
          const home = { x: g._x, y: g._y };
          const put = async slot => {
            slot.used = true; h.enabled = false;
            await flyTo(ctx, g, slot.x, slot.y, { hop: 60, s: pieceScale });
            Snd.pop(); Juice.pop(g, 0.2);
            FX.ring(slot.x, slot.y, { r: 36, color: '#FFE9A0' });
            placed++;
            ctx.progress(0.6 + 0.4 * placed / 8);
            if (placed === 4) praise(TX, TY - 190);
            if (placed === 8) res();
          };
          const h = Input.on(g, {
            start() { if (hintOff) { hintOff(); hintOff = null; } L.appendChild(g); Juice.pop(g, 0.1); },
            move(p) { place(g, p.x, p.y, 0.8); },
            end(p, e, moved) {
              if (!h.enabled) return;
              const free = slots.filter(s => !s.used);
              if (!moved) { put(free[0]); return; }
              let best = null, bd = 1e9;
              free.forEach(s => { const d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = s; } });
              if (best && bd < 120) put(best);
              else flyTo(ctx, g, home.x, home.y, { hop: 20, s: gs });
            },
          });
        });
      });
      Mascot.cheer('排得好整齊！');
      ctx.say('排得好整齊喔！豆腐準備好要<em>長毛毛</em>囉！');
      await ctx.wait(2000);
      ctx.done(3);
    },
  },

  // ---------------------------------------------------------------- 7. 發酵長毛
  {
    key: 'ferment', name: '發酵長毛', icon: 'ferment', pic: 'tofu_hairy', bg: 'bg_storeroom', night: true,
    fact: {
      title: '長出白白的毛了！',
      text: '豆腐上白白的毛，叫做<b>毛黴</b>，是一種對我們有幫助的好黴菌喔！把豆腐放在<b>溫暖潮濕、不太亮</b>的地方（大約 <b>15～25 度</b>），等 <b>3～5 天</b>，就會長滿白毛。毛黴會讓豆腐變得<b>更鮮、更好消化</b>！',
    },
    async run(ctx) {
      const L = ctx.layer;
      ctx.say('豆腐要睡覺覺囉！點一下<em>紗布</em>，幫豆腐蓋好被被～');
      const TX = 470, TY = 450;
      const tray = sprite(L, 'straw_tray', TX, TY, { w: 470 });
      const step = tray._w * 0.78 / 4, size = step - 22;
      const pieces = [];
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
        const x = TX - step * 2 + (c + 0.5) * step, y = TY - step * 0.75 + r * step * 1.5;
        const g = tofuPiece(L, x, y, size, c, r);
        const hairy = sprite(g.inner, 'tofu_hairy', 0, -4, { w: size * 1.35, attrs: { opacity: 0 } });
        pieces.push({ g, hairy });
      }
      const setGrowth = f => pieces.forEach(({ hairy }, i) => {
        const k = clamp(f * 1.15 - (i % 4) * 0.04, 0, 1);
        hairy.setAttribute('opacity', k.toFixed(2));
        place(hairy, 0, -4, lerp(0.7, 1, k));
      });
      setGrowth(0);

      const gw = tray._w * 1.02, gh = tray._h * 1.02;
      const cover = art(L, `<rect x="${-gw / 2}" y="${-gh / 2}" width="${gw}" height="${gh}" rx="30" fill="#FFFFFF" opacity=".5" stroke="${INK}" stroke-width="3"/>
        <rect x="${-gw / 2}" y="${-gh / 2}" width="${gw}" height="${gh}" rx="30" fill="url(#pMesh)" opacity=".55"/>
        <path d="M${-gw / 2 + 30} ${-gh / 2 + 24} H${gw / 2 - 60}" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" opacity=".8"/>`, TX, TY - 400, { opacity: 0, 'pointer-events': 'none' });
      const folded = art(L, `<g filter="url(#fShadow)">
        <rect x="-70" y="-26" width="140" height="52" rx="14" fill="url(#gCloth)" stroke="${INK}" stroke-width="3"/>
        <rect x="-70" y="-26" width="140" height="52" rx="14" fill="url(#pMesh)" opacity=".6"/>
        <path d="M-58 -8 H58 M-58 8 H58" stroke="#D9CCAE" stroke-width="2"/></g>`, 110, 330);
      pill(folded, '紗布', 0, 52, { size: 20 });
      let hintOff = ctx.hint(120, 335);
      await new Promise(res => {
        const h = Input.on(folded, { tap() { h.enabled = false; res(); }, end(p, e, m) { if (m && h.enabled) { h.enabled = false; res(); } } });
      });
      if (hintOff) { hintOff(); hintOff = null; }
      folded.remove();
      Snd.whoosh();
      await ctx.tween(500, k => { cover.setAttribute('opacity', k); place(cover, TX, TY - 400 * (1 - k)); }, ease.out);
      Juice.pop(cover, 0.06);

      const tMin = 0, tMax = 40;
      const setTherm = gauge(L, 900, 190, 420, { min: tMin, max: tMax, lo: 15, hi: 25, labels: [[25, '25°'], [15, '15°']] });
      const brazier = sprite(L, 'brazier', 110, 560, { w: 180 });
      pill(brazier, '加溫', 0, brazier._h / 2 + 8, { color: '#C9601E' });
      const fan = sprite(L, 'fan', 880, 575, { h: 160 });
      pill(fan, '降溫', 0, fan._h / 2 + 4, { color: '#3E6FB0' });
      const dayG = art(L, `<rect x="-90" y="-28" width="180" height="56" rx="28" fill="#FFF7E6" stroke="${INK}" stroke-width="3"/>
        <g class="dicon" transform="translate(-55 0)"></g>
        <text class="dtext" x="18" y="10" text-anchor="middle" font-size="28" font-weight="900" fill="${INK}"></text>`, 125, 268, { 'pointer-events': 'none' });
      const dayText = dayG.querySelector('.dtext'), dayIcon = dayG.querySelector('.dicon');

      let temp = 20, grow = 0, day = 1, dayT = 0, warned = '';
      const DAY = 5.5;
      const growNeed = 17;
      const events = { 2: 8, 3: 33, 4: 10, 5: 31, 6: 9 };
      const setDay = () => {
        dayText.textContent = `第 ${day} 天`;
        dayIcon.innerHTML = day % 2 ? '<circle r="16" fill="#FFD23F" stroke="#C98A14" stroke-width="2"/>' : '<circle r="15" fill="#FFF4C4"/><circle cx="7" cy="-5" r="13" fill="#FFF7E6"/>';
        Juice.pop(dayG, 0.15);
      };
      setTherm(temp); setDay();
      ctx.say('毛黴最喜歡<em>15～25 度</em>喔！溫度跑出<em>綠色</em>的時候，就用<em>加溫</em>或<em>降溫</em>幫幫它！');
      Input.on(brazier, {
        tap() {
          temp = Math.min(tMax, temp + 4); setTherm(temp); Snd.crackle(); Juice.pop(brazier, 0.15);
          FX.burst(110, 520, { n: 6, colors: ['#FFD84A', '#FF7A1A'], spread: 50 });
        },
      });
      Input.on(fan, {
        tap() {
          temp = Math.max(tMin, temp - 4); setTherm(temp); Snd.whoosh(); Juice.wobble(fan, 18, 450);
          for (let i = 0; i < 3; i++) FX.float(790 - i * 40, 560 - i * 25, '～', '#7CC6E6');
        },
      });
      await new Promise(res => {
        ctx.loop(dt => {
          dayT += dt;
          if (dayT > DAY) {
            dayT = 0; day++; setDay(); Snd.click();
            if (events[day] !== undefined) {
              temp = events[day]; setTherm(temp);
              ctx.say(temp < 15 ? '哎呀，晚上<em>變冷</em>了！快點<em>加溫</em>！' : '哎呀，中午<em>好熱</em>喔！快點<em>降溫</em>！');
              Guide.pose('wow');
            } else if (grow < 1) ctx.say('毛毛慢慢長出來囉，我們再等一等～');
          }
          temp += (20 - temp) * dt * 0.02;
          setTherm(temp);
          if (temp >= 15 && temp <= 25) {
            grow = Math.min(1, grow + dt / growNeed);
            setGrowth(grow);
            warned = '';
          } else {
            const w = temp < 15 ? 'cold' : 'hot';
            if (warned !== w) { warned = w; FX.float(TX, TY - 200, temp < 15 ? '太冷了！毛黴睡著了' : '太熱了！', temp < 15 ? '#3E6FB0' : '#E8503A'); }
          }
          ctx.progress(grow * 0.9);
          if (grow >= 1 && day >= 3) { res(); return false; }
        });
      });
      Snd.sparkle();
      ctx.say('毛毛長好了！<em>點一點紗布</em>，掀開來看看吧！');
      cover.removeAttribute('pointer-events');
      hintOff = ctx.hint(TX + 10, TY);
      await new Promise(res => {
        const h = Input.on(cover, { tap() { h.enabled = false; res(); }, end(p, e, m) { if (m && h.enabled) { h.enabled = false; res(); } } });
      });
      if (hintOff) hintOff();
      Snd.whoosh();
      await ctx.tween(600, k => { cover.setAttribute('opacity', 1 - k); place(cover, TX, TY - 300 * k); });
      cover.remove();
      pieces.forEach(({ g }, i) => setTimeout(() => Juice.hop(g, 26), i * 70));
      ctx.progress(1);
      FX.confetti(40);
      Mascot.cheer('長毛了！', { pose: 'wow' });
      ctx.say('哇～豆腐長出<em>白白軟軟的毛</em>了！這就是<em>毛豆腐</em>喔！');
      await ctx.wait(2600);
      ctx.done(3);
    },
  },

  // ---------------------------------------------------------------- 8. 油煎毛豆腐
  {
    key: 'fry', name: '油煎毛豆腐', icon: 'fry', pic: 'tofu_fried', bg: 'bg_stovetop',
    fact: {
      title: '香噴噴的毛豆腐！',
      text: '毛豆腐要用油<b>煎到兩面金黃</b>，再沾上<b>辣椒醬</b>，<b>趁熱吃</b>最好吃！這是安徽<b>徽州</b>（黃山那裡）很有名的小吃喔！',
    },
    async run(ctx) {
      const L = ctx.layer;
      ctx.say('最後一關囉！先點<em>油瓶</em>，在鍋子裡倒一點油～');
      const fireLayer = el('g', {}, L);
      const pan = sprite(L, 'pan', 0, 0, { h: 450 });
      centerDisc(pan, 450, 420);
      const D = discOf(pan);
      rimFire(fireLayer, D)(0.45);
      const oil = liquid(L, D, 'url(#gOil)');
      oil.fill(1);
      oil.g.setAttribute('opacity', 0);
      const panLayer = el('g', {}, L);
      const rawPlate = sprite(L, 'plate', 130, 580, { w: 240 });
      const raw = [[90, 545], [172, 545], [90, 615], [172, 615]].map(([x, y]) => sprite(L, 'tofu_hairy', x, y, { w: 86 }));
      const bottle = sprite(L, 'oil_bottle', 870, 250, { h: 230 });
      pill(bottle.inner, '油', 0, bottle._h * 0.1, { size: 24, color: '#C9601E' });
      let hintOff = ctx.hint(880, 270);
      await new Promise(res => {
        const h = Input.on(bottle, {
          tap: async () => {
            if (!h.enabled) return;
            h.enabled = false;
            if (hintOff) { hintOff(); hintOff = null; }
            await ctx.tween(420, k => place(bottle, lerp(870, D.x + D.r * 0.7, k), lerp(250, D.y - D.r - 40, k), 1, -110 * k));
            for (let i = 0; i < 7; i++) { FX.drops(D.x + D.r * 0.45, D.y - D.r * 0.6, { n: 1, color: '#F2B83A', spread: 6, fall: 80, dir: -0.4 }); await ctx.wait(80); }
            Snd.noise(0.6, { vol: 0.2, freq: 4000, type: 'highpass' });
            await ctx.tween(500, k => oil.g.setAttribute('opacity', k * 0.45));
            await ctx.tween(400, k => place(bottle, lerp(D.x + D.r * 0.7, 1150, k), lerp(D.y - D.r - 40, 250, k), 1, -110 * (1 - k)));
            bottle.remove();
            res();
          },
        });
      });
      ctx.say('把<em>毛豆腐</em>放進鍋子裡吧！拖過去或點一下都可以～');
      const sizzle = Snd.loopNoise({ vol: 0.0001 });
      ctx.onCleanup(() => sizzle.stop());
      const slots = [[-0.42, -0.36], [0.42, -0.36], [-0.42, 0.36], [0.42, 0.36]].map(([u, v]) => [D.x + u * D.r, D.y + v * D.r]);
      const tofuColor = c => c < 1 ? mixColor('#FFF3D6', '#F2B23C', c) : c < 1.6 ? mixColor('#F2B23C', '#C47A20', (c - 1) / 0.6) : mixColor('#C47A20', '#6E3A12', clamp((c - 1.6) / 0.8, 0, 1));
      const PS = D.r * 0.62;
      const panTofu = (x, y) => {
        const g = el('g', {}, panLayer);
        const inner = el('g', {}, g);
        inner.innerHTML = `<ellipse class="halo" cx="0" cy="6" rx="${PS * 0.6}" ry="${PS * 0.55}" fill="#F2B23C" opacity="0" filter="url(#fBlur2)"/>`;
        const hairy = sprite(inner, 'tofu_hairy', 0, 0, { w: PS });
        const fried = sprite(inner, 'tofu_fried', 0, 0, { w: PS, attrs: { opacity: 0 } });
        const burnt = sprite(inner, 'tofu_fried', 0, 0, { w: PS, attrs: { opacity: 0, filter: 'url(#fBurnt)' } });
        const ready = art(inner, `<g class="pulse">${Art.sparkleStar(20)}</g>`, 0, -PS * 0.62, { opacity: 0 });
        g.inner = inner;
        place(g, x, y);
        return { g, inner, hairy, fried, burnt, ready, halo: inner.querySelector('.halo') };
      };
      const cooks = [];
      let inPan = 0, served = 0, burntCount = 0, started = false;
      const dish = el('g', {}, L);
      const PX = 850, PY = 565;
      const servePlate = sprite(dish, 'plate', PX, PY, { w: 250, attrs: { opacity: 0 } });
      const serveSpots = [[PX - 42, PY - 35], [PX + 42, PY - 35], [PX - 42, PY + 35], [PX + 42, PY + 35]];
      const look = ck => {
        const down = ck.c[ck.down], up = ck.c[1 - ck.down];
        ck.v.halo.setAttribute('fill', tofuColor(down));
        ck.v.halo.setAttribute('opacity', clamp(down, 0, 1) * 0.9);
        ck.v.hairy.setAttribute('opacity', ck.flips === 0 ? 1 : 0);
        ck.v.fried.setAttribute('opacity', ck.flips === 0 ? 0 : 1);
        ck.v.burnt.setAttribute('opacity', ck.flips === 0 ? 0 : clamp((up - 1.6) / 0.8, 0, 0.85));
        ck.v.ready.setAttribute('opacity', down >= 1 ? 1 : 0);
      };
      hintOff = ctx.hint(raw[0]._x + 10, raw[0]._y);
      let freeSlot = 0;
      await new Promise(res => {
        const tapCook = async ck => {
          if (ck.done || ck.busy) return;
          if (ck.c[ck.down] < 0.85) { FX.float(ck.v.g._x, ck.v.g._y - 60, '還沒好喔', '#3E6FB0'); Snd.wrong(); Juice.wobble(ck.v.g, 6); return; }
          if (ck.c[ck.down] > 1.6) burntCount++;
          if (ck.flips === 0) {
            ck.busy = true;
            Snd.whoosh();
            await ctx.tween(170, k => ck.v.inner.setAttribute('transform', `translate(0 ${-k * 60}) scale(1 ${1 - k})`));
            ck.down = 1; ck.flips = 1; look(ck);
            await ctx.tween(220, k => ck.v.inner.setAttribute('transform', `translate(0 ${-(1 - k) * 60}) scale(1 ${k})`), ease.back);
            ck.v.inner.removeAttribute('transform');
            Snd.noise(0.45, { vol: 0.22, freq: 4000, type: 'highpass' });
            FX.splash(ck.v.g._x, ck.v.g._y, { color: '#F2B83A', n: 6, power: 0.5, ring: false });
            ck.busy = false;
            if (cooks.filter(k => k.flips > 0).length === 1) { praise(ck.v.g._x, ck.v.g._y - 90); ctx.say('翻面成功！另一面也煎到<em>金黃</em>、出現星星，再點一下<em>起鍋</em>～'); }
          } else {
            ck.done = true;
            const [tx, ty] = serveSpots[served++];
            servePlate.setAttribute('opacity', 1);
            ck.v.ready.setAttribute('opacity', 0);
            ck.v.halo.setAttribute('opacity', 0);
            dish.appendChild(ck.v.g);
            await flyTo(ctx, ck.v.g, tx, ty, { hop: 90, s: 0.62 });
            Snd.pop(); Juice.pop(ck.v.g, 0.2);
            inPan--;
            sizzle.set(inPan ? 0.04 + inPan * 0.025 : 0.0001);
            ctx.progress(served / 4 * 0.85);
            if (served === 4) res();
          }
        };
        raw.forEach(g => {
          const home = { x: g._x, y: g._y };
          const toPan = async () => {
            h.enabled = false;
            const [sx, sy] = slots[freeSlot++];
            await flyTo(ctx, g, sx, sy, { hop: 70, s: PS / g._w });
            g.remove();
            const v = panTofu(sx, sy);
            const ck = { v, c: [0, 0], down: 0, flips: 0, done: false };
            cooks.push(ck); look(ck);
            Snd.noise(0.5, { vol: 0.28, freq: 4000, type: 'highpass' });
            FX.splash(sx, sy, { color: '#F2B83A', n: 7, power: 0.6, ring: false });
            Juice.pop(v.g, 0.2);
            inPan++;
            sizzle.set(0.04 + inPan * 0.025);
            if (!started) { started = true; ctx.say('滋滋滋～好香喔！豆腐下面變<em>金黃色</em>、出現<em>星星</em>的時候，就點一下<em>翻面</em>！'); }
            Input.on(v.g, { tap: () => tapCook(ck) });
          };
          const h = Input.on(g, {
            start() { if (hintOff) { hintOff(); hintOff = null; } L.appendChild(g); Juice.pop(g, 0.12); },
            move(p) { place(g, p.x, p.y, 1.15); },
            end(p, e, moved) {
              if (!h.enabled) return;
              if (!moved || Math.hypot(p.x - D.x, p.y - D.y) < D.R) toPan();
              else flyTo(ctx, g, home.x, home.y, { hop: 20, s: 1 });
            },
          });
        });
        ctx.loop(dt => {
          cooks.forEach(ck => {
            if (ck.done || ck.busy) return;
            const cur = ck.c[ck.down];
            ck.c[ck.down] = cur + dt * (cur < 1 ? 0.24 : 0.11);
            look(ck);
            if (Math.random() < dt * 3) FX.ring(ck.v.g._x + (Math.random() - 0.5) * PS, ck.v.g._y + PS * 0.4, { r: 10, color: '#FFF3B0', width: 2, dur: 400 });
          });
        });
      });
      sizzle.set(0.0001);
      rawPlate.remove();
      ctx.say('最後點一下<em>辣椒醬</em>，幫毛豆腐加點味道吧！');
      const jar = sprite(L, 'chili_jar', 870, 250, { h: 210 });
      pill(jar.inner, '辣椒醬', -jar._w * 0.02, jar._h * 0.28, { size: 18, color: '#B23A22' });
      hintOff = ctx.hint(880, 270);
      await new Promise(res => {
        const h = Input.on(jar, {
          tap: async () => {
            if (!h.enabled) return;
            h.enabled = false;
            if (hintOff) hintOff();
            for (const ck of cooks) {
              await flyTo(ctx, jar, ck.v.g._x + 30, ck.v.g._y - 110, { dur: 260, hop: 30, s: 0.6 });
              Juice.wobble(jar, 16, 260);
              const dollop = sprite(ck.v.inner, 'chili_dollop', 0, -4, { w: PS * 0.5 });
              place(dollop, 0, -4, 0.01);
              Snd.plop();
              FX.splash(ck.v.g._x, ck.v.g._y, { color: '#E0321C', n: 4, power: 0.4, ring: false });
              await ctx.tween(220, k => place(dollop, 0, -4, k), ease.back);
            }
            await flyTo(ctx, jar, 870, 250, { dur: 300, s: 1 });
            jar.remove();
            res();
          },
        });
      });
      // finale: bring the finished dish to the centre, close up and steaming
      art(dish, Art.steam(4, 50, 70), PX, PY - 30, { 'pointer-events': 'none' });
      Snd.whoosh();
      await ctx.tween(700, k => {
        const sc = lerp(1, 1.75, k), cx = lerp(PX, 500, k), cy = lerp(PY, 440, k);
        dish.setAttribute('transform', `translate(${cx} ${cy}) scale(${sc}) translate(${-PX} ${-PY})`);
        pan.setAttribute('opacity', 1 - k * 0.7); fireLayer.setAttribute('opacity', 1 - k); oil.g.setAttribute('opacity', 0.45 * (1 - k));
        panLayer.setAttribute('opacity', 1 - k);
      }, ease.back);
      FX.burst(500, 420, { n: 18, spread: 220 });
      ctx.progress(1);
      Mascot.cheer(burntCount ? '好香喔！' : '金黃酥脆！');
      ctx.say(burntCount ? '完成囉！有一點點焦焦的，下次早一點翻面就更棒囉～' : '完成囉！金黃酥脆的<em>毛豆腐</em>，趁熱吃，好好吃喔！');
      await ctx.wait(2600);
      ctx.done(3 - Math.min(2, burntCount));
    },
  },
];
