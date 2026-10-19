#!/usr/bin/env node
// 一粒种子的远行 · 50 秒原创配乐与音效
// node scripts/sound-film.mjs  ->  public/film-score.wav (48kHz, stereo, 16-bit PCM)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 48000, DUR = 50, N = SR * DUR, TAU = Math.PI * 2;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "public/film-score.wav");

// 确定性伪随机
let seed = 20240611;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const L = new Float64Array(N), R = new Float64Array(N);
const pan = (p) => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
const lerp = (a, b, x) => a + (b - a) * x;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const win = (t, a, b, fi = 1.2, fo = 1.2) => smooth((t - a) / fi) * smooth((b - t) / fo);

function add(i, v, p = 0) { if (i >= 0 && i < N) { const [l, r] = pan(p); L[i] += v * l; R[i] += v * r; } }

// ===== 乐器 =====
function bell(t0, f, amp, p, dec = 1.6) { // 钟/音叉：基频 + 非谐泛音
  const s0 = Math.floor(t0 * SR), len = Math.floor(dec * 5 * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR; if (s0 + k >= N) break;
    const env = Math.exp(-t / dec) * (1 - Math.exp(-t * 220));
    const ph = TAU * f * t;
    const v = Math.sin(ph) + 0.34 * Math.sin(2.01 * ph) * Math.exp(-t / (dec * 0.45)) + 0.12 * Math.sin(3.98 * ph) * Math.exp(-t / (dec * 0.25));
    add(s0 + k, amp * env * v, p);
  }
}
function flute(t0, dur, f, amp, p, vib = 4.6) { // 柔和气声长音
  const s0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  let ph = 0, ph2 = 0, lp = 0;
  for (let k = 0; k < len; k++) {
    const t = k / SR, u = t / dur;
    const env = smooth(u / 0.22) * smooth((1 - u) / 0.35) * (0.82 + 0.18 * Math.sin(Math.PI * u));
    const fv = f * (1 + 0.004 * Math.sin(TAU * vib * t) * smooth(u / 0.4));
    ph += TAU * fv / SR; ph2 += TAU * fv * 2 / SR;
    const breath = (rnd() * 2 - 1); lp += 0.06 * (breath - lp);
    add(s0 + k, amp * env * (Math.sin(ph) + 0.22 * Math.sin(ph2) + 0.35 * lp), p);
  }
}
function pad(t0, dur, freqs, amp, p) { // 三音叠层，缓慢呼吸
  const s0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  const phs = freqs.map((_, j) => j * 1.7);
  for (let k = 0; k < len; k++) {
    const t = k / SR;
    const env = smooth(t / 2.2) * smooth((dur - t) / 3) * (0.7 + 0.3 * Math.sin(TAU * 0.11 * t + 0.5));
    let v = 0;
    freqs.forEach((f, j) => {
      const drift = 1 + 0.0015 * Math.sin(TAU * (0.07 + j * 0.03) * t + phs[j]);
      phs[j] += TAU * f * drift / SR;
      v += Math.sin(phs[j]) + 0.35 * Math.sin(2 * phs[j]) * Math.exp(-t / 4);
    });
    add(s0 + k, amp * env * v / freqs.length * 1.6, p);
  }
}
function pluck(t0, f, amp, p) { // 种子轻触：短促拨弦
  const s0 = Math.floor(t0 * SR), len = Math.floor(0.9 * SR);
  for (let k = 0; k < len; k++) {
    const t = k / SR, env = Math.exp(-t / 0.18) * (1 - Math.exp(-t * 900));
    const v = Math.sin(TAU * f * t) + 0.4 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.08);
    add(s0 + k, amp * env * v, p);
  }
}
function noiseBurst(t0, dur, freq, amp, p, q = 1.4, att = 0.08) { // 粗糙风声/沙/裂
  const s0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  let b0 = 0, b1 = 0, b2 = 0, low = 0;
  const w = TAU * freq / SR, cw = Math.cos(w), sw = Math.sin(w), a = sw / (2 * q), a0 = 1 + a;
  for (let k = 0; k < len; k++) {
    const t = k / SR, env = smooth(t / att) * smooth((dur - t) / (dur * 0.7));
    const x = (rnd() * 2 - 1) * 0.6 + Math.sin(TAU * 1.2 * t) * 0.4;
    const y = a0 * x - cw * b0 + b1; b0 = x; b1 = y;
    low += 0.003 * (y - low);
    add(s0 + k, amp * env * (y - low * 0.5) * Math.min(1, q), p);
  }
}
function gust(t0, dur, amp, pFrom, pTo) { // 渐强再渐弱的风
  const s0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  let lp = 0, p = 0;
  for (let k = 0; k < len; k++) {
    const u = k / len, env = smooth(u / 0.35) * smooth((1 - u) / 0.5);
    lp += 0.012 * ((rnd() * 2 - 1) - lp);
    p = lerp(pFrom, pTo, u);
    add(s0 + k, amp * env * lp * (1 + 0.5 * Math.sin(TAU * 0.9 * k / SR)), p);
  }
}
function crack(t0, amp, p, n = 5, spread = 0.06) { // 开裂噼啪
  for (let j = 0; j < n; j++) {
    const tt = t0 + j * spread * (0.6 + rnd()), a = amp * (0.4 + 0.6 * rnd()), f = 900 + rnd() * 2600;
    noiseBurst(tt, 0.05 + rnd() * 0.05, f, a, p + (rnd() - 0.5) * 0.4, 3, 0.002);
  }
}

// ===== 声场底：非常轻的空气与低鸣 =====
{
  let l1 = 0, r1 = 0, lowp = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, swell = 0.5 + 0.5 * Math.sin(TAU * t / 17);
    l1 += 0.004 * ((rnd() * 2 - 1) - l1); r1 += 0.004 * ((rnd() * 2 - 1) - r1);
    lowp = 0.9998 * lowp + 0.0002 * (rnd() * 2 - 1);
    const env = smooth(t / 3) * (1 - smooth((t - 46.5) / 3.5));
    L[i] += env * (l1 * 0.05 * swell + Math.sin(TAU * 55 * t) * 0.012 * lowp * 40);
    R[i] += env * (r1 * 0.05 * (1 - 0.4 * swell) - Math.sin(TAU * 55 * t) * 0.012 * lowp * 40);
  }
}

// D 小调 / F 大调音阶和声（种子动机：A4-C5-D5）
const D4 = 293.66, F4 = 349.23, G4 = 392.0, A4 = 440, C5 = 523.25, D5 = 587.33, E5 = 659.26, F5 = 698.46, A5 = 880;
const C4 = 261.63, E4 = 329.63;

// 0–7 枯林·一粒：稀疏低音与远处钟声，寒意
pad(0, 7.5, [D4 / 2, A4 / 2, F4 / 2], 0.05, -0.3);
bell(1.2, A4 * 2, 0.07, 0.45, 1.9);
bell(3.6, D5, 0.06, -0.5, 2.2);
bell(5.7, F4 * 4, 0.045, 0.2, 1.5);
pluck(2.4, D5, 0.05, -0.15); pluck(2.62, A4, 0.035, 0.2);
gust(0.5, 6, 0.03, -0.6, 0.4);

// 7–14 起风：渐起的风，动机上行，种子开始远行
gust(7, 4.5, 0.11, 0.8, -0.6); gust(10.8, 3.4, 0.08, -0.8, 0.7);
[0, 0.45, 0.95, 1.5, 2.1, 2.8].forEach((d, j) => pluck(7.2 + d, [A4, C5, D5, E5, F5, A5][j], 0.055 - j * 0.004, Math.sin(j) * 0.6));
flute(8.4, 5.2, A4, 0.05, 0.15); flute(9.5, 4.6, F5 / 2, 0.035, -0.35);
pad(7.0, 7.2, [D4, A4 * 0.5, F4], 0.045, 0.1);

// 14–22 渡：水面开阔，柔和水声与钟形涟漪
pad(14, 8.2, [F4, C5, A4], 0.055, -0.2);
flute(14.5, 7, D5, 0.05, -0.2, 4.2); flute(16.5, 5.5, A4, 0.035, 0.3, 3.8);
for (let j = 0; j < 7; j++) { const tt = 14.6 + j * 1.05; noiseBurst(tt, 0.5, 1800 + rnd() * 900, 0.045, Math.sin(j * 2.3) * 0.7, 2.5, 0.05); bell(tt, [C5, E5, D5, A4, F5, C5, D5][j], 0.04, Math.cos(j) * 0.6, 1.2); }

// 22–30 逆风：紧张低音脉动与短促风声
pad(22, 8, [D4, A4 * 0.5, D5 * 0.5], 0.06, 0);
for (let j = 0; j < 16; j++) pluck(22 + j * 0.47, j % 2 ? A4 : D5, 0.035 + (j > 10 ? 0.012 : 0), j % 2 ? -0.4 : 0.4);
gust(22.5, 4, 0.1, -0.9, 0.9); gust(26.5, 3.5, 0.12, 0.9, -0.5);
flute(24, 5.5, E5, 0.04, 0.2, 5.2);

// 30–37 入土：下行的安静钟声，低频落定
pad(30, 7.5, [D4, F4, A4 * 0.5], 0.05, 0);
[0, 1.4, 2.9, 4.4].forEach((d, j) => { bell(30.2 + d, [A4, E5, D5, D4 * 2][j], 0.06, (j % 2 ? 0.4 : -0.4), 2.4); });
pluck(35.4, D4, 0.07, 0); noiseBurst(35.4, 0.35, 300, 0.05, 0, 1.0, 0.02);

// 37–44 裂：细碎开裂、音高上行，生长的张力
for (let j = 0; j < 10; j++) crack(37.2 + j * 0.6, 0.07, (j % 3 - 1) * 0.5, 4, 0.05);
pad(37, 7.3, [F4, C5, E5], 0.055, 0.2);
[C5, D5, E5, F5, A5, C5 * 2].forEach((f, j) => bell(38 + j * 0.95, f, 0.05, Math.sin(j * 1.7) * 0.6, 1.4));
flute(38.5, 5, A4, 0.04, -0.1, 5.0);

// 44–50 年轮：温暖和弦收束，逐渐淡出
pad(44, 6.2, [D4, F4, A4, D5], 0.07, 0);
[0, 0.55, 1.1, 1.75, 2.5].forEach((d, j) => bell(44.3 + d, [D5, A4, F5, E5, D5 * 2][j], 0.05, Math.sin(j * 2) * 0.5, 2.8));
flute(44.6, 4.6, D5, 0.05, 0, 3.6); flute(45.4, 4, A4 * 0.5, 0.035, 0.2, 3.2);

// ===== 总线：去直流、软限幅、全局起伏与尾音衰减 =====
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const node = t > 14 && t < 22 ? 0.02 * Math.sin(TAU * 0.5 * t) * win(t, 14, 22, 2, 2) : 0;
  const shape = 1 + 0.06 * node;
  const end = 1 - smooth((t - 44.5) / 5.4);
  L[i] = Math.tanh(L[i] * shape * 1.1); R[i] = Math.tanh(R[i] * shape * 1.1);
  L[i] *= end; R[i] *= end;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.86 / (peak || 1); // 目标峰值约 -

// Technical export completion by Codex after a truncated tool argument.
// All DeepSeek-generated music, sound events and timing above remain verbatim.
// A 5 Hz DC blocker implements the generated bus comment's intended DC removal.
const pcmLeftBuffer = new Float64Array(N), pcmRightBuffer = new Float64Array(N);
const pcmDcCoefficient = Math.exp(-2 * Math.PI * 5 / SR);
let pcmPreviousLeft = 0, pcmPreviousRight = 0, pcmLastLeft = 0, pcmLastRight = 0, pcmPeak = 0;
for (let pcmIndex = 0; pcmIndex < N; pcmIndex++) {
  const pcmInputLeft = L[pcmIndex] * gain, pcmInputRight = R[pcmIndex] * gain;
  pcmLastLeft = pcmInputLeft - pcmPreviousLeft + pcmDcCoefficient * pcmLastLeft;
  pcmLastRight = pcmInputRight - pcmPreviousRight + pcmDcCoefficient * pcmLastRight;
  pcmPreviousLeft = pcmInputLeft; pcmPreviousRight = pcmInputRight;
  pcmLeftBuffer[pcmIndex] = pcmLastLeft; pcmRightBuffer[pcmIndex] = pcmLastRight;
  pcmPeak = Math.max(pcmPeak, Math.abs(pcmLastLeft), Math.abs(pcmLastRight));
}
const pcmOutputGain = 0.86 / (pcmPeak || 1);
const pcmWav = Buffer.alloc(44 + N * 4);
pcmWav.write('RIFF', 0); pcmWav.writeUInt32LE(pcmWav.length - 8, 4);
pcmWav.write('WAVEfmt ', 8); pcmWav.writeUInt32LE(16, 16);
pcmWav.writeUInt16LE(1, 20); pcmWav.writeUInt16LE(2, 22);
pcmWav.writeUInt32LE(SR, 24); pcmWav.writeUInt32LE(SR * 4, 28);
pcmWav.writeUInt16LE(4, 32); pcmWav.writeUInt16LE(16, 34);
pcmWav.write('data', 36); pcmWav.writeUInt32LE(N * 4, 40);
for (let pcmIndex = 0; pcmIndex < N; pcmIndex++) {
  const pcmLeft = pcmLeftBuffer[pcmIndex] * pcmOutputGain;
  const pcmRight = pcmRightBuffer[pcmIndex] * pcmOutputGain;
  if (!Number.isFinite(pcmLeft) || !Number.isFinite(pcmRight)) throw new Error('Nonfinite PCM sample');
  pcmWav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcmLeft)) * 32767), 44 + pcmIndex * 4);
  pcmWav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcmRight)) * 32767), 46 + pcmIndex * 4);
}
mkdirSync(dirname(out), {recursive: true}); writeFileSync(out, pcmWav);
console.log(JSON.stringify({output: out, seconds: N / SR, sampleRate: SR, channels: 2,
  music: 'Original DeepSeek composition recovered verbatim',
  assistance: 'Codex 5 Hz DC removal, peak normalization and PCM/WAV serialization', listening: 'pending human review'}));
