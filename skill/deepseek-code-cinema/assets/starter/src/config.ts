export type RenderMode = 'graphics' | 'world';
export type Shot = {id: string; seconds: number};

// This six-second original geometry study is a runtime sample, not a film outline.
// Change renderMode to switch the default Film composition. GraphicsDemo and
// WorldDemo in Root.tsx expose the same two modes without editing this file.
export const film = {
  width: 1920,
  height: 1080,
  fps: 30,
  renderMode: 'world' as RenderMode,
  audioFile: 'sound.wav' as string | null,
  shots: [
    {id: 'tool-check', seconds: 6},
  ] satisfies Shot[],
};

export function schedule(shots: Shot[], fps: number) {
  let cursor = 0;
  return shots.map((shot) => {
    if (!(shot.seconds > 0) || !(fps > 0)) throw new Error('Positive shot duration/fps required');
    const durationInFrames = Math.max(1, Math.round(shot.seconds * fps));
    const timed = {...shot, from: cursor, durationInFrames};
    cursor += durationInFrames;
    return timed;
  });
}

export const timeline = schedule(film.shots, film.fps);
export const durationInFrames = timeline.reduce((sum, s) => sum + s.durationInFrames, 0);
