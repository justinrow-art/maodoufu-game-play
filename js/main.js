// Screens: title, level map, levels, quiz and certificate.
const Save = {
  key: 'maodoufu-game-v1',
  data: { unlocked: 0, stars: [], pointsBest: 0 },
  load() { try { const d = JSON.parse(localStorage.getItem(this.key)); if (d && typeof d.unlocked === 'number') this.data = d; } catch (e) {} },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
};
Save.load();
const params = new URLSearchParams(location.search);
if (params.has('all')) Save.data.unlocked = LEVELS.length - 1;

let ctx = null;
function teardown() {
  if (ctx) { ctx.destroy(); ctx = null; }
  endCurrent();
  UI.closeCard();
  Voice.stop();
}
// home = where the top-bar home button leads from this screen (the map unless a screen says otherwise).
let homeAction = null;
function chrome({ top = false, guide = false, progress = false, home = showMap } = {}) {
  UI.show('topbar', top); UI.show('guide', guide); UI.show('progress', progress);
  homeAction = home;
}

// ---------------------------------------------------------------- title
// A sprite picture as SVG markup centred on 0,0 (falls back to the old vector icon).
function picMarkup(name, fallbackIcon, size = 116) {
  const s = SPR[name];
  if (!s) return Art.icon(fallbackIcon);
  const k = size / Math.max(s.w, s.h), w = s.w * k, h = s.h * k;
  return `<image href="${s.src}" x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}"/>`;
}

function showTitle() {
  teardown();
  chrome();
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  const L = ctx.layer;
  // bubbly game logo
  art(L, `<g class="bob">
    <text x="0" y="0" font-size="112" font-weight="900" text-anchor="middle" letter-spacing="4" fill="#8A3B12" stroke="#8A3B12" stroke-width="30" stroke-linejoin="round" transform="translate(0 8)">毛豆腐小師傅</text>
    <text x="0" y="0" font-size="112" font-weight="900" text-anchor="middle" letter-spacing="4" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="20" stroke-linejoin="round">毛豆腐小師傅</text>
    <text x="0" y="0" font-size="112" font-weight="900" text-anchor="middle" letter-spacing="4" fill="url(#gLogo)" stroke="#E0641E" stroke-width="3" stroke-linejoin="round">毛豆腐小師傅</text>
    <g transform="translate(-370 -80)">${Art.sparkleStar(22)}</g><g transform="translate(360 10)">${Art.sparkleStar(16)}</g></g>`, 500, 175, { 'pointer-events': 'none' });
  pill(L, '一起學做安徽徽州的毛豆腐！', 500, 250, { size: 26 });
  const m = sprite(L, 'char_maomao_happy', 190, 455, { h: 320 });
  m.inner.setAttribute('class', 'bob');
  sprite(L, 'plate', 760, 575, { w: 330 });
  [[690, 560], [775, 545], [855, 575]].forEach(([x, y]) => {
    const t = sprite(L, 'tofu_fried', x, y, { w: 105 });
    sprite(t.inner, 'chili_dollop', 0, -4, { w: 46 });
  });
  art(L, Art.steam(3, 60, 70), 775, 500, { 'pointer-events': 'none' });
  sprite(L, 'tofu_hairy_side', 820, 400, { w: 170 });
  const btn = art(L, `<g class="pulse">
    <rect x="-140" y="-38" width="280" height="84" rx="42" fill="${INK}"/>
    <rect x="-140" y="-46" width="280" height="84" rx="42" fill="#F08A3C" stroke="${INK}" stroke-width="5"/>
    <rect x="-120" y="-38" width="240" height="26" rx="13" fill="#FFB673" opacity=".7"/>
    <text x="0" y="10" font-size="42" font-weight="900" text-anchor="middle" fill="#FFF" stroke="#A04A12" stroke-width="6" paint-order="stroke">開始玩！</text></g>`, 440, 560);
  Input.on(btn, {
    tap() {
      Snd.init(); Snd.click();
      if (Snd.musicOn) Snd.startMusic();
      showMap(true);
    },
  });
  const locked = !pointsUnlocked();
  const pbtn = art(L, `<g${locked ? '' : ' class="pulse"'}>
    <rect x="-130" y="-30" width="260" height="70" rx="35" fill="${INK}"/>
    <rect x="-130" y="-36" width="260" height="70" rx="35" fill="${locked ? '#BFB29A' : '#5DA9E9'}" stroke="${INK}" stroke-width="5"/>
    <text x="${locked ? 14 : 0}" y="10" font-size="34" font-weight="900" text-anchor="middle" fill="#FFF" stroke="${INK}" stroke-width="5" paint-order="stroke">積分賽</text>
    ${locked ? `<g transform="translate(-72 -2)"><rect x="-14" y="-6" width="28" height="22" rx="4" fill="#C9A270" stroke="${INK}" stroke-width="3"/><path d="M-8 -6 v-7 a8 8 0 0 1 16 0 v7" fill="none" stroke="${INK}" stroke-width="3.5"/></g>` : ''}</g>`, 440, 655);
  Input.on(pbtn, {
    tap() {
      Snd.init(); Snd.click();
      if (Snd.musicOn) Snd.startMusic();
      if (!pointsUnlocked()) { Snd.wrong(); Juice.wobble(pbtn, 8); Voice.say('把 8 關毛豆腐做完，就能來比賽囉！'); return; }
      showPointsIntro();
    },
  });
}

// ---------------------------------------------------------------- map
function showMap(greet) {
  teardown();
  chrome({ top: true, guide: true, home: showTitle });
  $('levelTitle').innerHTML = '<b>製作地圖</b>';
  setBg('bg_map');
  ctx = makeCtx(() => {});
  const L = ctx.layer;
  const pos = [[150, 330], [380, 330], [610, 330], [840, 330], [840, 540], [610, 540], [380, 540], [150, 540]];
  let d = `M${pos[0][0]} ${pos[0][1]}`;
  for (let i = 1; i < pos.length; i++) {
    const [x, y] = pos[i], [px, py] = pos[i - 1];
    d += px === x ? ` C${x + 90} ${py} ${x + 90} ${y} ${x} ${y}` : ` L${x} ${y}`;
  }
  el('path', { d, stroke: '#8A5530', 'stroke-width': 30, fill: 'none', 'stroke-linecap': 'round', opacity: 0.35 }, L);
  el('path', { d, stroke: '#F6D9A8', 'stroke-width': 22, fill: 'none', 'stroke-linecap': 'round' }, L);
  el('path', { d, stroke: '#FFF7E6', 'stroke-width': 4, fill: 'none', 'stroke-dasharray': '4 14', 'stroke-linecap': 'round' }, L);
  const un = Save.data.unlocked;
  LEVELS.forEach((lv, i) => {
    const [x, y] = pos[i];
    const locked = i > un, cur = i === un;
    const stars = Save.data.stars[i] || 0;
    const g = art(L, `
      ${cur ? `<circle r="70" fill="none" stroke="#FF9F43" stroke-width="6" class="pulse"/>` : ''}
      <circle r="62" cy="7" fill="${INK}" opacity=".5"/>
      <circle r="62" fill="${locked ? '#E6DCCB' : '#FFFDF5'}" stroke="${INK}" stroke-width="4"/>
      <g opacity="${locked ? 0.35 : 1}">${picMarkup(lv.pic, lv.icon, 104)}</g>
      <circle cx="-46" cy="-44" r="18" fill="${locked ? '#BFB29A' : '#F08A3C'}" stroke="${INK}" stroke-width="3"/>
      <text x="-46" y="-36" font-size="22" font-weight="900" text-anchor="middle" fill="#fff">${i + 1}</text>
      ${locked ? `<g transform="translate(34 30)"><rect x="-16" y="-8" width="32" height="26" rx="5" fill="#C9A270" stroke="${INK}" stroke-width="3"/><path d="M-9 -8 v-8 a9 9 0 0 1 18 0 v8" fill="none" stroke="${INK}" stroke-width="4"/></g>` : ''}
      <text y="88" font-size="24" font-weight="900" text-anchor="middle" fill="${INK}" stroke="#FFF7E6" stroke-width="6" paint-order="stroke">${lv.name}</text>
      ${!locked && stars ? `<text y="116" font-size="22" text-anchor="middle" fill="#FFC233" stroke="#B8741A" stroke-width="1.5" letter-spacing="2">${'★'.repeat(stars)}<tspan fill="#E6D8BC" stroke="#C9B48F">${'★'.repeat(3 - stars)}</tspan></text>` : ''}`, x, y);
    Input.on(g, {
      tap() {
        Snd.click();
        if (locked) { Snd.wrong(); Guide.say('這一關還沒打開喔！先完成<em>前面的關卡</em>吧～'); return; }
        startLevel(i);
      },
    });
  });
  const done = un >= LEVELS.length;
  const [mx, my] = pos[Math.min(un, LEVELS.length - 1)];
  const mm = SPR.char_maomao_point ? sprite(L, 'char_maomao_point', Math.max(50, mx - 104), my - 30, { h: 110, attrs: { 'pointer-events': 'none' } })
    : art(L, Art.mascotInner(), mx + 58, my - 40, { 'pointer-events': 'none' });
  if (!SPR.char_maomao_point) place(mm, mx + 58, my - 40, 0.55);
  else mm.inner.setAttribute('class', 'bob');
  if (done) {
    const cert = art(L, `<g class="pulse"><rect x="-90" y="-28" width="180" height="56" rx="28" fill="#F08A3C" stroke="${INK}" stroke-width="4"/>
      <text y="9" font-size="26" font-weight="900" text-anchor="middle" fill="#fff">看我的獎狀</text></g>`, 500, 440);
    Input.on(cert, { tap() { Snd.click(); showCertificate(); } });
  }
  Guide.say(greet && un === 0
    ? '小朋友好！我是<em>毛毛</em>～我們一起來做<em>毛豆腐</em>吧！點<em>第 1 關</em>開始囉！'
    : done ? '哇～你全部完成了！可以再玩一次，或是看看你的<em>獎狀</em>喔！' : `點<em>第 ${un + 1} 關</em>，我們繼續做毛豆腐吧！`);
}

// ---------------------------------------------------------------- levels
function startLevel(i) {
  teardown();
  const lv = LEVELS[i];
  chrome({ top: true, guide: true, progress: true });
  $('levelTitle').innerHTML = `<b>第 ${i + 1} 關</b>${lv.name}`;
  UI.progress(0);
  setBg(lv.bg, { night: !!lv.night });
  ctx = makeCtx(stars => finishLevel(i, stars));
  Promise.resolve(lv.run(ctx)).catch(err => console.error(err));
}

function finishLevel(i, stars) {
  const lv = LEVELS[i];
  Save.data.stars[i] = Math.max(Save.data.stars[i] || 0, stars);
  Save.data.unlocked = Math.max(Save.data.unlocked, i + 1);
  Save.save();
  Snd.success();
  FX.confetti(50);
  const last = i === LEVELS.length - 1;
  UI.card({
    art: picMarkup(lv.pic, lv.icon), stars, title: lv.fact.title, speak: false,
    text: `<span style="display:block;text-align:center;font-size:.9em;color:#9A6A3A;margin-bottom:.4em">小知識：第 ${i + 1} 步「${lv.name}」</span>${lv.fact.text}`,
    buttons: [
      { label: '再玩一次', alt: true, onClick: () => startLevel(i) },
      { label: last ? '小考驗 ▶' : '下一關 ▶', onClick: () => (last ? startQuiz() : startLevel(i + 1)) },
    ],
  });
  Voice.say(factSpeech(lv));
}

// ---------------------------------------------------------------- quiz
const extraArt = {
  cotton: `<path d="M0 50 L0 0" stroke="#C98647" stroke-width="6" stroke-linecap="round"/>
    <g fill="#FFB6D0" stroke="${INK}" stroke-width="3"><circle cx="-18" cy="-14" r="20"/><circle cx="16" cy="-18" r="22"/><circle cx="0" cy="-34" r="20"/><circle cx="0" cy="-6" r="18"/></g>`,
  snow: `<g stroke="#5AA9E0" stroke-width="6" stroke-linecap="round">${[0, 60, 120].map(a => `<path d="M0 -44 V44 M-12 -32 L0 -20 L12 -32 M-12 32 L0 20 L12 32" transform="rotate(${a})"/>`).join('')}</g>`,
  stone: `<path d="M-40 20 Q-46 -24 -6 -30 Q40 -36 44 0 Q48 26 10 30 Q-30 36 -40 20Z" fill="url(#gStone)" stroke="${INK}" stroke-width="3"/>`,
  sugar: `<rect x="-30" y="-30" width="60" height="60" rx="8" fill="#FFFFFF" stroke="${INK}" stroke-width="3"/><path d="M-30 -10 H30 M-10 -30 V30" stroke="#E2E2E2" stroke-width="3"/>`,
};
const QUIZ = [
  { q: '小朋友，做豆腐的<em>第一步</em>是什麼呢？', opts: [['泡黃豆', picMarkup('bowl_water', 'soak'), true], ['油煎', picMarkup('tofu_fried', 'fry')], ['長毛毛', picMarkup('tofu_hairy', 'ferment')]] },
  { q: '豆漿裡加了什麼，才會變成<em>豆花</em>呢？', opts: [['糖', extraArt.sugar], ['鹽滷', picMarkup('brine_bottle', 'curd'), true], ['石頭', extraArt.stone]] },
  { q: '豆腐上<em>白白的毛</em>，是什麼呢？', opts: [['棉花糖', extraArt.cotton], ['雪花', extraArt.snow], ['毛黴（好菌）', picMarkup('tofu_hairy', 'ferment'), true]] },
  { q: '毛豆腐最後要<em>怎麼煮</em>，才會香香的呢？', opts: [['磨一磨', picMarkup('mill_top', 'grind')], ['油煎到金黃', picMarkup('tofu_fried', 'fry'), true], ['泡在水裡', picMarkup('bowl_water', 'soak')]] },
];
function startQuiz() {
  teardown();
  chrome({ top: true, guide: true });
  $('levelTitle').innerHTML = '<b>小考驗</b>毛豆腐小百科';
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  let qi = 0, mistakes = 0;
  const ask = () => {
    const item = QUIZ[qi];
    const wrap = document.createElement('div');
    wrap.className = 'quiz-opts';
    wrap.style.width = '100%';
    let answered = false;
    item.opts.forEach(([label, markup, right]) => {
      const b = document.createElement('button');
      b.className = 'quiz-opt';
      b.innerHTML = `<svg viewBox="-60 -60 120 120">${markup}</svg>${label}`;
      b.addEventListener('click', () => {
        if (answered) return;
        Snd.init();
        if (right) {
          answered = true;
          b.classList.add('right'); Snd.success();
          Guide.say('答對了！你好棒喔！');
          setTimeout(() => { if (++qi < QUIZ.length) ask(); else { UI.closeCard(); showCertificate(mistakes); } }, 1100);
        } else {
          mistakes++;
          b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); Snd.wrong();
          Guide.say('嗯～再想一想喔！');
        }
      });
      wrap.appendChild(b);
    });
    UI.card({ title: `第 ${qi + 1} 題（共 ${QUIZ.length} 題）`, text: `<span style="display:block;text-align:center;font-size:1.15em">${item.q}</span>`, html: wrap, speak: false });
    Guide.say(item.q);
  };
  ask();
}

// ---------------------------------------------------------------- certificate
function showCertificate() {
  teardown();
  chrome({ top: true, guide: false });
  $('levelTitle').innerHTML = '<b>獎狀</b>';
  setBg('bg_kitchen');
  ctx = makeCtx(() => {});
  const total = Save.data.stars.reduce((a, b) => a + (b || 0), 0);
  for (let i = 0; i < 4; i++) ctx.later(i * 350, () => FX.burst(150 + Math.random() * 700, 200 + Math.random() * 300, { n: 14, spread: 100 }));
  Snd.fanfare();
  const steps = LEVELS.map((l, i) => `<span class="step">${i + 1}. ${l.name}</span>`).join('<span class="arrow">→</span>');
  UI.card({
    art: SPR.char_maomao_cheer
      ? `<g transform="translate(-18 -4)">${picMarkup('char_maomao_cheer', 'chef', 110)}</g><g transform="translate(38 34)">${picMarkup('tofu_fried', 'fry', 46)}</g>`
      : `<g transform="translate(-22 0) scale(.62)">${Art.mascotInner()}</g><g transform="translate(34 30) scale(.55)">${Art.friedTofu({ sauce: true })}</g>`,
    title: '毛豆腐小師傅',
    stars: 3,
    text: `<span style="display:block;text-align:center;font-size:1.1em">恭喜你學會做<b>毛豆腐</b>！一共拿到 <b>${total}</b> 顆星星</span>
      <span class="steps">${steps}</span>
      <span style="display:block;font-size:.85em;color:#9A6A3A">小提醒：在家做發酵的食物，一定要請<b>大人</b>幫忙喔！</span>`,
    buttons: [
      { label: '回地圖', alt: true, onClick: () => showMap() },
      { label: '從頭再玩', onClick: () => startLevel(0) },
    ],
    speak: false,
  });
  Voice.say('恭喜你！你是毛豆腐小師傅囉！做毛豆腐的八個步驟，你全部都學會了，好厲害喔！');
}

// ---------------------------------------------------------------- top bar
$('btnHome').addEventListener('click', () => { Snd.init(); Snd.click(); homeAction(); });
$('btnVoice').addEventListener('click', () => {
  Voice.on = !Voice.on;
  $('btnVoice').classList.toggle('off', !Voice.on);
  if (!Voice.on) Voice.stop(); else Voice.say(Guide.last);
});
$('btnMusic').addEventListener('click', () => {
  Snd.init();
  Snd.musicOn = !Snd.musicOn;
  $('btnMusic').classList.toggle('off', !Snd.musicOn);
  if (Snd.musicOn) Snd.startMusic(); else Snd.stopMusic();
});

Guide.init();
if (params.has('level')) {
  const n = clamp(parseInt(params.get('level'), 10) || 1, 1, LEVELS.length) - 1;
  Save.data.unlocked = Math.max(Save.data.unlocked, n);
  startLevel(n);
} else if (params.has('quiz')) startQuiz();
else if (params.get('mode') === 'points') showPointsIntro();
else showTitle();
