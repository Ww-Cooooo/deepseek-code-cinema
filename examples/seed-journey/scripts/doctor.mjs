import {spawnSync} from 'node:child_process';
import {browserPath} from './browser.mjs';

const [major, minor] = process.versions.node.split('.').map(Number);
const nodeSupported = (major === 22 && minor >= 19) || major >= 24;
const check = (command) => {
  const result = spawnSync(command, ['-version'], {encoding: 'utf8', windowsHide: true});
  return result.status === 0;
};
console.log(JSON.stringify({node: process.versions.node, nodeSupported,
  platform: process.platform, arch: process.arch, browser: browserPath(),
  browserFallback: 'Remotion may download Chrome Headless Shell if no local browser is found',
  ffmpegOnPath: check('ffmpeg'), ffprobeOnPath: check('ffprobe'),
  note: 'Media tool paths may also be provided by the host; PATH absence is not an installation diagnosis.'}, null, 2));
if (!nodeSupported) process.exitCode = 1;
