// Rules for the bean-picking points battle ("挑豆豆大對決"). No DOM code here, so
// tests/points.test.mjs can check the rules in Node. Uses rng() from art.js.
const POINTS = {
  DURATION: 90,
  // Every 30 seconds items come more often and fall faster.
  // every = seconds between items (±20 %); speed = arena heights fallen per second.
  PHASES: [
    { until: 30, every: 1.1, speed: 0.3 },
    { until: 60, every: 0.85, speed: 0.4 },
    { until: 90, every: 0.65, speed: 0.52 },
  ],
  SCORES: { good: 10, gold: 30 }, // anything else is a bad thing: 0 points and the combo ends
  BAD: ['bad', 'stone', 'leaf'],
  COMBO_FROM: 5, // the 5th good catch in a row and every one after it earn the bonus
  COMBO_BONUS: 5,
  // Calibrated by tests/points.test.mjs: at least 90 % of children catching 35 % of the good
  // beans earn bronze, 60 % silver and 85 % gold.
  MEDALS: [['gold', 700], ['silver', 400], ['bronze', 150]],
};

const phaseAt = t => POINTS.PHASES.find(p => t < p.until) || POINTS.PHASES[POINTS.PHASES.length - 1];

// The drop sequence for one game: [{ t, type, x, speed }], x = 0..1 across the arena.
// Both players get the same plan, so the match is fair.
function spawnPlan(seed, duration = POINTS.DURATION) {
  const r = rng(seed);
  const plan = [];
  let t = 1, phase = null, goldAt = 0;
  for (;;) {
    const ph = phaseAt(t);
    if (t + 1 / ph.speed > duration) break; // it would land after the whistle
    if (ph !== phase) { // one golden bean somewhere in every phase
      phase = ph;
      const i = POINTS.PHASES.indexOf(ph);
      const start = i ? POINTS.PHASES[i - 1].until : 0;
      goldAt = start + 4 + r() * (ph.until - start - 12);
    }
    let type;
    if (goldAt && t >= goldAt) { type = 'gold'; goldAt = 0; }
    else if (r() < 0.27) type = POINTS.BAD[Math.floor(r() * POINTS.BAD.length)];
    else type = 'good';
    plan.push({ t: Math.round(t * 100) / 100, type, x: Math.round((0.12 + r() * 0.76) * 1000) / 1000, speed: ph.speed });
    t += ph.every * (0.8 + r() * 0.4);
  }
  return plan;
}

const newScore = () => ({ score: 0, combo: 0, caught: 0 });

// A caught item: returns the points gained. Bad things give 0 and end the combo.
function scoreCatch(s, type) {
  if (!(type in POINTS.SCORES)) { s.combo = 0; return 0; }
  s.combo++;
  s.caught++;
  const gained = POINTS.SCORES[type] + (s.combo >= POINTS.COMBO_FROM ? POINTS.COMBO_BONUS : 0);
  s.score += gained;
  return gained;
}

// An item that hit the floor: a missed good or golden bean ends the combo (no points lost).
function scoreMiss(s, type) {
  if (type in POINTS.SCORES) s.combo = 0;
}

function medalFor(score) {
  const m = POINTS.MEDALS.find(([, min]) => score >= min);
  return m ? m[0] : null;
}
