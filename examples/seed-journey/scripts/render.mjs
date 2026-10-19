import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir} from 'node:fs/promises';
import {resolve, dirname} from 'node:path';
import {browserPath} from './browser.mjs';

const [mode = 'render', ...args] = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!args[i]?.startsWith('--') || !args[i + 1]) throw new Error('Use --name value pairs');
  options[args[i].slice(2)] = args[i + 1];
}
if (!['render', 'clip', 'still'].includes(mode)) throw new Error('Mode must be render, clip or still');
const compositionId = options.composition || 'CrossingPreview';
if (typeof compositionId !== 'string' || compositionId.length === 0) throw new Error('--composition must be a non-empty id');
const browserExecutable = browserPath();
// These are server-side APIs: set ANGLE explicitly per call. A config file alone
// does not affect selectComposition/renderStill/renderMedia.
const chromiumOptions = {gl: 'angle'};
const serveUrl = await bundle({entryPoint: resolve('src/index.ts'), publicDir: resolve('public')});
const composition = await selectComposition({
  serveUrl,
  id: compositionId,
  browserExecutable,
  chromiumOptions,
});
const outputLocation = resolve(options.out || (mode === 'still' ? 'out/frame.png' : `out/${mode}-v1.mp4`));
await mkdir(dirname(outputLocation), {recursive: true});
const common = {serveUrl, composition, browserExecutable, chromiumOptions};
if (mode === 'still') {
  const frame = Number(options.frame ?? Math.floor(composition.durationInFrames / 2));
  if (!Number.isInteger(frame) || frame < 0 || frame >= composition.durationInFrames) throw new Error('Frame outside composition');
  await renderStill({...common, frame, imageFormat: 'png', output: outputLocation});
} else {
  let frameRange;
  if (mode === 'clip') {
    const [from, to] = String(options.range || '0:3').split(':').map(Number);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to <= from) throw new Error('Range must be start:end seconds');
    const first = Math.round(from * composition.fps);
    const last = Math.min(composition.durationInFrames - 1, Math.round(to * composition.fps) - 1);
    if (first > last) throw new Error('Range outside composition');
    frameRange = [first, last];
  }
  await renderMedia({...common, outputLocation, codec: 'h264', audioCodec: 'aac', crf: 18,
    pixelFormat: 'yuv420p', frameRange, concurrency: Number(options.concurrency || 2),
    onProgress: ({progress}) => {
      const percent = Math.round(progress * 100);
      if (percent % 20 === 0 && percent !== renderMedia.lastPercent) {
        renderMedia.lastPercent = percent;
        console.log(`Rendering ${percent}%`);
      }
    }});
}
console.log(JSON.stringify({output: outputLocation, mode, composition: compositionId,
  chromiumGl: chromiumOptions.gl, width: composition.width, height: composition.height,
  fps: composition.fps, compositionFrames: composition.durationInFrames}));
