import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

export const FONT = '"Film Sans", sans-serif';
let ready: Promise<void> | undefined;

export function ensureFont(): Promise<void> {
  if (!ready) {
    const handle = delayRender('Load bundled Chinese font');
    ready = new FontFace('Film Sans', `url("${staticFile('fonts/NotoSansSC.ttf')}")`, {
      weight: '100 900',
    }).load().then((face) => {
      document.fonts.add(face);
      continueRender(handle);
    }).catch((error: unknown) => {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    });
  }
  return ready;
}
