export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const progress = (frame: number, duration: number) => clamp01(frame / Math.max(1, duration - 1));
export const phase = (p: number, start: number, end: number) => clamp01((p - start) / (end - start));
export const ease = (p: number) => p * p * (3 - 2 * p);
