// Shared vector artwork. Every function returns SVG markup drawn around the origin.
const INK = '#5A3418';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const Art = {
  // Mascot "毛毛": a little tofu cube with a fluffy mould tuft and a red scarf.
  mascot() {
    return `<svg viewBox="-70 -95 140 150" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="2" cy="48" rx="46" ry="7" fill="#5A3418" opacity=".18"/>
      <g class="bob">
        <ellipse cx="-22" cy="44" rx="11" ry="6" fill="#F3E6CB" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="22" cy="44" rx="11" ry="6" fill="#F3E6CB" stroke="${INK}" stroke-width="3"/>
        <path d="M-44 -6 q-16 4 -14 18 q8 2 14 -8" fill="#FBF4E4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M44 -2 q16 -12 18 -26 q-10 -2 -16 12" fill="#E9DBBE" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M-44 -36 L-30 -52 H58 L44 -36 Z" fill="url(#gTofuTop)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M44 -36 L58 -52 V26 L44 42 Z" fill="url(#gTofuSide)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <rect x="-44" y="-36" width="88" height="78" rx="12" fill="url(#gTofuFront)" stroke="${INK}" stroke-width="3"/>
        <g fill="#D9C7A0" opacity=".6"><circle cx="-30" cy="28" r="1.8"/><circle cx="-22" cy="34" r="1.2"/><circle cx="30" cy="30" r="1.6"/><circle cx="34" cy="-22" r="1.2"/></g>
        <!-- fluffy mould tuft -->
        <g transform="translate(8 -58)">
          <path d="M-30 6 q-6 -14 8 -16 q2 -14 18 -10 q8 -12 22 -2 q14 -4 16 10 q10 4 2 16 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
          <g stroke="#C9C2B4" stroke-width="1.6" stroke-linecap="round" fill="none">
            <path d="M-16 -2 q2 -8 -2 -14"/><path d="M-2 -6 q4 -8 0 -16"/><path d="M14 -4 q6 -6 4 -14"/><path d="M26 2 q8 -4 8 -10"/>
          </g>
          <g fill="#3A3633"><circle cx="-6" cy="-14" r="1.6"/><circle cx="10" cy="-18" r="1.4"/><circle cx="22" cy="-8" r="1.3"/></g>
        </g>
        <!-- scarf -->
        <path d="M-44 14 q44 14 88 0 v10 q-44 14 -88 0 Z" fill="#E8503A" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M24 22 l10 20 l8 -6 l-6 -16" fill="#F26A4F" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
        <g fill="#FFD9C9" opacity=".8"><circle cx="-26" cy="20" r="2"/><circle cx="-6" cy="24" r="2"/><circle cx="14" cy="23" r="2"/></g>
        <!-- face -->
        <ellipse cx="-27" cy="2" rx="9" ry="6" fill="url(#gCheek)"/>
        <ellipse cx="27" cy="2" rx="9" ry="6" fill="url(#gCheek)"/>
        <g class="blink">
          <ellipse cx="-15" cy="-12" rx="7.5" ry="9.5" fill="#3A2210"/>
          <ellipse cx="15" cy="-12" rx="7.5" ry="9.5" fill="#3A2210"/>
          <circle cx="-12.5" cy="-15.5" r="3" fill="#fff"/><circle cx="17.5" cy="-15.5" r="3" fill="#fff"/>
          <circle cx="-17" cy="-8" r="1.4" fill="#fff"/><circle cx="13" cy="-8" r="1.4" fill="#fff"/>
        </g>
        <path d="M-8 2 q8 9 16 0 q-8 3 -16 0Z" fill="#C8473A" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      </g>
    </svg>`;
  },

  // Warm Huizhou kitchen. night=true gives a moonlit window.
  kitchen({ night = false } = {}) {
    const r = rng(11);
    let grain = '';
    for (let i = 0; i < 14; i++) {
      const y = 505 + r() * 185, x = r() * 900;
      grain += `<path d="M${x} ${y} q60 ${-6 + r() * 12} 120 0 t120 0" stroke="#8E5326" stroke-width="${1 + r() * 1.5}" fill="none" opacity=".35"/>`;
    }
    let stars = '';
    if (night) for (let i = 0; i < 9; i++) stars += `<circle class="twinkle" style="animation-delay:${(i * .37).toFixed(2)}s" cx="${750 + r() * 180}" cy="${90 + r() * 90}" r="${1.4 + r() * 1.6}" fill="#FFF6C8"/>`;
    let chili = '';
    for (let i = 0; i < 6; i++) {
      const y = 70 + i * 30, s = i % 2 ? 1 : -1;
      chili += `<g transform="translate(${690 + s * 6} ${y}) rotate(${s * 18})"><path d="M0 0 q${s * 14} 10 ${s * 4} 30 q${-s * 12} -12 ${-s * 4} -30Z" fill="url(#gChili)" stroke="${INK}" stroke-width="1.8"/><path d="M0 0 q-2 -6 2 -9" stroke="#3E8A3A" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    }
    return `
      <rect x="0" y="0" width="1000" height="500" fill="url(#gWall)"/>
      <g opacity=".12" filter="url(#fSoft)"><ellipse cx="160" cy="400" rx="140" ry="60" fill="#C9935B"/><ellipse cx="560" cy="120" rx="160" ry="50" fill="#E3B47C"/></g>
      <rect x="0" y="0" width="1000" height="36" fill="url(#gBeam)"/>
      <path d="M0 36 H1000" stroke="#3E2210" stroke-width="3"/>
      <g stroke="#3E2210" stroke-width="1.5" opacity=".35" fill="none"><path d="M40 12 q120 -6 260 4"/><path d="M420 22 q160 -8 330 2"/><path d="M800 10 q90 6 180 0"/></g>
      <!-- window with Huangshan view -->
      <g transform="translate(730 64)">
        <rect x="-10" y="-10" width="240" height="250" rx="10" fill="#6B3E1E" filter="url(#fShadow)"/>
        <rect x="0" y="0" width="220" height="230" fill="url(#${night ? 'gNightSky' : 'gSky'})"/>
        ${night ? `<circle cx="160" cy="52" r="24" fill="#FFF4C4"/><circle cx="170" cy="46" r="22" fill="#2B3A70"/>` : `<circle cx="168" cy="54" r="26" fill="#FFE07A"/><circle cx="168" cy="54" r="40" fill="url(#gGlow)"/>`}
        ${stars ? `<g transform="translate(-730 -64)">${stars}</g>` : ''}
        <path d="M0 160 L30 92 L52 120 L84 60 L112 112 L140 80 L176 130 L220 98 V230 H0Z" fill="url(#gMount1)" opacity="${night ? .5 : 1}"/>
        <path d="M0 190 L40 140 L70 162 L110 120 L150 170 L190 140 L220 160 V230 H0Z" fill="url(#gMount2)" opacity="${night ? .55 : 1}"/>
        ${night ? '' : `<g fill="#fff" opacity=".9"><ellipse cx="60" cy="88" rx="26" ry="8"/><ellipse cx="78" cy="82" rx="16" ry="8"/><ellipse cx="150" cy="140" rx="30" ry="7"/></g>`}
        <g transform="translate(0 182)">
          <rect x="18" y="8" width="70" height="40" fill="#F8F6F0"/><path d="M14 8 h14 v-10 h16 v10 h20 v-10 h16 v10 h12" fill="none" stroke="#2E2B2A" stroke-width="5"/>
          <rect x="120" y="0" width="80" height="48" fill="#F2F0EA"/><path d="M116 0 h18 v-10 h20 v10 h22 v-10 h18 v10 h10" fill="none" stroke="#2E2B2A" stroke-width="5"/>
          <rect x="44" y="24" width="12" height="16" fill="#3A3A3A"/><rect x="150" y="18" width="14" height="18" fill="#3A3A3A"/>
        </g>
        <g fill="none" stroke="#6B3E1E" stroke-width="8"><path d="M110 0 V230 M0 115 H220"/></g>
        <g fill="none" stroke="#8A5530" stroke-width="3"><rect x="4" y="4" width="212" height="222"/><path d="M4 30 q26 0 26 -26 M216 30 q-26 0 -26 -26 M4 200 q26 0 26 26 M216 200 q-26 0 -26 26"/></g>
        <rect x="-18" y="236" width="256" height="14" rx="5" fill="#8A5530" stroke="#5E3519" stroke-width="2"/>
      </g>
      <path d="M690 36 V250" stroke="#B48A58" stroke-width="2.5"/>
      ${chili}
      <!-- shelf with jars -->
      <g transform="translate(40 168)">
        <rect x="0" y="0" width="290" height="16" rx="4" fill="url(#gWoodV)" stroke="#6B3E1E" stroke-width="2.5"/>
        <path d="M30 16 v26 l18 -26 M250 16 v26 l-18 -26" fill="#9C6031" stroke="#6B3E1E" stroke-width="2.5" stroke-linejoin="round"/>
        <g transform="translate(58 0)">
          <path d="M-26 0 q-8 -40 6 -62 h40 q14 22 6 62Z" fill="url(#gJar)" stroke="${INK}" stroke-width="2.5"/>
          <rect x="-22" y="-70" width="44" height="10" rx="4" fill="#5C341B" stroke="${INK}" stroke-width="2"/>
          <rect x="-14" y="-44" width="28" height="26" fill="#F4E3BE" stroke="#8A5530" stroke-width="1.5"/>
          <text x="0" y="-25" font-size="17" text-anchor="middle" fill="#B23A22" font-weight="900">醬</text>
        </g>
        <g transform="translate(140 0)">
          <path d="M-24 0 q-12 -30 0 -50 h48 q12 20 0 50Z" fill="url(#gCeramic)" stroke="${INK}" stroke-width="2.5"/>
          <path d="M-18 -28 q18 -10 36 0" stroke="#3E6FB0" stroke-width="3" fill="none"/><path d="M-14 -16 q14 8 28 0" stroke="#3E6FB0" stroke-width="2.5" fill="none"/>
          <ellipse cx="0" cy="-52" rx="22" ry="5" fill="#D8D1C2" stroke="${INK}" stroke-width="2"/>
          <text x="0" y="-33" font-size="14" text-anchor="middle" fill="#2F5F9E" font-weight="900">鹽</text>
        </g>
        <g transform="translate(222 0)">
          <ellipse cx="0" cy="-20" rx="20" ry="20" fill="#E9B85A" stroke="${INK}" stroke-width="2.5"/>
          <ellipse cx="0" cy="-48" rx="12" ry="12" fill="#E9B85A" stroke="${INK}" stroke-width="2.5"/>
          <path d="M0 -60 q4 -8 10 -8" stroke="#6B8A2A" stroke-width="3" fill="none" stroke-linecap="round"/>
          <ellipse cx="-6" cy="-26" rx="5" ry="8" fill="#FFF0B8" opacity=".6"/>
        </g>
      </g>
      <!-- table -->
      <rect x="0" y="470" width="1000" height="16" fill="#5A3418" opacity=".08" filter="url(#fBlur2)"/>
      <rect x="0" y="482" width="1000" height="218" fill="url(#gTable)"/>
      <rect x="0" y="482" width="1000" height="12" fill="url(#gTableEdge)"/>
      <path d="M0 494 H1000" stroke="#8E5326" stroke-width="2" opacity=".6"/>
      <g stroke="#7E4620" stroke-width="2.5" opacity=".45"><path d="M250 494 V700"/><path d="M520 494 V700"/><path d="M790 494 V700"/></g>
      ${grain}
      ${night ? '<rect x="0" y="0" width="1000" height="700" fill="#14204A" opacity=".38"/>' : ''}
    `;
  },

  bean({ face = false, wet = false } = {}) {
    return `<g>
      <ellipse cx="2" cy="16" rx="20" ry="5" fill="#5A3418" opacity=".15"/>
      <ellipse rx="22" ry="17" fill="url(#${wet ? 'gBeanWet' : 'gBean'})" stroke="#9A6A22" stroke-width="2.2"/>
      <path d="M8 -12 q8 4 10 12" stroke="#B07A2A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="-9" cy="-7" rx="8" ry="3.5" fill="#FFF8DA" opacity=".85" transform="rotate(-24 -9 -7)"/>
      ${face ? `<g class="blink"><circle cx="-6" cy="1" r="2.6" fill="#3A2210"/><circle cx="6" cy="1" r="2.6" fill="#3A2210"/></g>
        <path d="M-3 6 q3 3 6 0" stroke="#3A2210" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="-11" cy="6" rx="3.5" ry="2" fill="#FF9FA8" opacity=".7"/><ellipse cx="11" cy="6" rx="3.5" ry="2" fill="#FF9FA8" opacity=".7"/>` : ''}
    </g>`;
  },

  // Oblique tofu cube. The front face is centred on the origin.
  // Faces carry classes so their colours can be changed while frying.
  tofu(w = 60, h = 40, d = 34, { pores = true, seed = 1 } = {}) {
    const x = -w / 2, y = -h / 2, dx = d * 0.45, dy = -d * 0.55;
    const r = rng(seed);
    let dots = '';
    if (pores) for (let i = 0; i < 5; i++) dots += `<circle cx="${(x + 5 + r() * (w - 10)).toFixed(1)}" cy="${(y + 5 + r() * (h - 10)).toFixed(1)}" r="${(0.8 + r() * 1.2).toFixed(1)}"/>`;
    return `<g class="tofu">
      <ellipse cx="${dx / 2}" cy="${h / 2 + 4}" rx="${w * 0.62}" ry="${Math.max(5, h * 0.14)}" fill="#5A3418" opacity=".16"/>
      <path class="tf-top" d="M${x} ${y} L${x + dx} ${y + dy} H${x + w + dx} L${x + w} ${y} Z" fill="url(#gTofuTop)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path class="tf-side" d="M${x + w} ${y} L${x + w + dx} ${y + dy} V${y + h + dy} L${x + w} ${y + h} Z" fill="url(#gTofuSide)" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <rect class="tf-front" x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#gTofuFront)" stroke="${INK}" stroke-width="2.4"/>
      <path d="M${x + 4} ${y + 4} h${w * 0.4}" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
      <g fill="#CDB98F" opacity=".55">${dots}</g>
    </g>`;
  },

  // Mucor "hair" for a tofu cube with the same geometry as Art.tofu.
  // Each strand uses pathLength=1 so growth is just stroke-dashoffset.
  hair(w = 60, h = 40, d = 34, { seed = 3, count = 70, long = 1 } = {}) {
    const x = -w / 2, y = -h / 2, dx = d * 0.45, dy = -d * 0.55;
    const r = rng(seed);
    let s = '';
    const strand = (px, py, ang, len, col) => {
      len *= long;
      const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len;
      const bend = (r() - 0.5) * len * 0.8;
      const mx = (px + ex) / 2 + Math.cos(ang + Math.PI / 2) * bend, my = (py + ey) / 2 + Math.sin(ang + Math.PI / 2) * bend;
      s += `<path class="hs" pathLength="1" d="M${px.toFixed(1)} ${py.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${col}"/>`;
    };
    const cols = ['#FFFFFF', '#FBFAF6', '#F1EEE6', '#E6E2D8'];
    const n = count;
    for (let i = 0; i < n * 0.4; i++) { // top face, standing up
      const u = r(), v = r();
      const px = x + u * w + v * dx, py = y + v * dy;
      strand(px, py, -Math.PI / 2 + (r() - 0.5) * 1.3, 7 + r() * 12, cols[i % 4]);
    }
    for (let i = 0; i < n * 0.25; i++) { // upper silhouette
      const u = r();
      const px = x + dx + u * w, py = y + dy;
      strand(px, py, -Math.PI / 2 + (r() - 0.5) * 1.6, 9 + r() * 12, cols[i % 4]);
    }
    for (let i = 0; i < n * 0.15; i++) { // left edge
      const v = r();
      strand(x, y + v * h, Math.PI + (r() - 0.5) * 1.2, 6 + r() * 9, cols[i % 4]);
    }
    for (let i = 0; i < n * 0.15; i++) { // right side face
      const v = r();
      strand(x + w + dx, y + dy + v * h, (r() - 0.5) * 1.2, 6 + r() * 9, cols[i % 4]);
    }
    for (let i = 0; i < n * 0.3; i++) { // front face fuzz
      const px = x + 4 + r() * (w - 8), py = y + 4 + r() * (h - 8);
      strand(px, py, -Math.PI / 2 + (r() - 0.5) * 2.6, 4 + r() * 6, cols[i % 4]);
    }
    let spores = '';
    for (let i = 0; i < 7; i++) {
      const u = r(), v = r();
      spores += `<circle cx="${(x + u * w + v * dx).toFixed(1)}" cy="${(y + v * dy - 8 - r() * 8).toFixed(1)}" r="${(1 + r()).toFixed(1)}"/>`;
    }
    return `<g class="hair">
      <path class="halo" d="M${x - 6} ${y + 2} L${x + dx - 4} ${y + dy - 10} H${x + w + dx + 8} V${y + h + dy + 4} L${x + w + 4} ${y + h + 4} H${x - 6} Z" fill="#FFFFFF" opacity="0" filter="url(#fBlur2)"/>
      <g fill="none" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1">${s}</g>
      <g class="spores" fill="#4A4440" opacity="0">${spores}</g>
    </g>`;
  },

  hand() {
    return `<g class="hand" filter="url(#fShadow)">
      <path d="M0 0 q-7 2 -6 10 l4 30 q-14 -8 -18 2 q-2 6 6 12 l20 18 q8 8 22 6 l12 -2 q16 -4 16 -22 l-2 -24 q-1 -8 -9 -8 q-6 0 -7 6 q-1 -9 -9 -9 q-7 0 -8 7 q-2 -8 -10 -7 q-5 1 -6 6 l-3 -26 q-1 -8 -8 -8Z"
        fill="#FFFFFF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 34 v10 M24 34 v10 M34 36 v9" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    </g>`;
  },

  steam(n = 3, spread = 40, h = 30) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * spread;
      s += `<path class="steam" style="animation-delay:${(i * 0.8).toFixed(1)}s" d="M${x} 0 q-10 -${h / 3} 0 -${h * 2 / 3} t0 -${h * 2 / 3}" stroke="#FFFFFF" stroke-width="7" fill="none" stroke-linecap="round" opacity=".7"/>`;
    }
    return `<g pointer-events="none">${s}</g>`;
  },

  flames(scale = 1) {
    return `<g transform="scale(${scale})" pointer-events="none">
      <path class="flicker" d="M-46 0 q-10 -40 14 -66 q-4 30 16 36 q-6 -40 22 -64 q2 40 22 50 q6 -24 -2 -40 q30 26 22 84Z" fill="url(#gFire)"/>
      <path class="flicker" style="animation-delay:.15s" d="M-24 0 q-6 -26 10 -42 q0 20 12 22 q0 -24 16 -38 q4 30 14 40 q8 -10 4 -20 q14 18 8 38Z" fill="#FFE27A" opacity=".9"/>
    </g>`;
  },

  // Brick stove (灶台). Top surface centre is at (0,0); the fire box sits below.
  stove() {
    let bricks = '';
    for (let row = 0; row < 6; row++) {
      const y = 20 + row * 30;
      bricks += `<path d="M-232 ${y} H232" stroke="#B9AD95" stroke-width="2" opacity=".7"/>`;
      for (let c = 0; c < 9; c++) {
        const x = -232 + (row % 2 ? 26 : 0) + c * 52;
        if (x > -232 && x < 232) bricks += `<path d="M${x} ${y - 30} V${y}" stroke="#B9AD95" stroke-width="2" opacity=".7"/>`;
      }
    }
    return `<g>
      <rect x="-240" y="-36" width="480" height="40" rx="12" fill="#D2C3A6" stroke="${INK}" stroke-width="3"/>
      <rect x="-232" y="0" width="464" height="200" fill="url(#gBrick)" stroke="${INK}" stroke-width="3"/>
      ${bricks}
      <path d="M-70 200 V130 q70 -60 140 0 V200Z" fill="#2A1A10" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="0" cy="196" rx="60" ry="10" fill="#FF8A2A" opacity=".55" filter="url(#fBlur2)"/>
      <g class="stoveFire" transform="translate(0 196)">${Art.flames(0.9)}</g>
      <path d="M-232 14 H232" stroke="${INK}" stroke-width="2" opacity=".4"/>
    </g>`;
  },

  sparkleStar(r = 14, col = '#FFD84A') {
    return `<path d="M0 ${-r} Q${r * 0.18} ${-r * 0.18} ${r} 0 Q${r * 0.18} ${r * 0.18} 0 ${r} Q${-r * 0.18} ${r * 0.18} ${-r} 0 Q${-r * 0.18} ${-r * 0.18} 0 ${-r}Z" fill="${col}" stroke="#C98A14" stroke-width="1.5"/>`;
  },

  // Small icons for the level map, quiz and cards (drawn in a 100x100 box centred on 0,0).
  icon(name) {
    switch (name) {
      case 'soak': return `<g transform="translate(0 6)">
        <path d="M-40 -6 q0 40 40 40 q40 0 40 -40Z" fill="url(#gCeramic)" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="0" cy="-6" rx="40" ry="12" fill="url(#gWater)" stroke="${INK}" stroke-width="3"/>
        <g transform="translate(-14 -8) scale(.5)">${Art.bean({ wet: true })}</g><g transform="translate(10 -10) scale(.5)">${Art.bean({ wet: true })}</g><g transform="translate(-2 -2) scale(.5)">${Art.bean({ wet: true })}</g>
        <path d="M-30 18 q30 10 60 0" stroke="#3E6FB0" stroke-width="3" fill="none"/></g>`;
      case 'grind': return `<g transform="translate(0 4)">
        <ellipse cx="0" cy="22" rx="44" ry="12" fill="#9F988C" stroke="${INK}" stroke-width="3"/>
        <path d="M-30 0 v18 q30 10 60 0 v-18" fill="url(#gStoneSide)" stroke="${INK}" stroke-width="3"/>
        <path d="M-30 -14 v14 q30 10 60 0 v-14" fill="url(#gStoneSide)" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="0" cy="-14" rx="30" ry="9" fill="url(#gStone)" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="-8" cy="-15" rx="5" ry="2.5" fill="#5E584F"/>
        <path d="M26 -6 l14 -2 v-26" stroke="#8F5528" stroke-width="6" fill="none" stroke-linecap="round"/>
        <path d="M44 26 q4 8 0 14" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>`;
      case 'boil': return `<g transform="translate(0 8)">
        <path d="M-40 -10 q0 36 40 36 q40 0 40 -36Z" fill="url(#gIron)" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="0" cy="-10" rx="40" ry="11" fill="url(#gMilk)" stroke="${INK}" stroke-width="3"/>
        <circle cx="-10" cy="-12" r="4" fill="#fff" stroke="#D9CCAE"/><circle cx="8" cy="-9" r="3" fill="#fff" stroke="#D9CCAE"/>
        <g transform="translate(0 -18)">${Art.steam(3, 18, 26)}</g>
        <g transform="translate(0 40) scale(.4)">${Art.flames(1)}</g></g>`;
      case 'curd': return `<g transform="translate(0 8)">
        <path d="M-42 -8 q0 38 42 38 q42 0 42 -38Z" fill="url(#gJar)" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="0" cy="-8" rx="42" ry="12" fill="url(#gWhey)" stroke="${INK}" stroke-width="3"/>
        <g fill="#FFFDF5" stroke="#E2D6B6" stroke-width="1.5"><ellipse cx="-14" cy="-8" rx="12" ry="5"/><ellipse cx="10" cy="-10" rx="10" ry="4"/><ellipse cx="2" cy="-4" rx="9" ry="4"/></g>
        <g transform="translate(26 -30) rotate(35)"><rect x="-8" y="-20" width="16" height="26" rx="4" fill="#DDEAF2" stroke="${INK}" stroke-width="2.5"/><circle cx="0" cy="12" r="3" fill="#BFE7F7"/></g></g>`;
      case 'press': return `<g transform="translate(0 8)">
        <rect x="-42" y="-6" width="84" height="32" rx="3" fill="url(#gWoodV)" stroke="${INK}" stroke-width="3"/>
        <path d="M-30 -6 V26 M-10 -6 V26 M10 -6 V26 M30 -6 V26" stroke="#8F5528" stroke-width="2"/>
        <rect x="-36" y="-14" width="72" height="10" rx="2" fill="#C98647" stroke="${INK}" stroke-width="2.5"/>
        <ellipse cx="0" cy="-30" rx="26" ry="16" fill="url(#gStone)" stroke="${INK}" stroke-width="3"/>
        <path d="M-48 16 q-6 6 -2 12 M48 16 q6 6 2 12" stroke="#7CC6E6" stroke-width="4" stroke-linecap="round" fill="none"/></g>`;
      case 'cut': return `<g transform="translate(-6 10)">
        <g transform="scale(1.05)">${Art.tofu(70, 26, 40, { pores: false })}</g>
        <path d="M-12 -30 v44 M12 -32 v44" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>
        <g transform="translate(26 -38) rotate(30)"><rect x="-6" y="-38" width="12" height="20" rx="3" fill="#8F5528" stroke="${INK}" stroke-width="2.5"/><path d="M-9 -18 h18 l-2 36 q-7 6 -14 0Z" fill="#DDE3E8" stroke="${INK}" stroke-width="2.5"/></g></g>`;
      case 'ferment': return `<g transform="translate(-6 10)">
        <g transform="scale(1.15)">${Art.tofu(56, 30, 36, { pores: false })}${Art.hair(56, 30, 36, { seed: 9, count: 90 }).replace('stroke-dashoffset="1"', 'stroke-dashoffset="0"').replace('class="halo"', 'class="halo" style="opacity:.8"').replace('class="spores" fill="#4A4440" opacity="0"', 'class="spores" fill="#4A4440" opacity=".8"')}</g></g>`;
      case 'fry': return `<g transform="translate(-4 6)">
        <ellipse cx="0" cy="6" rx="44" ry="22" fill="url(#gPanIn)" stroke="${INK}" stroke-width="3"/>
        <path d="M40 8 l34 -10" stroke="#3A2A20" stroke-width="9" stroke-linecap="round"/>
        <g transform="translate(-14 2) scale(.5)">${Art.friedTofu()}</g><g transform="translate(14 8) scale(.5)">${Art.friedTofu()}</g>
        <g transform="translate(0 -16)">${Art.steam(2, 24, 24)}</g></g>`;
      case 'chef': return `<g transform="translate(0 0) scale(.75)"><g transform="translate(0 6)">${Art.mascotInner()}</g></g>`;
      default: return '';
    }
  },

  // The mascot drawing without its own <svg> wrapper, for embedding inside other SVG.
  mascotInner() {
    const m = Art.mascot();
    return m.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  },

  // Top-view golden fried tofu with chili sauce option (for icons and the final plate).
  friedTofu({ sauce = false } = {}) {
    return `<g>
      <rect x="-30" y="-24" width="60" height="48" rx="8" fill="#B0601C" stroke="${INK}" stroke-width="2.6"/>
      <rect x="-26" y="-22" width="52" height="40" rx="7" fill="#E8A23A"/>
      <path d="M-20 -14 q10 -6 26 -2 M-18 2 q14 -6 30 0" stroke="#FFD27A" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>
      <g fill="#C67624" opacity=".7"><circle cx="-12" cy="8" r="2"/><circle cx="10" cy="-6" r="1.6"/><circle cx="16" cy="10" r="2"/></g>
      ${sauce ? `<path d="M-14 -6 q6 -10 18 -4 q10 2 6 12 q-4 8 -16 4 q-12 -2 -8 -12Z" fill="url(#gChili)" stroke="#8A1E10" stroke-width="1.5"/>
        <g fill="#5BAE4A" stroke="#2F6E2A" stroke-width="1"><rect x="-6" y="-4" width="6" height="3" rx="1.5" transform="rotate(20)"/><rect x="4" y="0" width="6" height="3" rx="1.5" transform="rotate(-30)"/></g>
        <g fill="#FFE2B8"><circle cx="-4" cy="-6" r="1.4"/><circle cx="6" cy="2" r="1.2"/></g>` : ''}
    </g>`;
  },
};
