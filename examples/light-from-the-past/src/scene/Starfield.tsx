import React, {useMemo} from 'react';
import {random} from 'remotion';
import {layout} from '../theme';

type Star = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  phase: number;
  twinkle: number;
  tone: string;
};

const TONES = ['#e8f0ed', '#d8e5e6', '#e9dfcd', '#c6dce0', '#f4ead9'];

export const Starfield: React.FC<{seconds: number}> = ({seconds}) => {
  const stars = useMemo<Star[]>(() => {
    return Array.from({length: 286}, (_, i) => {
      const r1 = random(`star-x-${i}`);
      const r2 = random(`star-y-${i}`);
      const r3 = random(`star-r-${i}`);
      const r4 = random(`star-o-${i}`);
      const r5 = random(`star-t-${i}`);
      const r6 = random(`star-c-${i}`);
      const r7 = random(`star-p-${i}`);
      let x = 24 + r1 * 1872;
      let y = 28 + r2 * 612;

      // A very loose dust lane, not a decorative nebula wall.
      if (i % 5 === 0) {
        const lane = 330 + (1 - x / layout.width) * 250;
        y = lane + (r2 - 0.5) * 230;
      }
      if (y < 24 || y > 646) y = 28 + r2 * 590;
      if (Math.hypot(x - layout.star.x, y - layout.star.y) < 44) x -= 78;

      const rare = r3 > 0.965;
      return {
        x,
        y,
        r: rare ? 1.9 + r3 * 0.9 : 0.35 + r3 * r3 * 1.25,
        opacity: rare ? 0.68 + r4 * 0.25 : 0.16 + r4 * 0.58,
        phase: r7 * Math.PI * 2,
        twinkle: 0.35 + r5 * 1.8,
        tone: TONES[Math.floor(r6 * TONES.length) % TONES.length],
      };
    });
  }, []);

  return (
    <g>
      {stars.map((star, i) => {
        const breath = 0.83 + 0.17 * Math.sin(seconds * star.twinkle + star.phase);
        const glow = star.r > 1.7;
        return (
          <g key={i} opacity={star.opacity * breath}>
            {glow ? (
              <circle cx={star.x} cy={star.y} r={star.r * 3.7} fill={star.tone} opacity={0.055} />
            ) : null}
            <circle cx={star.x} cy={star.y} r={star.r} fill={star.tone} />
          </g>
        );
      })}
    </g>
  );
};
