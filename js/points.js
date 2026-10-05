// Points battle "挑豆豆大對決": catch good beans in a bamboo basket for 90 seconds.
// Two players share one tablet side by side, or one player plays alone. Rules: points-logic.js.
const PLAYERS = [
  { name: '紅毛毛', color: '#E8503A', happy: 'char_maomao_happy', cheer: 'char_maomao_cheer' },
  { name: '藍毛毛', color: '#3E7BD9', happy: 'char_maomao_blue_happy', cheer: 'char_maomao_blue_cheer' },
];
const ITEM_ART = { good: 'bean_dry', gold: 'bean_dry', bad: 'bean_bad', stone: 'press_stone', leaf: 'leaf' };
const ITEM_SIZE = { good: 56, gold: 66, bad: 56, stone: 54, leaf: 64 };
const ARENA_TOP = 170, BASKET_Y = 612, FLOOR_Y = 720;
const MEDAL_STYLE = { gold: ['#FFD23F', '#B8860B', '金'], silver: ['#E3E8EF', '#7D8A9C', '銀'], bronze: ['#E7A46A', '#94531F', '銅'] };
const CROWN = `<path d="M-55 20 L-60 -25 L-28 0 L0 -40 L28 0 L60 -25 L55 20 Z" fill="#FFD23F" stroke="#B8860B" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="0" cy="-40" r="8" fill="#E8503A"/><circle cx="-60" cy="-25" r="7" fill="#4D96FF"/><circle cx="60" cy="-25" r="7" fill="#4D96FF"/>`;

const pointsUnlocked = () => Save.data.unlocked >= LEVELS.length;

function medalMarkup(kind) {
  const [fill, edge, label] = MEDAL_STYLE[kind];
  return `<path d="M-22 -62 L-6 -20 M22 -62 L6 -20" stroke="#E8503A" stroke-width="14" stroke-linecap="round"/>
    <circle r="34" fill="${fill}" stroke="${edge}" stroke-width="5"/>
    <circle r="24" fill="none" stroke="#FFFFFF" stroke-width="3" opacity=".6"/>
    <text y="12" font-size="32" font-weight="900" text-anchor="middle" fill="${edge}">${label}</text>`;
}

function bigButton(parent, label, x, y, fill, onTap) {
  const b = art(parent, `<rect x="-140" y="-30" width="280" height="76" rx="38" fill="${INK}"/>
    <rect x="-140" y="-38" width="280" height="76" rx="38" fill="${fill}" stroke="${INK}" stroke-width="5"/>
    <text y="12" font-size="36" font-weight="900" text-anchor="middle" fill="#FFF" stroke="${INK}" stroke-width="6" paint-order="stroke">${label}</text>`, x, y);
  Input.on(b, { tap: () => { Snd.click(); onTap(); } });
  return b;
}

// Huge centred word for the countdown and the whistle.
function bigText(text) {
  const g = el('g', { 'pointer-events': 'none' }, layers.fx);
  const t = el('text', { y: 50, 'text-anchor': 'middle', 'font-size': 150, 'font-weight': 900, fill: '#FFD23F', stroke: '#8A3B12', 'stroke-width': 16, 'paint-order': 'stroke', 'stroke-linejoin': 'round' }, g);
  t.textContent = text;
  const t0 = performance.now();
  const step = now => {
    const k = clamp((now - t0) / 850, 0, 1);
    g.setAttribute('transform', `translate(500 380) scale(${k < 0.3 ? ease.back(k / 0.3) : 1})`);
    g.setAttribute('opacity', k > 0.7 ? (1 - k) / 0.3 : 1);
    if (k < 1) requestAnimationFrame(step); else g.remove();
  };
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------- intro
function showPointsIntro() {
  teardown();
  chrome({ top: true, guide: true, home: showTitle });
  $('levelTitle').innerHTML = '<b>積分賽</b>挑豆豆大對決';
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  // a bean keeps dropping into the basket: shows how to play without words
  const demo = SPR.bamboo_basket && SPR.bean_dry
    ? `<image href="${SPR.bean_dry.src}" x="-10" y="-10" width="20" height="20">
        <animateTransform attributeName="transform" type="translate" values="0 -60; 0 12" dur="1.3s" repeatCount="indefinite"/></image>
       <g transform="translate(0 24)">${picMarkup('bamboo_basket', 'soak', 74)}</g>`
    : picMarkup('bamboo_basket', 'soak');
  UI.card({
    art: demo,
    title: '挑豆豆大對決',
    text: '做豆腐前要先<b>挑豆子</b>：發黑、發霉的豆子跟小石頭都要挑掉喔！<br>用竹籃接住<b>好豆子</b>得 10 分、<b>金黃豆</b>得 30 分；壞豆子、小石頭、葉子不要接。',
    buttons: [
      { label: '回到標題', alt: true, onClick: () => showTitle() },
      { label: '準備比賽 ▶', onClick: () => showPointsReady() },
    ],
    speak: false,
  });
  Guide.say('挑豆豆大對決！用竹籃接住<em>好豆子</em>，壞豆子、小石頭跟葉子不要接喔！');
}

// ---------------------------------------------------------------- ready
function showPointsReady() {
  teardown();
  chrome({ top: true, guide: true, home: showTitle });
  $('levelTitle').innerHTML = '<b>積分賽</b>準備';
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  Input.multi = true;
  const L = ctx.layer;
  el('rect', { x: 0, y: 0, width: 1000, height: 700, fill: '#FFF7E6', opacity: 0.45 }, L);
  el('path', { d: 'M500 200 V700', stroke: '#C98647', 'stroke-width': 6, 'stroke-dasharray': '18 14' }, L);
  const ready = [false, false];
  let started = false, soloOffered = false;
  const sides = PLAYERS.map((pl, i) => {
    const x = 250 + i * 500;
    const av = sprite(L, pl.happy, x, 380, { h: 240 });
    av.inner.setAttribute('class', 'bob');
    const b = art(L, `<g class="off">
        <rect x="-140" y="-30" width="280" height="76" rx="38" fill="${INK}"/>
        <rect x="-140" y="-38" width="280" height="76" rx="38" fill="${pl.color}" stroke="${INK}" stroke-width="5"/>
        <text y="12" font-size="36" font-weight="900" text-anchor="middle" fill="#FFF" stroke="${INK}" stroke-width="6" paint-order="stroke">準備好了！</text></g>
      <g class="on" display="none">
        <rect x="-140" y="-38" width="280" height="76" rx="38" fill="#9BDB86" stroke="${INK}" stroke-width="5"/>
        <text y="12" font-size="36" font-weight="900" text-anchor="middle" fill="${INK}">我好了！</text></g>`, x, 580);
    Input.on(b, { tap: () => press(i) });
    return { av, b };
  });
  Guide.say('兩位小朋友，準備好了就按<em>準備好了</em>！');

  function press(i) {
    if (started || ready[i]) return;
    ready[i] = true;
    sides[i].b.querySelector('.off').setAttribute('display', 'none');
    sides[i].b.querySelector('.on').removeAttribute('display');
    Snd.pop();
    Juice.hop(sides[i].av, 30);
    if (ready[0] && ready[1]) { started = true; startPointsGame([0, 1]); return; }
    ctx.later(5000, () => { // only one side is ready: offer playing alone
      if (started || soloOffered) return;
      soloOffered = true;
      bigButton(L, '一個人玩', 500, 655, '#F08A3C', () => {
        if (started) return;
        started = true;
        startPointsGame([ready[0] ? 0 : 1]);
      });
      Guide.say('只有一個人嗎？也可以按<em>一個人玩</em>喔！');
    });
  }
}

// ---------------------------------------------------------------- game
// who: indexes into PLAYERS, one or two of them.
function startPointsGame(who) {
  teardown();
  chrome({ top: true, guide: false, home: showTitle });
  $('levelTitle').innerHTML = '<b>積分賽</b>挑豆豆大對決';
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  Input.multi = true;
  const L = ctx.layer;
  el('rect', { x: 0, y: 0, width: 1000, height: 700, fill: '#FFF7E6', opacity: 0.55 }, L); // calm the busy kitchen behind the falling items
  const plan = spawnPlan(Math.floor(Math.random() * 1e9));
  const duo = who.length === 2;
  const arenas = who.map((pi, k) => makeArena(L, PLAYERS[pi], duo ? k * 500 : 0, duo ? k * 500 + 500 : 1000, plan));
  if (duo) el('path', { d: 'M500 150 V700', stroke: '#C98647', 'stroke-width': 6, 'stroke-dasharray': '18 14' }, L);
  const clock = art(L, `<rect x="-62" y="-30" width="124" height="60" rx="30" fill="#FFF7E6" stroke="${INK}" stroke-width="4"/>
    <text class="tt" y="12" font-size="34" font-weight="900" text-anchor="middle" fill="${INK}">${POINTS.DURATION}</text>`, 500, 42, { 'pointer-events': 'none' });
  const clockText = clock.querySelector('.tt');
  // every finger steers the basket on the side where it first touched
  const owner = new Map();
  Input.stageHandler = {
    start(p, e) { const a = duo ? arenas[p.x < 500 ? 0 : 1] : arenas[0]; owner.set(e.pointerId, a); a.aim(p.x); },
    move(p, e) { const a = owner.get(e.pointerId); if (a) a.aim(p.x); },
    end(p, e) { owner.delete(e.pointerId); },
  };

  (async () => {
    await ctx.wait(400);
    bigText('3'); Voice.say('三！'); Snd.click(); await ctx.wait(900);
    bigText('2'); Voice.say('二！'); Snd.click(); await ctx.wait(900);
    bigText('1'); Voice.say('一！'); Snd.click(); await ctx.wait(900);
    bigText('開始！'); Voice.say('開始！'); Snd.success();
    let t = 0, phase = 0;
    ctx.loop(dt => {
      t += dt;
      clockText.textContent = Math.max(0, Math.ceil(POINTS.DURATION - t));
      const ph = POINTS.PHASES.findIndex(p => t < p.until);
      if (ph > phase) { phase = ph; Voice.say('加速囉！'); FX.praise(500, 330, '加速囉！'); }
      arenas.forEach(a => a.update(dt, t));
      if (t >= POINTS.DURATION) { finish(); return false; }
    });
  })();

  async function finish() {
    Input.stageHandler = null;
    arenas.forEach(a => a.stop());
    bigText('時間到！'); Voice.say('時間到！'); Snd.fanfare();
    await ctx.wait(1800);
    showPointsResult(arenas.map(a => ({ player: a.player, score: a.state.score, caught: a.state.caught })));
  }
}

// One player's half (or the whole width): basket, falling items, score.
function makeArena(L, player, x0, x1, plan) {
  const g = el('g', {}, L);
  const w = x1 - x0, mid = (x0 + x1) / 2;
  const avatar = sprite(g, player.happy, mid - 125, 110, { h: 84, attrs: { 'pointer-events': 'none' } });
  const panel = art(g, `<rect x="-95" y="-32" width="190" height="64" rx="32" fill="#FFF7E6" stroke="${player.color}" stroke-width="6"/>
    <text class="sc" y="14" font-size="40" font-weight="900" text-anchor="middle" fill="${INK}">0</text>`, mid + 15, 110, { 'pointer-events': 'none' });
  const scoreText = panel.querySelector('.sc');
  const itemsG = el('g', { 'pointer-events': 'none' }, g);
  const basket = sprite(g, 'bamboo_basket', mid, BASKET_Y, { w: w > 600 ? 200 : 170, attrs: { 'pointer-events': 'none' } });
  const half = basket._w / 2, rim = BASKET_Y - basket._h * 0.3, fall = BASKET_Y - ARENA_TOP;
  const state = newScore(), live = [];
  let bx = mid, target = mid, next = 0, stopped = false;

  function catchItem(it) {
    const gained = scoreCatch(state, it.type);
    if (gained > 0) {
      it.g.remove();
      scoreText.textContent = state.score;
      Snd.pop();
      Juice.pop(basket, 0.15);
      Juice.pop(panel, 0.2);
      FX.float(it.x, BASKET_Y - 80, `+${gained}`, it.type === 'gold' ? '#D99A00' : '#2F8F3A');
      if (it.type === 'gold') FX.burst(it.x, BASKET_Y - 40, { n: 10, spread: 70 });
      if (state.combo >= POINTS.COMBO_FROM && state.combo % 5 === 0) {
        FX.praise(mid, 330, `連續 ${state.combo} 顆！`);
        Juice.hop(avatar, 20);
      }
      return;
    }
    // a bad thing: it bounces back out of the basket
    Snd.wrong();
    Juice.wobble(basket, 10, 400);
    FX.float(it.x, BASKET_Y - 80, '哎呀', '#E8503A');
    const sx = it.x, dir = it.x < bx ? -1 : 1, t0 = performance.now();
    const step = now => {
      const k = clamp((now - t0) / 600, 0, 1);
      place(it.g, sx + dir * 120 * k, rim - Math.sin(k * Math.PI) * 120 + k * 120, 1, k * 360);
      it.g.setAttribute('opacity', 1 - k);
      if (k < 1) requestAnimationFrame(step); else it.g.remove();
    };
    requestAnimationFrame(step);
  }

  return {
    player, state,
    aim(x) { target = clamp(x, x0 + half, x1 - half); },
    stop() { stopped = true; live.forEach(it => it.g.remove()); live.length = 0; },
    update(dt, t) {
      if (stopped) return;
      bx = lerp(bx, target, Math.min(1, dt * 16));
      place(basket, bx, BASKET_Y);
      while (next < plan.length && plan[next].t <= t) {
        const p = plan[next++];
        const it = { type: p.type, speed: p.speed, x: x0 + p.x * w, y: ARENA_TOP, rot: 0, spin: (Math.random() - 0.5) * 160 };
        it.g = sprite(itemsG, ITEM_ART[p.type], it.x, it.y, { w: ITEM_SIZE[p.type] });
        if (p.type === 'gold') it.g.setAttribute('filter', 'url(#fGold)');
        live.push(it);
      }
      for (let i = live.length - 1; i >= 0; i--) {
        const it = live[i], before = it.y;
        it.y += it.speed * fall * dt;
        it.rot += it.spin * dt;
        place(it.g, it.x, it.y, 1, it.rot);
        if (before < rim && it.y >= rim && Math.abs(it.x - bx) < half * 0.85) {
          live.splice(i, 1);
          catchItem(it);
        } else if (it.y > FLOOR_Y) {
          live.splice(i, 1);
          it.g.remove();
          scoreMiss(state, it.type);
        }
      }
    },
  };
}

// ---------------------------------------------------------------- results
function showPointsResult(results) {
  teardown();
  chrome({ top: true, guide: false, home: showTitle }); // the corner bubble would cover the left crown; a banner shows the result
  $('levelTitle').innerHTML = '<b>積分賽</b>結果';
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  const L = ctx.layer;
  el('rect', { x: 0, y: 0, width: 1000, height: 700, fill: '#FFF7E6', opacity: 0.55 }, L);
  const duo = results.length === 2;
  const top = Math.max(...results.map(r => r.score));
  const tie = duo && results[0].score === results[1].score;
  const record = top > (Save.data.pointsBest || 0);
  if (record) { Save.data.pointsBest = top; Save.save(); }
  results.forEach((r, i) => {
    const x = duo ? 250 + i * 500 : 500;
    const win = !duo || r.score === top;
    const av = sprite(L, win ? r.player.cheer : r.player.happy, x, 300, { h: 240 });
    av.inner.setAttribute('class', 'bob');
    if (duo && win) art(L, CROWN, x, 160, { 'pointer-events': 'none' });
    const name = el('text', { x, y: 460, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 900, fill: r.player.color, stroke: '#FFF7E6', 'stroke-width': 8, 'paint-order': 'stroke' }, L);
    name.textContent = r.player.name;
    const sc = el('text', { x, y: 535, 'text-anchor': 'middle', 'font-size': 76, 'font-weight': 900, fill: INK, stroke: '#FFF7E6', 'stroke-width': 10, 'paint-order': 'stroke' }, L);
    ctx.tween(1200, k => { sc.textContent = Math.round(r.score * k); }, ease.out);
    const medal = medalFor(r.score);
    if (medal) {
      const m = art(L, medalMarkup(medal), x + 140, 500, { 'pointer-events': 'none' });
      place(m, x + 140, 500, 0.01);
      ctx.later(1200, () => { Snd.sparkle(); ctx.tween(500, k => place(m, x + 140, 500, k), ease.back); });
    } else {
      const cheer = el('text', { x: x + 140, y: 510, 'text-anchor': 'middle', 'font-size': 28, 'font-weight': 900, fill: '#C9601E' }, L);
      cheer.textContent = '加油喔！';
    }
    const caught = el('text', { x, y: 580, 'text-anchor': 'middle', 'font-size': 24, 'font-weight': 800, fill: INK }, L);
    caught.textContent = `接到 ${r.caught} 顆豆子`;
  });
  if (record) ctx.later(1500, () => FX.praise(500, 230, '新紀錄！'));
  FX.confetti(70);
  if (!duo) Guide.say(record ? '新紀錄！太厲害了！' : '你接到好多豆子，好棒喔！');
  else if (tie) Guide.say('平手！你們兩個都好棒！');
  else if (results[0].score > results[1].score) Guide.say('紅毛毛贏了！好厲害！');
  else Guide.say('藍毛毛贏了！好厲害！');
  pill(L, Guide.last.replace(/<[^>]+>/g, ''), 500, 92, { size: 30 });
  bigButton(L, '再比一次', 330, 645, '#F08A3C', () => showPointsReady());
  bigButton(L, '回到標題', 670, 645, '#7FB069', () => showTitle());
}
