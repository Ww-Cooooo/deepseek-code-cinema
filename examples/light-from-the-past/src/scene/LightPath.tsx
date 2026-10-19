import React, {useMemo} from 'react';
import {random} from 'remotion';
import {layout} from '../theme';
import {beamPoint, beamPoints, clamp01, pointsToPolyline, range, smooth} from './geometry';

type Spark = {t: number; side: number; size: number; phase: number};

export const LightPath: React.FC<{seconds: number}> = ({seconds}) => {
  const raw = clamp01((seconds - layout.beamStart) / (layout.beamArrive - layout.beamStart));
  const headT = raw <= 0 ? 0 : clamp01(smooth(raw) * 0.25 + raw * 0.75);
  const active = seconds >= layout.beamStart;
  const head = beamPoint(headT);
  const route = pointsToPolyline(beamPoints(1, 90));
  const trailStart = Math.max(0, headT - 0.15);
  const trail = headT > 0.01 ? pointsToPolyline(beamPoints(headT, 52).slice(Math.floor(trailStart * 51))) : '';
  const brightness = range(seconds, layout.beamStart, layout.beamStart + 0.5);
  const impact = smooth(range(seconds, layout.beamArrive, layout.beamArrive + 0.82));
  const beamAfter = 1 - 0.88 * smooth(range(seconds, layout.beamArrive + 0.07, layout.beamArrive + 0.86));
  const headPulse = active ? 0.82 + 0.18 * Math.sin(seconds * 6.2) : 0;

  const sparks = useMemo<Spark[]>(() => {
    return Array.from({length: 24}, (_, i) => ({
      t: 0.03 + random(`spark-t-${i}`) * 0.94,
      side: (random(`spark-side-${i}`) - 0.5) * 18,
      size: 0.35 + random(`spark-size-${i}`) * 1.1,
      phase: random(`spark-phase-${i}`) * Math.PI * 2,
    }));
  }, []);

  return (
    <g>
      <defs>
        <linearGradient id="beamStroke" gradientUnits="userSpaceOnUse" x1={layout.star.x} y1={layout.star.y} x2={layout.head.x} y2={layout.head.y}>
          <stop offset="0" stopColor="#ffe3b1" stopOpacity="0.92" />
          <stop offset="0.5" stopColor="#ecdfc6" stopOpacity="0.72" />
          <stop offset="1" stopColor="#d7ecee" stopOpacity="0.92" />
        </linearGradient>
        <linearGradient id="trailStroke" gradientUnits="userSpaceOnUse" x1={layout.star.x} y1={layout.star.y} x2={layout.head.x} y2={layout.head.y}>
          <stop offset="0" stopColor="#fff6df" stopOpacity="0" />
          <stop offset="0.48" stopColor="#ffe7c2" stopOpacity="0.34" />
          <stop offset="1" stopColor="#f4ffff" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="headHalo">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.94" />
          <stop offset="0.14" stopColor="#fff4d5" stopOpacity="0.74" />
          <stop offset="0.48" stopColor="#d9f0ef" stopOpacity="0.18" />
          <stop offset="1" stopColor="#cdebed" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="impactHalo">
          <stop offset="0" stopColor="#fff8e7" stopOpacity="0.55" />
          <stop offset="0.4" stopColor="#ffe3b5" stopOpacity="0.18" />
          <stop offset="1" stopColor="#d9edf0" stopOpacity="0" />
        </radialGradient>
        <filter id="beamBlur" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="headBlur" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>

      {active ? (
        <>
          <path d={route} fill="none" stroke="#a9c4c6" strokeWidth={0.72} opacity={0.055 + 0.035 * brightness} />
          <g opacity={beamAfter}>
            <path
              d={trail}
              fill="none"
              stroke="#eaf8f6"
              strokeWidth={4.2}
              opacity={0.13 * brightness}
              strokeLinecap="round"
              filter="url(#beamBlur)"
            />
            <path
              d={trail}
              fill="none"
              stroke="url(#trailStroke)"
              strokeWidth={1.25}
              opacity={0.72 * brightness}
              strokeLinecap="round"
            />

            {sparks.map((spark, i) => {
            const distance = headT - spark.t;
            const visible = distance > -0.02 && distance < 0.34;
            if (!visible) return null;
            const point = beamPoint(spark.t);
            const angle = Math.atan2(beamPoint(Math.min(1, spark.t + 0.01)).y - point.y, beamPoint(Math.min(1, spark.t + 0.01)).x - point.x) + Math.PI / 2;
            const fade = Math.max(0, 1 - Math.abs(distance) / 0.34);
            return (
              <circle
                key={`spark-${i}`}
                cx={point.x + Math.cos(angle) * spark.side}
                cy={point.y + Math.sin(angle) * spark.side}
                r={spark.size}
                fill="#f9f4e6"
                opacity={0.16 + 0.42 * fade * (0.7 + 0.3 * Math.sin(seconds * 1.8 + spark.phase))}
              />
            );
          })}

            <circle cx={head.x} cy={head.y} r={24} fill="url(#headHalo)" opacity={0.65 * brightness} filter="url(#headBlur)" />
            <circle cx={head.x} cy={head.y} r={5.2} fill="url(#headHalo)" opacity={0.95 * brightness} />
            <circle cx={head.x} cy={head.y} r={1.8} fill="#ffffff" opacity={headPulse} />
          </g>
        </>
      ) : null}

      {seconds > layout.beamArrive ? (
        <g>
          <circle
            cx={layout.head.x}
            cy={layout.head.y}
            r={16 + 118 * impact}
            fill="url(#impactHalo)"
            opacity={0.5 * (1 - impact)}
          />
          <circle
            cx={layout.head.x}
            cy={layout.head.y}
            r={5 + 52 * impact}
            fill="none"
            stroke="#e7d5b6"
            strokeWidth={0.65 * (1 - impact) + 0.1}
            opacity={0.34 * (1 - impact)}
          />
          <circle cx={layout.head.x} cy={layout.head.y} r={4.8} fill="url(#headHalo)" opacity={0.25 * (1 - impact * 0.6)} />
        </g>
      ) : null}
    </g>
  );
};
