export type RenderMode = 'graphics' | 'world';
export type Shot = {id: string; seconds: number; title: string};

// 50 秒全片时间轴；Review 保留最初 8 秒方向短段。
export const film = {
  width: 1920,
  height: 1080,
  fps: 30,
  renderMode: 'graphics' as RenderMode,
  audioFile: 'sound.wav' as string | null,
  shots: [
    {id: 'star-sea', seconds: 8, title: '星海 / 抵达'},
    {id: 'light-corridor', seconds: 9, title: '光的走廊'},
    {id: 'atmosphere', seconds: 9, title: '大气层 / 进入'},
    {id: 'past-shells', seconds: 9, title: '层层过去'},
    {id: 'light-year', seconds: 8, title: '光年不是年龄'},
    {id: 'return', seconds: 7, title: '回望'},
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

export const review = {
  compositionId: 'Review',
  shotId: 'star-sea',
  seconds: 8,
  audioFile: 'review-sound.wav',
};

export const reviewDurationInFrames = Math.round(review.seconds * film.fps);
