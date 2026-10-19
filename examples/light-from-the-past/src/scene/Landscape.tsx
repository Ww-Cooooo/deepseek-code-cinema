import React, {useMemo} from 'react';
import {random} from 'remotion';
import {layout, palette} from '../theme';
import {clamp01, range, smooth} from './geometry';

type Glint = {y: number; spread: number; width: number; offset: number; phase: number; opacity: number; dash: string};
type Wave = {y: number; x: number; width: number; opacity: number; phase: number};

const figureRim = (
  <>
    <ellipse cx={0} cy={-136.5} rx={9.7} ry={12.2} />
    <path d="M-4.8,-124 L4.8,-124 L5.8,-118 C14,-116 21,-111 23,-102 L27,-70 L30,-43 L23,-38 L14,-42 L11,-64 L9,-40 L-9,-40 L-11,-64 L-14,-42 L-23,-38 L-30,-43 L-27,-70 L-23,-102 C-21,-111 -14,-116 -5.8,-118 Z" />
    <path d="M-22,-108 C-28,-102 -30,-92 -29,-80 L-27,-64 L-22,-63 L-22,-80 C-23,-91 -20,-99 -17,-105 Z" />
    <path d="M22,-108 C28,-102 30,-92 29,-80 L27,-64 L22,-63 L22,-80 C23,-91 20,-99 17,-105 Z" />
    <path d="M-14,-42 L-3,-42 L-4,-12 L-3,-4 L-14,-2 L-22,-4 L-20,-10 L-19,-37 Z" />
    <path d="M3,-42 L14,-42 L19,-37 L20,-10 L22,-4 L14,-2 L3,-4 L4,-12 Z" />
  </>
);

export const Landscape: React.FC<{seconds: number; pulse?: boolean}> = ({seconds, pulse = true}) => {
  const starPulse = pulse ? smooth(range(seconds, 1.45, 3.4)) : 0;
  const currentGlow = pulse
    ? 0.58 + 0.12 * Math.sin(seconds * 0.85) + 0.34 * Math.exp(-Math.pow((seconds - 2.05) / 0.34, 2))
    : 0.64 + 0.08 * Math.sin(seconds * 0.7);
  const ringA = pulse ? clamp01((seconds - 1.78) / 1.55) : 1;
  const ringB = pulse ? clamp01((seconds - 2.28) / 1.5) : 1;

  const broadGlints = useMemo<Glint[]>(() => {
    return Array.from({length: 26}, (_, i) => {
      const depth = i / 25;
      const dashA = 6 + random(`broad-dash-a-${i}`) * 34;
      const dashB = 4 + random(`broad-dash-b-${i}`) * 26;
      return {
        y: layout.horizon + 8 + Math.pow(depth, 1.28) * 354 + (random(`broad-jitter-${i}`) - 0.5) * (8 + depth * 26),
        spread: 28 + Math.pow(depth, 1.0) * 180 + (random(`broad-spread-${i}`) - 0.5) * 80,
        width: 2.4 + random(`broad-width-${i}`) * (3.2 + depth * 4.2),
        offset: (random(`broad-offset-${i}`) - 0.5) * (35 + depth * 160),
        phase: random(`broad-phase-${i}`) * Math.PI * 2,
        opacity: (0.055 + random(`broad-o-${i}`) * 0.12) * (1 - depth * 0.24),
        dash: `${dashA.toFixed(1)} ${dashB.toFixed(1)} ${(dashA * 0.55).toFixed(1)} 9`,
      };
    });
  }, []);

  const glints = useMemo<Glint[]>(() => {
    return Array.from({length: 78}, (_, i) => {
      const depth = i / 77;
      const dashA = 2 + random(`glint-dash-a-${i}`) * 9;
      const dashB = 2 + random(`glint-dash-b-${i}`) * 11;
      return {
        y: layout.horizon + 8 + Math.pow(depth, 1.4) * 360 + (random(`glint-jitter-${i}`) - 0.5) * (9 + depth * 28),
        spread: 7 + Math.pow(depth, 1.0) * 58 + (random(`glint-spread-${i}`) - 0.5) * 32,
        width: 0.65 + random(`glint-width-${i}`) * (1.2 + depth * 2.1),
        offset: (random(`glint-offset-${i}`) - 0.5) * (34 + depth * 180),
        phase: random(`glint-phase-${i}`) * Math.PI * 2,
        opacity: (0.16 + random(`glint-o-${i}`) * 0.42) * (1 - depth * 0.3),
        dash: `${dashA.toFixed(1)} ${dashB.toFixed(1)} ${(dashA * 0.7).toFixed(1)} 6`,
      };
    });
  }, []);

  const waves = useMemo<Wave[]>(() => {
    return Array.from({length: 32}, (_, i) => {
      const depth = i / 31;
      return {
        y: layout.horizon + 5 + Math.pow(depth, 1.7) * 406,
        x: random(`wave-x-${i}`) * 1650,
        width: 60 + random(`wave-w-${i}`) * (180 + depth * 500),
        opacity: 0.035 + random(`wave-o-${i}`) * 0.095,
        phase: random(`wave-p-${i}`) * Math.PI * 2,
      };
    });
  }, []);

  return (
    <g>
      <defs>
        <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.voidTop} />
          <stop offset="0.52" stopColor={palette.void} />
          <stop offset="0.86" stopColor="#041017" />
          <stop offset="1" stopColor={palette.skyHorizon} />
        </linearGradient>
        <linearGradient id="seaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#10262b" />
          <stop offset="0.12" stopColor="#0a1a1e" />
          <stop offset="0.5" stopColor="#041014" />
          <stop offset="1" stopColor={palette.seaNear} />
        </linearGradient>
        <linearGradient id="ridgeFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040a0b" />
          <stop offset="0.45" stopColor="#020605" />
          <stop offset="1" stopColor="#000202" />
        </linearGradient>
        <linearGradient id="ridgeRim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b8c6c4" stopOpacity="0" />
          <stop offset="0.38" stopColor="#d6d3c4" stopOpacity="0.22" />
          <stop offset="0.7" stopColor="#e0bd8e" stopOpacity="0.32" />
          <stop offset="1" stopColor="#e0bd8e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="horizonLine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={layout.width} y2="0">
          <stop offset="0" stopColor="#7a9ca0" stopOpacity="0" />
          <stop offset="0.48" stopColor="#96b9bb" stopOpacity="0.16" />
          <stop offset="0.76" stopColor="#e5c59d" stopOpacity="0.34" />
          <stop offset="1" stopColor="#7a9ca0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="reflectionFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5d7a7" stopOpacity="0.2" />
          <stop offset="0.16" stopColor="#efc38d" stopOpacity="0.085" />
          <stop offset="0.6" stopColor="#d7a672" stopOpacity="0.024" />
          <stop offset="1" stopColor="#d7a672" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="reflectionSideFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0.34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="reflectionMask" maskUnits="userSpaceOnUse" x={layout.star.x - 230} y={layout.horizon} width={460} height={430}>
          <rect
            x={layout.star.x - 230}
            y={layout.horizon}
            width={460}
            height={430}
            fill="url(#reflectionSideFade)"
          />
        </mask>
        <radialGradient id="starHalo">
          <stop offset="0" stopColor="#fff8e8" stopOpacity="0.8" />
          <stop offset="0.08" stopColor="#ffe3b5" stopOpacity="0.5" />
          <stop offset="0.28" stopColor="#efb56c" stopOpacity="0.17" />
          <stop offset="0.62" stopColor="#b97841" stopOpacity="0.045" />
          <stop offset="1" stopColor="#b97841" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="starInner">
          <stop offset="0" stopColor="#fffdf3" stopOpacity="1" />
          <stop offset="0.22" stopColor="#fff1ce" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="#ffd18b" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffb55f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="starCore">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.58" stopColor="#fff8de" />
          <stop offset="1" stopColor="#ffe3a9" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id="figureRimGradient" cx="1.15" cy="0.42" r="1.05">
          <stop offset="0" stopColor="#ffd9a3" stopOpacity="0.72" />
          <stop offset="0.42" stopColor="#d1c6ad" stopOpacity="0.32" />
          <stop offset="0.72" stopColor="#9fb8b8" stopOpacity="0.1" />
          <stop offset="1" stopColor="#9fb8b8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="horizonHazeGradient">
          <stop offset="0" stopColor="#9dbec0" stopOpacity="0.14" />
          <stop offset="0.55" stopColor="#6f9599" stopOpacity="0.05" />
          <stop offset="1" stopColor="#6f9599" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="waterSheen">
          <stop offset="0" stopColor="#d8c29c" stopOpacity="0.12" />
          <stop offset="0.45" stopColor="#a79472" stopOpacity="0.05" />
          <stop offset="1" stopColor="#a79472" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dustLane">
          <stop offset="0" stopColor="#74939a" stopOpacity="0.07" />
          <stop offset="0.55" stopColor="#4e7178" stopOpacity="0.028" />
          <stop offset="1" stopColor="#4e7178" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="highlightStroke" gradientUnits="userSpaceOnUse" x1={layout.star.x - 270} y1="0" x2={layout.star.x + 270} y2="0">
          <stop offset="0" stopColor="#ffe7bf" stopOpacity="0" />
          <stop offset="0.3" stopColor="#ffe9c9" stopOpacity="0.38" />
          <stop offset="0.65" stopColor="#fff4dc" stopOpacity="0.66" />
          <stop offset="1" stopColor="#d8edf0" stopOpacity="0" />
        </linearGradient>
        <filter id="softBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="waterSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
        <filter id="waterBroad" x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur stdDeviation="4.2" />
        </filter>
        <filter id="starBlur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <rect width={layout.width} height={layout.horizon + 1} fill="url(#skyGradient)" />
      <ellipse
        cx={1220}
        cy={438}
        rx={960}
        ry={240}
        fill="url(#dustLane)"
        transform="rotate(-6 1220 438)"
      />
      <ellipse cx={layout.star.x} cy={layout.star.y} rx={520} ry={290} fill="url(#starHalo)" opacity={0.42 + 0.12 * currentGlow} />
      <ellipse cx={layout.star.x - 40} cy={layout.horizon - 12} rx={520} ry={120} fill="url(#horizonHazeGradient)" />

      <rect y={layout.horizon} width={layout.width} height={layout.height - layout.horizon} fill="url(#seaGradient)" />

      <g opacity={0.9}>
        {waves.map((wave, i) => {
          const drift = Math.sin(seconds * 0.36 + wave.phase) * 18;
          return (
            <line
              key={`wave-${i}`}
              x1={wave.x + drift}
              x2={wave.x + wave.width + drift}
              y1={wave.y}
              y2={wave.y}
              stroke="#a9c4c6"
              strokeWidth={i % 5 === 0 ? 1.1 : 0.65}
              opacity={wave.opacity * (0.72 + 0.28 * Math.sin(seconds * 0.58 + wave.phase))}
            />
          );
        })}
      </g>

      <line x1={0} x2={layout.width} y1={layout.horizon} y2={layout.horizon} stroke="url(#horizonLine)" strokeWidth={1.4} />

      <g opacity={0.92 + 0.08 * currentGlow}>
        <ellipse
          cx={layout.star.x}
          cy={layout.horizon + 66}
          rx={300}
          ry={115}
          fill="url(#waterSheen)"
          filter="url(#waterBroad)"
        />
        <rect
          x={layout.star.x - 230}
          y={layout.horizon}
          width={460}
          height={430}
          fill="url(#reflectionFade)"
          mask="url(#reflectionMask)"
        />
        <g filter="url(#waterBroad)">
          {broadGlints.map((glint, i) => {
            const shimmer = 0.5 + 0.5 * Math.sin(seconds * 0.55 + glint.phase);
            const slide = Math.sin(seconds * 0.38 + glint.phase) * (7 + i * 0.5);
            return (
              <line
                key={`broad-${i}`}
                x1={layout.star.x + glint.offset - glint.spread / 2 + slide}
                x2={layout.star.x + glint.offset + glint.spread / 2 + slide}
                y1={glint.y}
                y2={glint.y}
                stroke="url(#highlightStroke)"
                strokeWidth={glint.width}
                strokeDasharray={glint.dash}
                strokeLinecap="round"
                opacity={glint.opacity * shimmer}
              />
            );
          })}
        </g>
        <g filter="url(#waterSoft)">
          {glints.map((glint, i) => {
            const shimmer = 0.55 + 0.45 * Math.sin(seconds * 0.8 + glint.phase);
            const slide = Math.sin(seconds * 0.52 + glint.phase) * (4 + i * 0.22);
            return (
              <line
                key={`glint-${i}`}
                x1={layout.star.x + glint.offset - glint.spread / 2 + slide}
                x2={layout.star.x + glint.offset + glint.spread / 2 + slide}
                y1={glint.y}
                y2={glint.y}
                stroke="url(#highlightStroke)"
                strokeWidth={glint.width}
                strokeDasharray={glint.dash}
                strokeLinecap="round"
                opacity={glint.opacity * shimmer}
              />
            );
          })}
        </g>
      </g>

      <path
        d="M0,838 C110,824 210,808 340,811 C450,814 500,816 610,822 C740,829 840,855 940,889 C1050,927 1120,985 1188,1080 L0,1080 Z"
        fill="url(#ridgeFill)"
      />
      <path
        d="M0,838 C110,824 210,808 340,811 C450,814 500,816 610,822 C740,829 840,855 940,889 C1050,927 1120,985 1188,1080"
        fill="none"
        stroke="url(#ridgeRim)"
        strokeWidth={1.2}
        opacity={0.85}
      />
      <path
        d="M124,902 C206,879 285,868 364,872 C432,875 509,890 571,930 C531,901 463,888 384,890 C298,892 209,910 124,940 Z"
        fill="#010303"
        opacity={0.85}
      />
      <path
        d="M786,913 C835,901 891,906 934,927 C986,952 1028,994 1052,1041 C988,1004 925,980 859,973 C829,969 805,955 786,913 Z"
        fill="#020505"
        opacity={0.8}
      />

      <g
        transform={`translate(${layout.figure.x} ${layout.figure.baseline}) rotate(-1.8)`}
        opacity={0.98}
      >
        <path
          d="M-22,-108 C-28,-102 -30,-92 -29,-80 L-27,-64 L-22,-63 L-22,-80 C-23,-91 -20,-99 -17,-105 Z"
          fill="#010202"
        />
        <path
          d="M22,-108 C28,-102 30,-92 29,-80 L27,-64 L22,-63 L22,-80 C23,-91 20,-99 17,-105 Z"
          fill="#010202"
        />
        <path
          d="M-14,-42 L-3,-42 L-4,-12 L-3,-4 L-14,-2 L-22,-4 L-20,-10 L-19,-37 Z"
          fill="#010202"
        />
        <path
          d="M3,-42 L14,-42 L19,-37 L20,-10 L22,-4 L14,-2 L3,-4 L4,-12 Z"
          fill="#010202"
        />
        <path
          d="M-4.8,-124 L4.8,-124 L5.8,-118 C14,-116 21,-111 23,-102 L27,-70 L30,-43 L23,-38 L14,-42 L11,-64 L9,-40 L-9,-40 L-11,-64 L-14,-42 L-23,-38 L-30,-43 L-27,-70 L-23,-102 C-21,-111 -14,-116 -5.8,-118 Z"
          fill="#010202"
        />
        <ellipse cx={0} cy={-136.5} rx={9.7} ry={12.2} fill="#010202" />
        <line x1={-31} x2={27} y1={3} y2={2} stroke="#d8c3a2" strokeWidth={0.7} opacity={0.11} />
        <g fill="none" stroke="url(#figureRimGradient)" strokeWidth={0.78} opacity={0.92}>
          {figureRim}
        </g>
        <g fill="none" stroke="#d6c4a7" strokeWidth={0.55} opacity={0.2}>
          <path d="M-14,-111 C-9,-107 -4,-105 2,-105" />
          <path d="M-13,-57 L-8,-46" />
          <path d="M13,-58 L8,-46" />
        </g>
      </g>

      <g transform={`translate(${layout.star.x} ${layout.star.y})`} opacity={0.82 + 0.18 * currentGlow}>
        <circle r={208} fill="url(#starHalo)" opacity={0.55 + 0.18 * starPulse} />
        <circle r={47} fill="url(#starInner)" filter="url(#starBlur)" opacity={0.9} />
        <line x1={-118} x2={118} y1={0} y2={0} stroke="#ffe6bd" strokeWidth={0.62} opacity={0.2} />
        <line x1={0} x2={0} y1={-96} y2={96} stroke="#ffe6bd" strokeWidth={0.5} opacity={0.15} />
        <circle r={8.4} fill="url(#starCore)" />
        <circle r={2.8} fill="#fffdf2" />
        <circle
          r={18 + 108 * ringA}
          fill="none"
          stroke="#ffe7bf"
          strokeWidth={0.8 * (1 - ringA) + 0.2}
          opacity={ringA > 0 && ringA < 1 ? 0.42 * (1 - ringA) : 0}
        />
        <circle
          r={8 + 64 * ringB}
          fill="none"
          stroke="#d9edf0"
          strokeWidth={0.55 * (1 - ringB) + 0.15}
          opacity={ringB > 0 && ringB < 1 ? 0.22 * (1 - ringB) : 0}
        />
      </g>

      <rect
        y={layout.horizon - 68}
        width={layout.width}
        height={82}
        fill="url(#horizonHazeGradient)"
        opacity={0.66}
      />
    </g>
  );
};
