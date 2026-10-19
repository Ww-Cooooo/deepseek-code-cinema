export type Point = {x: number; y: number};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const progress = (frame: number, duration: number) => clamp01(frame / Math.max(1, duration - 1));
export const range = (p: number, start: number, end: number) => clamp01((p - start) / (end - start));
export const smooth = (p: number) => p * p * (3 - 2 * p);
export const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

const start: Point = {x: 1456, y: 306};
const controlA: Point = {x: 1150, y: 418};
const controlB: Point = {x: 752, y: 626};
const end: Point = {x: 520, y: 680};

const bezier = (t: number): Point => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * start.x + b * controlA.x + c * controlB.x + d * end.x,
    y: a * start.y + b * controlA.y + c * controlB.y + d * end.y,
  };
};

export const beamPoints = (progressValue: number, segments = 48): Point[] => {
  const endAt = clamp01(progressValue);
  const count = Math.max(2, Math.round(segments * endAt) + 1);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    points.push(bezier((i / (count - 1)) * endAt));
  }
  return points;
};

export const beamPoint = (progressValue: number) => bezier(clamp01(progressValue));

export const pointsToPolyline = (points: Point[]) =>
  points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
