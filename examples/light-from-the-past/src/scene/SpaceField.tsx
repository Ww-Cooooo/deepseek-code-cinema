import React, {useMemo} from 'react';
import {random} from 'remotion';

type Star = {x: number; y: number; r: number; o: number; phase: number; tone: string; speed: number};

const TONES = ['#eef2ec', '#d7e4e7', '#f1e3cd', '#c3dae0', '#fff4dd'];

export const SpaceField: React.FC<{
  seconds: number;
  count?: number;
  opacity?: number;
  seedPrefix?: string;
}> = ({seconds, count = 190, opacity = 0.92, seedPrefix = 'space'}) => {
  const stars = useMemo<Star[]>(() => {
    return Array.from({length: count}, (_, i) => {
      const r1 = random(`${seedPrefix}-x-${i}`);
      const r2 = random(`${seedPrefix}-y-${i}`);
      const r3 = random(`${seedPrefix}-r-${i}`);
      const r4 = random(`${seedPrefix}-o-${i}`);
      const r5 = random(`${seedPrefix}-p-${i}`);
      const r6 = random(`${seedPrefix}-c-${i}`);
      return {
        x: -30 + r1 * 1980,
        y: -30 + r2 * 1140,
        r: 0.35 + Math.pow(r3, 2.3) * 2.2,
        o: 0.18 + r4 * 0.66,
        phase: r5 * Math.PI * 2,
        tone: TONES[Math.floor(r6 * TONES.length) % TONES.length],
        speed: 0.25 + r5 * 0.9,
      };
    });
  }, [count, seedPrefix]);

  return (
    <g opacity={opacity}>
      {stars.map((star, i) => {
        const twinkle = 0.78 + 0.22 * Math.sin(seconds * star.speed + star.phase);
        return (
          <g key={i} opacity={star.o * twinkle}>
            {star.r > 1.7 ? (
              <circle cx={star.x} cy={star.y} r={star.r * 5.5} fill={star.tone} opacity={0.06} />
            ) : null}
            <circle cx={star.x} cy={star.y} r={star.r} fill={star.tone} />
          </g>
        );
      })}
    </g>
  );
};
