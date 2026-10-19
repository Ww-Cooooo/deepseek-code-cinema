import {existsSync} from 'node:fs';
import {join} from 'node:path';

export function browserPath() {
  if (process.env.REMOTION_BROWSER_EXECUTABLE) {
    if (!existsSync(process.env.REMOTION_BROWSER_EXECUTABLE)) throw new Error('REMOTION_BROWSER_EXECUTABLE does not exist');
    return process.env.REMOTION_BROWSER_EXECUTABLE;
  }
  const candidates = process.platform === 'win32' ? [
    join(process.env.PROGRAMFILES || 'C:/Program Files', 'Google/Chrome/Application/chrome.exe'),
    join(process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)', 'Microsoft/Edge/Application/msedge.exe'),
  ] : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ] : ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'];
  return candidates.find(existsSync) ?? null;
}
