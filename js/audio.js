// Sound effects and background music synthesized with Web Audio (no audio files).
const Snd = {
  ctx: null, master: null, sfxOn: true, musicOn: true, musicTimer: null,

  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
      } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone(freq, dur, { type = 'sine', vol = 0.2, delay = 0, slide = null, attack = 0.01 } = {}) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.05);
  },

  noiseBuffer() {
    if (this._nb) return this._nb;
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (this._nb = b);
  },

  noise(dur, { vol = 0.2, freq = 1200, q = 1, type = 'bandpass', delay = 0 } = {}) {
    if (!this.ctx || !this.sfxOn) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer();
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },

  // Continuous sizzle for frying; returns a stop function.
  loopNoise({ vol = 0.08, freq = 5000, q = 0.7 } = {}) {
    if (!this.ctx || !this.sfxOn) return { set() {}, stop() {} };
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuffer(); s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain(); g.gain.value = 0.0001;
    s.connect(f).connect(g).connect(this.master); s.start();
    g.gain.exponentialRampToValueAtTime(vol, this.ctx.currentTime + 0.3);
    const ctx = this.ctx;
    return {
      set(v) { g.gain.setTargetAtTime(Math.max(v, 0.0001), ctx.currentTime, 0.2); },
      stop() { g.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.15); setTimeout(() => s.stop(), 600); },
    };
  },

  click() { this.tone(660, 0.08, { type: 'triangle', vol: 0.15 }); },
  pop() { this.tone(520, 0.12, { type: 'sine', vol: 0.25, slide: 980 }); },
  plop() { this.tone(900, 0.18, { type: 'sine', vol: 0.25, slide: 260 }); this.noise(0.15, { vol: 0.06, freq: 1800 }); },
  drip() { this.tone(1300, 0.1, { vol: 0.12, slide: 700 }); },
  grind() { this.noise(0.25, { vol: 0.18, freq: 300, q: 0.8, type: 'lowpass' }); this.tone(70, 0.22, { type: 'sawtooth', vol: 0.05 }); },
  chop() { this.noise(0.09, { vol: 0.35, freq: 2500, q: 2 }); this.tone(180, 0.08, { type: 'square', vol: 0.06 }); },
  thud() { this.tone(110, 0.25, { vol: 0.35, slide: 55 }); this.noise(0.12, { vol: 0.15, freq: 400, type: 'lowpass' }); },
  squish() { this.noise(0.3, { vol: 0.16, freq: 900, q: 3 }); this.tone(300, 0.2, { vol: 0.08, slide: 140 }); },
  whoosh() { this.noise(0.35, { vol: 0.14, freq: 1500, q: 0.6 }); },
  bubble() { this.tone(400 + Math.random() * 300, 0.09, { vol: 0.12, slide: 900 }); },
  crackle() { this.noise(0.06, { vol: 0.2, freq: 3000, q: 4 }); },
  sparkle() { [1568, 2093, 2637].forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', vol: 0.08, delay: i * 0.06 })); },
  wrong() { this.tone(330, 0.18, { type: 'triangle', vol: 0.16 }); this.tone(262, 0.25, { type: 'triangle', vol: 0.16, delay: 0.14 }); },
  success() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, { type: 'triangle', vol: 0.16, delay: i * 0.1 })); },
  fanfare() {
    [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.16, delay: i * 0.13 }));
    [262, 330, 392].forEach((f, i) => this.tone(f, 0.9, { type: 'sine', vol: 0.08, delay: 0.65 + i * 0.02 }));
  },

  // Gentle pentatonic music box loop.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const scale = [523, 587, 659, 784, 880, 1047];
    const tune = [0, 2, 3, 2, 4, 3, 2, 0, 1, 2, 3, 1, 2, -1, 0, -1];
    let i = 0;
    const step = () => {
      if (!this.musicOn) return;
      const n = tune[i % tune.length];
      if (n >= 0) {
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = scale[n] / 2;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
        o.connect(g).connect(this.master); o.start(t); o.stop(t + 1);
        if (i % 4 === 0) {
          const b = this.ctx.createOscillator(); const bg = this.ctx.createGain();
          b.type = 'triangle'; b.frequency.value = scale[[0, 3, 1, 0][(i / 4) % 4]] / 4;
          bg.gain.setValueAtTime(0.0001, t); bg.gain.exponentialRampToValueAtTime(0.03, t + 0.03);
          bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
          b.connect(bg).connect(this.master); b.start(t); b.stop(t + 1.7);
        }
      }
      i++;
    };
    this.musicTimer = setInterval(step, 420);
  },
  stopMusic() { clearInterval(this.musicTimer); this.musicTimer = null; },
};

// Chinese narration with the browser's built-in speech synthesis.
// macOS/iOS ship low-quality novelty voices (Eddy, Flo, Grandma...) next to the good ones,
// so voices are ranked instead of taking the first Chinese match.
const NOVELTY_VOICE = /eddy|flo\b|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|fred|kathy/i;
function voiceScore(v) {
  if (!/^(zh|cmn)/i.test(v.lang)) return -1;
  const id = `${v.name} ${v.voiceURI}`;
  let s = 0;
  if (/(zh|cmn)[-_](TW|Hant)/i.test(v.lang)) s += 40;
  else if (/(zh|cmn)[-_](CN|Hans)/i.test(v.lang)) s += 25;
  else if (/[-_](HK|yue)/i.test(v.lang)) s -= 30; // Cantonese voices do not read Mandarin
  if (NOVELTY_VOICE.test(v.name) || /eloquence|novelty/i.test(v.voiceURI)) s -= 80;
  if (/natural|neural/i.test(id)) s += 40; // Edge / Windows neural voices
  if (/premium|高品質/i.test(id)) s += 30;
  else if (/enhanced|增強/i.test(id)) s += 20;
  if (/google/i.test(id)) s += 15;
  if (/meijia|美佳|hsiaochen|曉臻|hsiaoyu|曉雨|yating|雅婷|tingting|婷婷|xiaoxiao|曉曉/i.test(id)) s += 15;
  return s;
}

// Make the narration text readable for TTS engines.
function speechText(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '')
    .replace(/(\d)\s*[～~]\s*(\d)/g, '$1到$2')
    .replace(/[～~]+(?=[^\s，。！？!?])/g, '，')
    .replace(/[～~]+/g, '')
    .replace(/…+|\.{3,}/g, '，')
    .replace(/°/g, '度')
    .replace(/[（(]/g, '，').replace(/[）)]/g, '，')
    .replace(/→/g, '，')
    .replace(/，\s*([，。！？])/g, '$1')
    .replace(/([！？!?])\s*。/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const Voice = {
  on: true, voice: null,
  clips: typeof VOICE_CLIPS === 'undefined' ? {} : VOICE_CLIPS,
  buffers: {}, src: null, token: 0,
  pick() {
    if (!('speechSynthesis' in window)) return;
    const ranked = speechSynthesis.getVoices()
      .map(v => ({ v, s: voiceScore(v) }))
      .filter(x => x.s >= 0)
      .sort((a, b) => b.s - a.s);
    this.voice = ranked.length ? ranked[0].v : null;
  },
  // Pre-recorded clips (tools/build-voice.mjs) play first; anything missing uses speech synthesis.
  say(text) {
    if (!this.on) return;
    const clean = speechText(text);
    if (!clean) return;
    this.stop();
    const token = ++this.token;
    const url = this.clips[clean];
    if (url && Snd.ctx) {
      this.playClip(url, token).then(ok => { if (!ok && token === this.token) this.tts(clean); });
    } else this.tts(clean);
  },
  async playClip(url, token) {
    const ctx = Snd.ctx;
    try {
      if (!this.buffers[url]) {
        this.buffers[url] = fetch(url)
          .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
          .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)));
      }
      const buf = await this.buffers[url];
      if (token !== this.token || !this.on) return true;
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.connect(Snd.master);
      s.start();
      this.src = s;
      return true;
    } catch (e) {
      delete this.buffers[url];
      return false;
    }
  },
  tts(clean) {
    if (!('speechSynthesis' in window)) return;
    // Speak sentence by sentence: long utterances get cut off in Chrome.
    const parts = (clean.match(/[^。！？!?]+[。！？!?]*/g) || []).map(s => s.trim()).filter(Boolean);
    try {
      speechSynthesis.cancel();
      parts.forEach(p => {
        const u = new SpeechSynthesisUtterance(p);
        u.lang = this.voice ? this.voice.lang : 'zh-TW';
        if (this.voice) u.voice = this.voice;
        u.rate = 0.95; u.pitch = 1.08;
        speechSynthesis.speak(u);
      });
    } catch (e) { /* speech unavailable */ }
  },
  stop() {
    this.token++;
    if (this.src) { try { this.src.stop(); } catch (e) {} this.src = null; }
    try { speechSynthesis.cancel(); } catch (e) {}
  },
};
if ('speechSynthesis' in window) {
  Voice.pick();
  speechSynthesis.onvoiceschanged = () => Voice.pick();
}
