export type Shot = {
  id: string;
  title: string;
  seconds: number;
  implemented: boolean;
};

export const filmSpec = {
  title: '一粒种子的远行',
  width: 1920,
  height: 1080,
  fps: 30,
} as const;

// The seven-shot plan from storyboard.md. Seconds are the single source of
// truth; every start frame below is derived, never hand-written.
export const shots: Shot[] = [
  {id: 'still-forest', title: '枯林·一粒', seconds: 7, implemented: true},
  {id: 'gust', title: '起风', seconds: 7, implemented: true},
  {id: 'crossing', title: '渡', seconds: 8, implemented: true},
  {id: 'headwind', title: '逆风', seconds: 8, implemented: true},
  {id: 'burial', title: '入土', seconds: 7, implemented: true},
  {id: 'crack', title: '裂', seconds: 7, implemented: true},
  {id: 'growth-rings', title: '年轮', seconds: 6, implemented: true},
];

export function schedule(list: Shot[], fps: number) {
  let cursor = 0;
  return list.map((shot) => {
    if (!(shot.seconds > 0) || !(fps > 0)) throw new Error('Positive shot duration/fps required');
    const durationInFrames = Math.max(1, Math.round(shot.seconds * fps));
    const timed = {...shot, from: cursor, durationInFrames};
    cursor += durationInFrames;
    return timed;
  });
}

export const fullTimeline = schedule(shots, filmSpec.fps);
export const fullDurationInFrames = fullTimeline.reduce((sum, s) => sum + s.durationInFrames, 0);

export const film = {
  compositionId: 'Film',
  audioFile: 'film-score.wav',
} as const;

// The approved 8-second study remains renderable on its own. It is the exact
// 14-22 s shot, rendered at local time 0-8 s, with its own preserved audio.
export const preview = {
  compositionId: 'CrossingPreview',
  sourceShot: 'crossing',
  seconds: 8,
  audioFile: 'crossing-preview.wav',
} as const;

export const previewDurationInFrames = Math.round(preview.seconds * filmSpec.fps);

export const crossingSource = fullTimeline.find((shot) => shot.id === 'crossing');
if (!crossingSource) throw new Error('Crossing shot missing from full timeline');
