import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {durationInFrames, film, review} from '../src/config.ts';

// Original deterministic stereo score. No samples, loops or third-party recordings.
const mode = process.argv[2] === 'review' ? 'review' : 'film';
const duration = mode === 'review' ? review.seconds : durationInFrames / film.fps;
const scorePath = mode === 'review' ? 'score.json' : 'score-film.json';
const fallbackOutput = mode === 'review' ? `public/${review.audioFile}` : 'public/sound.wav';
const score = JSON.parse(await readFile(scorePath, 'utf8'));
if (!(duration > 0 && duration <= 600)) throw new Error('Score duration must be 0..600 seconds');
if (score.durationSeconds != null && Math.abs(score.durationSeconds - duration) > 1.5 / film.fps) {
  throw new Error(`Score duration ${score.durationSeconds}s does not match ${mode} duration ${duration}s`);
}
const rate = 48000;
const samples = Math.ceil(duration * rate) + 1;
const dryL = new Float32Array(samples);
const dryR = new Float32Array(samples);
const sendL = new Float32Array(samples);
const sendR = new Float32Array(samples);
let noiseSeed = 192837465;
const noise = () => {
  noiseSeed ^= noiseSeed << 13;
  noiseSeed ^= noiseSeed >>> 17;
  noiseSeed ^= noiseSeed << 5;
  return (noiseSeed >>> 0) / 2147483648 - 1;
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => x * x * (3 - 2 * x);
const equalPower = (pan) => {
  const p = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
  return [Math.cos(p), Math.sin(p)];
};
const envelope = (t, total, attack = 0.02, release = 0.1) => {
  if (t < 0 || t > total) return 0;
  const inEnv = attack <= 0 ? 1 : smooth(clamp01(t / attack));
  const outEnv = release <= 0 ? 1 : smooth(clamp01((total - t) / release));
  return Math.min(inEnv, outEnv);
};
const validate = (event) => {
  if (!(event.at >= 0 && event.at < duration && event.duration > 0 && event.gain > 0)) {
    throw new Error(`Invalid cue ${JSON.stringify(event)}`);
  }
};
const add = (i, leftValue, rightValue, send) => {
  if (i < 0 || i >= samples) return;
  dryL[i] += leftValue;
  dryR[i] += rightValue;
  sendL[i] += leftValue * send;
  sendR[i] += rightValue * send;
};

const renderPad = (event) => {
  validate(event);
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round(event.duration * rate), samples - start);
  const pans = event.pans || [-0.45, 0.28, -0.08, 0.48, 0.12];
  for (let n = 0; n < event.notes.length; n++) {
    const base = event.notes[n];
    const pan = pans[n % pans.length];
    const [pl, pr] = equalPower(pan);
    const weight = (event.weights?.[n] ?? 1) * event.gain;
    const detune = event.detune ?? 0.0018;
    const phaseA = (n * 1.71) % (Math.PI * 2);
    const phaseB = (n * 2.37 + 0.6) % (Math.PI * 2);
    const lfoRate = 0.075 + n * 0.017;
    const lfoPhase = n * 1.13;
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      const env = envelope(t, event.duration, event.attack ?? 1.4, event.release ?? 1.8);
      if (env <= 0) continue;
      const lfo = 1 + 0.06 * Math.sin(2 * Math.PI * lfoRate * t + lfoPhase);
      const fA = base * (1 + detune) * (1 + 0.00035 * Math.sin(2 * Math.PI * 0.045 * t + phaseA));
      const fB = base * (1 - detune) * (1 + 0.00035 * Math.sin(2 * Math.PI * 0.038 * t + phaseB));
      const a = Math.sin(2 * Math.PI * fA * t + phaseA) + 0.16 * Math.sin(2 * Math.PI * fA * 2 * t + 0.4);
      const b = Math.sin(2 * Math.PI * fB * t + phaseB) + 0.11 * Math.sin(2 * Math.PI * fB * 3 * t + 1.1);
      const value = (a + b) * 0.5 * weight * env * lfo;
      add(start + i, value * pl, value * pr, event.send ?? 0.34);
    }
  }
};

const renderBell = (event) => {
  validate(event);
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round(event.duration * rate), samples - start);
  const [pl, pr] = equalPower(event.pan || 0);
  const freq = event.frequency;
  const decay = event.decay ?? 0.92;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const env = envelope(t, event.duration, event.attack ?? 0.004, event.release ?? 0.2) *
      Math.exp(-t * decay);
    const index = 2.3 * Math.exp(-t * 1.15);
    const carrier = Math.sin(2 * Math.PI * freq * t + index * Math.sin(2 * Math.PI * freq * 2.01 * t));
    const overtone = Math.sin(2 * Math.PI * freq * 2.985 * t + 0.32) * 0.22 * Math.exp(-t * 1.7);
    const sub = Math.sin(2 * Math.PI * freq * 0.5 * t) * 0.08 * Math.exp(-t * 1.35);
    const value = (carrier * 0.74 + overtone + sub) * env * event.gain;
    add(start + i, value * pl, value * pr, event.send ?? 0.46);
  }
};

const renderImpact = (event) => {
  validate(event);
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round(event.duration * rate), samples - start);
  let phase = 0;
  let low = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const env = envelope(t, event.duration, 0.012, 0.42);
    const f = event.frequency * (1.45 * Math.exp(-t * 1.9) + 0.42);
    phase += 2 * Math.PI * f / rate;
    const sub = Math.sin(phase) * 0.92 * Math.exp(-t * 1.5);
    low += (noise() - low) * 0.045;
    const thump = low * 1.8 * Math.exp(-t * 15) * (1 - Math.exp(-t * 80));
    const value = (sub + thump) * env * event.gain;
    add(start + i, value, value, event.send ?? 0.14);
  }
};

const renderRiser = (event) => {
  validate(event);
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round(event.duration * rate), samples - start);
  let lowL = 0;
  let bandL = 0;
  let lowR = 0;
  let bandR = 0;
  let phase = 0;
  const from = event.from ?? 260;
  const to = event.to ?? 2900;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const p = clamp01(t / event.duration);
    const fc = from * Math.pow(to / from, p);
    const f = 2 * Math.sin(Math.PI * Math.min(fc, 7000) / rate);
    const damp = 0.58;
    const inL = noise();
    const inR = noise();
    lowL += f * bandL;
    bandL += f * (inL - lowL - damp * bandL);
    lowR += f * bandR;
    bandR += f * (inR - lowR - damp * bandR);
    const attack = smooth(clamp01(t / (event.duration * 0.22)));
    const release = smooth(clamp01((event.duration - t) / 0.16));
    const env = attack * release * (0.13 + 0.87 * Math.pow(p, 1.4));
    phase += 2 * Math.PI * (92 + 86 * p) / rate;
    const tone = Math.sin(phase) * 0.08 * Math.pow(p, 1.7);
    const [pl, pr] = equalPower((event.panStart ?? 0.6) + ((event.panEnd ?? -0.5) - (event.panStart ?? 0.6)) * p);
    const left = (bandL * 0.82 + tone) * env * event.gain;
    const right = (bandR * 0.82 + tone) * env * event.gain;
    add(start + i, left * pl, right * pr, event.send ?? 0.27);
  }
};

const renderOcean = (event) => {
  validate(event);
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round(event.duration * rate), samples - start);
  let l1 = 0;
  let l2 = 0;
  let r1 = 0;
  let r2 = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const swell = 0.46 + 0.24 * Math.sin(2 * Math.PI * 0.085 * t + 0.4) + 0.13 * Math.sin(2 * Math.PI * 0.031 * t + 1.7);
    l1 += (noise() - l1) * 0.055;
    r1 += (noise() - r1) * 0.051;
    l2 += (l1 - l2) * 0.15;
    r2 += (r1 - r2) * 0.14;
    const fade = envelope(t, event.duration, 1.4, 1.2);
    const left = (l1 * 0.8 + l2 * 0.55) * swell * fade * event.gain;
    const right = (r1 * 0.8 + r2 * 0.55) * swell * fade * event.gain;
    add(start + i, left, right, event.send ?? 0.06);
  }
};

const renderAir = (event) => {
  validate(event);
  const start = Math.round(event.at * rate);
  const count = Math.min(Math.round(event.duration * rate), samples - start);
  let hpL = 0;
  let prevL = 0;
  let hpR = 0;
  let prevR = 0;
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const nL = noise();
    const nR = noise();
    hpL = 0.985 * (hpL + nL - prevL);
    prevL = nL;
    hpR = 0.985 * (hpR + nR - prevR);
    prevR = nR;
    const swell = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.11 * t + 1.4);
    const fade = envelope(t, event.duration, 2.4, 1.4);
    const left = hpL * swell * fade * event.gain;
    const right = hpR * swell * fade * event.gain;
    add(start + i, left, right, event.send ?? 0.24);
  }
};

for (const bed of score.beds || []) {
  if (bed.type === 'ocean') renderOcean(bed);
  else if (bed.type === 'air') renderAir(bed);
  else throw new Error(`Unknown bed type: ${bed.type}`);
}
for (const event of score.events || []) {
  if (event.type === 'pad') renderPad(event);
  else if (event.type === 'bell') renderBell(event);
  else if (event.type === 'impact') renderImpact(event);
  else if (event.type === 'riser') renderRiser(event);
  else throw new Error(`Unknown event type: ${event.type}`);
}

// A small Schroeder-style room: four damped parallel combs, then two allpasses.
const reverb = (inputL, inputR, sendAmount = 1) => {
  const outL = new Float32Array(samples);
  const outR = new Float32Array(samples);
  const combTimesL = [0.0297, 0.0371, 0.0411, 0.0437];
  const combTimesR = [0.0305, 0.0362, 0.0423, 0.0449];
  const makeComb = (delaySeconds, channelInput) => {
    const delay = Math.max(1, Math.round(delaySeconds * rate));
    const buffer = new Float32Array(delay);
    let index = 0;
    let damped = 0;
    const output = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const read = buffer[index];
      damped += (read - damped) * 0.24;
      buffer[index] = channelInput[i] + damped * 0.79;
      output[i] = read;
      index++;
      if (index >= delay) index = 0;
    }
    return output;
  };
  const combL = combTimesL.map((time) => makeComb(time, inputL));
  const combR = combTimesR.map((time) => makeComb(time, inputR));
  const makeAllpass = (delaySeconds, channelInput) => {
    const delay = Math.max(1, Math.round(delaySeconds * rate));
    const buffer = new Float32Array(delay);
    const output = new Float32Array(samples);
    let index = 0;
    for (let i = 0; i < samples; i++) {
      const delayed = buffer[index];
      const value = channelInput[i] + delayed * -0.56;
      buffer[index] = value;
      output[i] = delayed + value * 0.56;
      index++;
      if (index >= delay) index = 0;
    }
    return output;
  };
  for (let i = 0; i < samples; i++) {
    let left = 0;
    let right = 0;
    for (let c = 0; c < 4; c++) {
      left += combL[c][i];
      right += combR[c][i];
    }
    outL[i] = left / 4;
    outR[i] = right / 4;
  }
  const allpassL = makeAllpass(0.0051, outL);
  const allpassR = makeAllpass(0.0057, outR);
  const allpass2L = makeAllpass(0.0017, allpassL);
  const allpass2R = makeAllpass(0.0019, allpassR);
  return {left: allpass2L, right: allpass2R, amount: sendAmount};
};

// Keep the low end out of the room; it should feel like air, not a second bass.
const wetInputL = new Float32Array(samples);
const wetInputR = new Float32Array(samples);
let hpL = 0;
let hpPrevL = 0;
let hpR = 0;
let hpPrevR = 0;
for (let i = 0; i < samples; i++) {
  hpL = 0.992 * (hpL + sendL[i] - hpPrevL);
  hpPrevL = sendL[i];
  hpR = 0.992 * (hpR + sendR[i] - hpPrevR);
  hpPrevR = sendR[i];
  wetInputL[i] = hpL;
  wetInputR[i] = hpR;
}
const room = reverb(wetInputL, wetInputR);
const preL = new Float32Array(samples);
const preR = new Float32Array(samples);
for (let i = 0; i < samples; i++) {
  const s = i / rate;
  const startFade = smooth(clamp01(s / 0.22));
  const endFade = smooth(clamp01((duration - s) / 0.5));
  const masterEnv = startFade * endFade;
  preL[i] = (dryL[i] + room.left[i] * 0.72) * masterEnv;
  preR[i] = (dryR[i] + room.right[i] * 0.72) * masterEnv;
}

// A gentle bus compressor lifts the long quiet sections without letting the
// impacts own the whole dynamic range. It is deterministic and has no lookahead.
const mixL = new Float32Array(samples);
const mixR = new Float32Array(samples);
const threshold = 0.03;
const ratio = 2.0;
const attack = 1 - Math.exp(-1 / (0.008 * rate));
const release = 1 - Math.exp(-1 / (0.22 * rate));
const drive = 1.32;
const ceiling = 0.08;
const limiterRelease = 1 - Math.exp(-1 / (0.16 * rate));
let detector = 0;
let limiterGain = 1;
let peak = 0;
let rmsSum = 0;
for (let i = 0; i < samples; i++) {
  const level = Math.max(Math.abs(preL[i]), Math.abs(preR[i]));
  detector += (level > detector ? attack : release) * (level - detector);
  const over = detector / threshold;
  const compressor = over > 1 ? Math.pow(over, 1 / ratio - 1) : 1;
  const driven = level * drive;
  const targetGain = driven > ceiling ? ceiling / Math.max(0.0000001, driven) : 1;
  if (targetGain < limiterGain) limiterGain = targetGain;
  else limiterGain += (targetGain - limiterGain) * limiterRelease;
  // Gentle saturation only catches the last few peaks.
  mixL[i] = Math.tanh(preL[i] * compressor * drive * limiterGain * 1.03) * 0.96;
  mixR[i] = Math.tanh(preR[i] * compressor * drive * limiterGain * 1.03) * 0.96;
  peak = Math.max(peak, Math.abs(mixL[i]), Math.abs(mixR[i]));
  rmsSum += mixL[i] * mixL[i] + mixR[i] * mixR[i];
}
if (!(peak > 0)) throw new Error('Synthesis produced silence');
const target = Math.pow(10, -1.2 / 20); // -1.2 dBFS
const normalise = target / peak;
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
  const l = Math.max(-1, Math.min(1, mixL[i] * normalise));
  const r = Math.max(-1, Math.min(1, mixR[i] * normalise));
  wav.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
}
const output = resolve(score.output || fallbackOutput);
await mkdir(dirname(output), {recursive: true});
await writeFile(output, wav);
const rms = Math.sqrt(rmsSum / (samples * 2)) * normalise;
console.log(JSON.stringify({
  output,
  mode,
  seconds: duration,
  sampleRate: rate,
  channels: 2,
  peakBeforeNormalise: Number(peak.toFixed(4)),
  normalise: Number(normalise.toFixed(3)),
  rmsAfterNormalise: Number(rms.toFixed(4)),
  listening: 'not verified by synthesis; requires human playback',
}, null, 2));
