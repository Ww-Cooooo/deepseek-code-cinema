import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {preview, filmSpec} from '../src/config.ts';

// Original procedural sound design for this film. No external recordings or music.
// Every layer is deterministic; the stereo field follows the seed across the shot.
const score = JSON.parse(await readFile(process.argv[2] || 'score-crossing.json', 'utf8'));
const duration = preview.seconds;
const rate = 48000;
const samples = Math.ceil(duration * rate);
if (!(duration > 0 && duration <= 600)) throw new Error('This PCM synth supports 0..600 seconds');

const left = new Float32Array(samples);
const right = new Float32Array(samples);
const reverbSend = new Float32Array(samples);

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 2147483648 - 1;
  };
}

const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function panGains(pan) {
  const p = clamp(pan, -1, 1);
  return [Math.sqrt((1 - p) / 2), Math.sqrt((1 + p) / 2)];
}

function addSample(index, value, pan, send = 0) {
  if (index < 0 || index >= samples || !Number.isFinite(value)) return;
  const [gl, gr] = panGains(pan);
  left[index] += value * gl;
  right[index] += value * gr;
  reverbSend[index] += value * send;
}

function addWind(spec) {
  const channels = [rng(spec.seed || 7101), rng((spec.seed || 7101) + 913)];
  const lp = [0, 0];
  const lp2 = [0, 0];
  const hpState = [0, 0];
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const p = t / duration;
    const gust =
      0.34 +
      0.34 * smoothstep(0.02, 0.23, p) +
      0.27 * Math.exp(-Math.pow((p - 0.36) / 0.16, 2)) +
      0.36 * Math.exp(-Math.pow((p - 0.69) / 0.19, 2)) -
      0.22 * smoothstep(0.88, 1, p);
    const rise = smoothstep(0, 0.55, t) * (1 - smoothstep(7.55, 8, t));
    const flutter = 0.88 + 0.12 * Math.sin(2 * Math.PI * 0.19 * t + 0.8);
    const cutoff = 330 + 310 * gust + 110 * Math.sin(2 * Math.PI * 0.13 * t);
    const a = 1 - Math.exp((-2 * Math.PI * cutoff) / rate);
    const hpCut = 42;
    const ah = 1 - Math.exp((-2 * Math.PI * hpCut) / rate);
    for (let c = 0; c < 2; c++) {
      const n = channels[c]();
      lp[c] += a * (n - lp[c]);
      lp2[c] += a * 0.42 * (lp[c] - lp2[c]);
      hpState[c] += ah * (lp2[c] - hpState[c]);
      const air = (lp2[c] - hpState[c]) * 1.8;
      const pressure = Math.sin(2 * Math.PI * 43 * t + c * 0.3) * 0.13 * (0.3 + gust * 0.7);
      const value = (air + pressure) * gust * rise * flutter * spec.gain;
      addSample(i, value, c === 0 ? -0.28 : 0.28, 0.12);
    }
  }
}

function addWaterHiss(spec) {
  const rand = rng(spec.seed || 4409);
  let lp = 0;
  let hp = 0;
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const p = t / duration;
    const envelope = smoothstep(0.02, 0.45, t) * (1 - smoothstep(4.8, 7.6, t)) * 0.65;
    const n = rand();
    lp += 0.06 * (n - lp);
    hp += 0.004 * (lp - hp);
    const shimmer = (lp - hp) * (0.55 + 0.45 * Math.sin(2 * Math.PI * 0.7 * t + 1.7));
    addSample(i, shimmer * envelope * spec.gain, Math.sin(p * Math.PI * 2) * 0.32, 0.22);
  }
}

function addDrone(spec) {
  const notes = spec.notes || [36.71, 73.42, 110];
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const attack = smoothstep(0, 1.35, t);
    const release = 1 - smoothstep(duration - 1.4, duration, t);
    const swell = 0.62 + 0.38 * smoothstep(0.8, 6.2, t);
    let value = 0;
    for (let n = 0; n < notes.length; n++) {
      const f = notes[n];
      const detune = 1 + (n - 1) * 0.0014;
      const movement = 0.0021 * Math.sin(2 * Math.PI * (0.071 + n * 0.019) * t + n);
      value +=
        Math.sin(2 * Math.PI * f * detune * t + movement * 12) *
        (0.5 / (n + 1)) *
        (0.72 + 0.28 * Math.sin(2 * Math.PI * (0.15 + n * 0.04) * t + n * 1.3));
    }
    const subPulse = Math.sin(2 * Math.PI * 18.355 * t) * 0.045;
    addSample(i, (value + subPulse) * attack * release * swell * spec.gain, 0, 0.3);
  }
}

function addSeedWhoosh(spec) {
  const randL = rng((spec.seed || 3013) + 29);
  const randR = rng((spec.seed || 3013) + 47);
  const state = [
    {low: 0, band: 0},
    {low: 0, band: 0},
  ];
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const p = t / duration;
    const onset = smoothstep(0.75, 1.3, t);
    const tail = 1 - smoothstep(7.25, 7.95, t);
    const envelope = onset * tail;
    if (envelope <= 0) continue;
    const cutoff = 760 + 860 * smoothstep(1.2, 6.9, t) + 160 * Math.sin(2 * Math.PI * 0.47 * t);
    const f = 2 * Math.sin((Math.PI * cutoff) / rate);
    const q = 0.7;
    const flutter = 0.64 + 0.36 * Math.sin(2 * Math.PI * 6.7 * t + 0.5) ** 2;
    const pan = -0.58 + 1.18 * smoothstep(0.9, 6.8, t);
    for (let c = 0; c < 2; c++) {
      const input = c === 0 ? randL() : randR();
      const s = state[c];
      s.low += f * s.band;
      const high = input - s.low - q * s.band;
      s.band += f * high;
      const air = s.band * (0.68 + 0.32 * Math.sin(2 * Math.PI * 0.85 * t + c));
      addSample(i, air * envelope * flutter * spec.gain, pan, 0.52);
    }
  }
}

function addWaterLap(event) {
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round((event.duration || 0.8) * rate), samples - start);
  const rand = rng(Math.round(event.at * 10000) + 71);
  let lp = 0;
  let band = 0;
  const initial = 92 + ((event.at * 37) % 36);
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const attack = Math.min(1, t / 0.012);
    const envelope = attack * Math.exp(-t * 7.2);
    const n = rand();
    lp += 0.1 * (n - lp);
    band += 0.42 * (lp - band);
    const plop = Math.sin(2 * Math.PI * (initial - 34 * t) * t) * Math.exp(-t * 13);
    const splash = (lp - band * 0.35) * 0.65;
    addSample(start + i, (plop * 0.38 + splash) * envelope * event.gain, event.pan || 0, 0.4);
  }
}

function addPaper(event) {
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round((event.duration || 0.5) * rate), samples - start);
  const rand = rng(Math.round(event.at * 10000) + 233);
  let lp = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const flutter = 0.3 + Math.pow(Math.max(0, Math.sin(2 * Math.PI * 9.2 * t + 0.3)), 2.5) * 0.7;
    const n = rand();
    lp += 0.23 * (n - lp);
    const crackle = (n - lp) * 0.7;
    const envelope = Math.min(1, t / 0.006) * Math.exp(-t * 3.2);
    addSample(start + i, crackle * flutter * envelope * event.gain, event.pan || 0, 0.34);
  }
}

function addTreeGroan(event) {
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round((event.duration || 2.2) * rate), samples - start);
  const rand = rng(Math.round(event.at * 10000) + 811);
  let creakLow = 0;
  let creakBand = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const attack = Math.min(1, t / 0.09);
    const envelope = attack * Math.exp(-t * 0.55) * (1 - smoothstep(1.85, 2.2, t));
    const fm = Math.sin(2 * Math.PI * 0.28 * t) * 0.006;
    const fundamental =
      Math.sin(2 * Math.PI * 49 * t + Math.sin(2 * Math.PI * 0.17 * t) * 0.8) * 0.5 +
      Math.sin(2 * Math.PI * 73.5 * t + 0.8 + fm * 200) * 0.24 +
      Math.sin(2 * Math.PI * 98 * t + 2.1) * 0.12;
    const n = rand();
    creakLow += 0.02 * (n - creakLow);
    creakBand += 0.06 * (creakLow - creakBand);
    const creak =
      creakBand *
      (0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(2 * Math.PI * 3.7 * t + 0.8)), 4));
    addSample(start + i, (fundamental + creak * 1.8) * envelope * event.gain, event.pan || 0, 0.52);
  }
}

function addShimmer(event) {
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round((event.duration || 2.4) * rate), samples - start);
  const f = event.freq;
  const rand = rng(Math.round(f * 3.1) + Math.round(event.at * 1000));
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const attack = smoothstep(0, 0.75, t);
    const release = 1 - smoothstep((event.duration || 2.4) - 1.1, event.duration || 2.4, t);
    const vibrato = Math.sin(2 * Math.PI * 3.1 * t + 0.4) * 0.0035;
    const tone =
      Math.sin(2 * Math.PI * f * (1 + vibrato) * t) * 0.72 +
      Math.sin(2 * Math.PI * f * 2.003 * t + 0.4) * 0.16 +
      Math.sin(2 * Math.PI * f * 0.501 * t + 1.7) * 0.12;
    const air = rand() * 0.00;
    addSample(start + i, (tone + air) * attack * release * event.gain, event.pan || 0, 0.72);
  }
}

// Simple dense room tail. Kept low: the sea and wind should stay in front.
function addReverbAndMix() {
  const delaySeconds = [0.0297, 0.0371, 0.0411, 0.0437, 0.0533, 0.0599];
  const spreads = [0, 17, 31, 43, 67, 89];
  const feedback = 0.82;
  const damp = 0.28;
  const wetL = new Float32Array(samples);
  const wetR = new Float32Array(samples);
  for (const channel of [0, 1]) {
    const combs = delaySeconds.map((seconds, index) => {
      const delay = Math.round(seconds * rate) + (channel === 1 ? spreads[index] : 0);
      return {
        buffer: new Float32Array(delay),
        index: 0,
        low: 0,
      };
    });
    const out = channel === 0 ? wetL : wetR;
    for (let i = 0; i < samples; i++) {
      const input = reverbSend[i] * 0.32;
      let sum = 0;
      for (const comb of combs) {
        const delayed = comb.buffer[comb.index];
        comb.low += damp * (delayed - comb.low);
        comb.buffer[comb.index] = input + comb.low * feedback;
        comb.index = (comb.index + 1) % comb.buffer.length;
        sum += delayed;
      }
      out[i] = sum / combs.length;
    }
  }

  const master = new Float32Array(samples * 2);
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const envIn = smoothstep(0, 0.16, i / rate);
    const envOut = 1 - smoothstep(7.55, 7.995, i / rate);
    const env = envIn * envOut;
    const l = (left[i] + wetL[i] * 0.24) * env;
    const r = (right[i] + wetR[i] * 0.24) * env;
    const softL = Math.tanh(l * 1.1) / 1.1;
    const softR = Math.tanh(r * 1.1) / 1.1;
    master[i * 2] = softL;
    master[i * 2 + 1] = softR;
    peak = Math.max(peak, Math.abs(softL), Math.abs(softR));
  }
  const gain = peak > 0 ? 0.74 / peak : 1;
  let rms = 0;
  for (let i = 0; i < samples; i++) {
    master[i * 2] *= gain;
    master[i * 2 + 1] *= gain;
    rms += master[i * 2] ** 2 + master[i * 2 + 1] ** 2;
  }
  return {master, peakBeforeGain: peak, appliedGain: gain, rms: Math.sqrt(rms / (samples * 2))};
}

for (const bed of score.beds || []) {
  if (!(bed.gain >= 0 && bed.gain <= 1)) throw new Error('Invalid bed gain');
  if (bed.type === 'wind') addWind(bed);
  else if (bed.type === 'waterHiss') addWaterHiss(bed);
  else if (bed.type === 'drone') addDrone(bed);
  else if (bed.type === 'seedWhoosh') addSeedWhoosh(bed);
  else throw new Error(`Unknown bed type: ${bed.type}`);
}

for (const event of score.events || []) {
  if (!(event.at >= 0 && event.at < duration)) throw new Error('Event outside duration');
  if (!(event.gain >= 0 && event.gain <= 1)) throw new Error('Invalid event gain');
  if (event.type === 'waterLap') addWaterLap(event);
  else if (event.type === 'paper') addPaper(event);
  else if (event.type === 'treeGroan') addTreeGroan(event);
  else if (event.type === 'shimmer') addShimmer(event);
  else throw new Error(`Unknown event type: ${event.type}`);
}

const mixed = addReverbAndMix();
const wav = Buffer.alloc(44 + samples * 4);
wav.write('RIFF', 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 4, 28);
wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(samples * 4, 40);
for (let i = 0; i < samples; i++) {
  wav.writeInt16LE(Math.round(clamp(mixed.master[i * 2], -1, 1) * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(clamp(mixed.master[i * 2 + 1], -1, 1) * 32767), 46 + i * 4);
}
const output = resolve(score.output || 'public/crossing-preview.wav');
await mkdir(dirname(output), {recursive: true});
await writeFile(output, wav);
console.log(JSON.stringify({
  output,
  seconds: duration,
  fps: filmSpec.fps,
  sampleRate: rate,
  channels: 2,
  peakBeforeGain: Number(mixed.peakBeforeGain.toFixed(4)),
  appliedGain: Number(mixed.appliedGain.toFixed(4)),
  rms: Number(mixed.rms.toFixed(4)),
  listening: 'not verified by a human',
}, null, 2));
