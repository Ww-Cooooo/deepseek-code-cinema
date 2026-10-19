import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {durationInFrames, film} from '../src/config.ts';

// Original small deterministic PCM writer. A helper for authored cues, not an automatic composer.
const score = JSON.parse(await readFile(process.argv[2] || 'score.json', 'utf8'));
const duration = durationInFrames / film.fps;
if (!(duration > 0 && duration <= 600)) throw new Error('This small PCM helper supports 0..600 seconds');
const rate = 48000;
const samples = Math.ceil(duration * rate);
const left = new Float32Array(samples);
const right = new Float32Array(samples);
let seed = 28371;
const noise = () => {seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 2147483648 - 1;};
for (const e of score.events || []) {
  if (!(e.at >= 0 && e.at < duration && e.duration > 0 && e.gain >= 0 && e.gain <= 1)) throw new Error('Invalid event time/duration/gain');
  const voice = e.voice || 'tone';
  if (!['tone', 'pluck', 'noise'].includes(voice)) throw new Error(`Unknown voice: ${voice}`);
  if (!(e.frequency > 0 && e.frequency < rate / 2)) throw new Error('Invalid frequency');
  const start = Math.round(e.at * rate);
  const count = Math.min(Math.round(e.duration * rate), samples - start);
  const pan = Math.max(-1, Math.min(1, e.pan || 0));
  for (let i = 0; i < count; i++) {
    const t = i / rate;
    const envelope = Math.min(1, t / 0.012) * Math.min(1, (count - 1 - i) / (rate * 0.06));
    const phase = 2 * Math.PI * e.frequency * t;
    const wave = voice === 'noise' ? noise() * Math.exp(-t * 10) : voice === 'pluck'
      ? (Math.sin(phase) + 0.22 * Math.sin(phase * 2) + 0.07 * Math.sin(phase * 3)) * Math.exp(-t * 4)
      : Math.sin(phase) * 0.7 + Math.sin(phase * 2) * 0.12;
    const value = wave * envelope * e.gain;
    left[start + i] += value * Math.sqrt((1 - pan) / 2);
    right[start + i] += value * Math.sqrt((1 + pan) / 2);
  }
}
let peak = 0;
for (let i = 0; i < samples; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const gain = peak > 0.85 ? 0.85 / peak : 1;
const wav = Buffer.alloc(44 + samples * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 4, 28); wav.writeUInt16LE(4, 32);
wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 4, 40);
for (let i = 0; i < samples; i++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i] * gain)) * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i] * gain)) * 32767), 46 + i * 4);
}
const output = resolve(score.output || 'public/sound.wav');
await mkdir(dirname(output), {recursive: true});
await writeFile(output, wav);
console.log(JSON.stringify({output, seconds: duration, sampleRate: rate, channels: 2,
  peakBeforeGain: peak, appliedGain: gain, listening: 'not verified by synthesis'}));
