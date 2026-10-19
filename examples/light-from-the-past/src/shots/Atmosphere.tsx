import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {random} from 'remotion';
import {FONT} from '../font';
import {clamp01, range, smooth} from '../scene/geometry';
import {SpaceField} from '../scene/SpaceField';

const CX = 1050;
const CY = 1560;
const R = 1080;
const TARGET = {x: 1000, y: 800};
const IMPACT = {x: 1000, y: 481};

type Point = {x: number; y: number};
const cubic = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
};
const path = (a: Point, b: Point, c: Point, d: Point, to: number, n = 56) => {
  const points: Point[] = [];
  for (let i = 0; i < n; i++) points.push(cubic(a, b, c, d, (to * i) / (n - 1)));
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
};

const incomingA: Point = {x: -120, y: -80};
const incomingB: Point = {x: 210, y: 130};
const incomingC: Point = {x: 660, y: 340};
const incomingD: Point = IMPACT;

export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const seconds = Math.min(frame / fps, durationInFrames / fps);

  const descent = smooth(range(seconds, 0, 8.8));
  const earthScale = 1 + descent * 0.36;
  const incoming = smooth(range(seconds, 0.45, 3.05));
  const entry = smooth(range(seconds, 3.05, 3.7));
  const descentLight = smooth(range(seconds, 3.2, 7.4));
  const targetGlow = smooth(range(seconds, 2.6, 6.4));
  const aperture = smooth(range(seconds, 7.4, 9.0));
  const captionIn = smooth(range(seconds, 4.9, 5.7));
  const captionOut = 1 - smooth(range(seconds, 8.55, 9.0));

  const incomingHead = cubic(incomingA, incomingB, incomingC, incomingD, incoming);
  const entryHead = {
    x: IMPACT.x + (TARGET.x - IMPACT.x) * descentLight,
    y: IMPACT.y + (TARGET.y - IMPACT.y) * descentLight,
  };

  const cities = useMemo(
    () =>
      Array.from({length: 30}, (_, i) => ({
        x: TARGET.x + (random(`atmo-city-x-${i}`) - 0.5) * 410,
        y: TARGET.y + 30 + (random(`atmo-city-y-${i}`) - 0.5) * 280,
        r: 0.55 + Math.pow(random(`atmo-city-r-${i}`), 2) * 2.2,
        phase: random(`atmo-city-p-${i}`) * Math.PI * 2,
      })),
    [],
  );

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="atmoSky" cx="0.55" cy="0.5" r="0.9">
            <stop offset="0" stopColor="#040d15" />
            <stop offset="0.58" stopColor="#01060b" />
            <stop offset="1" stopColor="#000102" />
          </radialGradient>
          <radialGradient id="earthNight" cx="0.48" cy="0.18" r="0.73">
            <stop offset="0" stopColor="#0c2633" />
            <stop offset="0.24" stopColor="#071923" />
            <stop offset="0.64" stopColor="#030b10" />
            <stop offset="1" stopColor="#010305" />
          </radialGradient>
          <linearGradient id="atmoRim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1920" y2="0">
            <stop offset="0" stopColor="#6eb9c8" stopOpacity="0" />
            <stop offset="0.22" stopColor="#83c8d2" stopOpacity="0.18" />
            <stop offset="0.48" stopColor="#b7e9ec" stopOpacity="0.58" />
            <stop offset="0.64" stopColor="#86ccd4" stopOpacity="0.35" />
            <stop offset="1" stopColor="#6eb9c8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="atmoSoft" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5caab7" stopOpacity="0" />
            <stop offset="0.48" stopColor="#8bd5dd" stopOpacity="0.26" />
            <stop offset="0.72" stopColor="#d8fbf8" stopOpacity="0.52" />
            <stop offset="1" stopColor="#5caab7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamTrailAtmo" gradientUnits="userSpaceOnUse" x1={incomingA.x} y1={incomingA.y} x2={IMPACT.x} y2={IMPACT.y}>
            <stop offset="0" stopColor="#ffe2b4" stopOpacity="0" />
            <stop offset="0.7" stopColor="#f7dab2" stopOpacity="0.4" />
            <stop offset="1" stopColor="#e9fff9" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="targetHalo">
            <stop offset="0" stopColor="#fff7e2" stopOpacity="0.96" />
            <stop offset="0.14" stopColor="#ffe3b0" stopOpacity="0.55" />
            <stop offset="0.46" stopColor="#d5ede8" stopOpacity="0.12" />
            <stop offset="1" stopColor="#d5ede8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="atmoVignette" cx="0.5" cy="0.48" r="0.8">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.64" stopColor="#000" stopOpacity="0.1" />
            <stop offset="1" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
          <clipPath id="atmoEarthClip">
            <circle cx={CX} cy={CY} r={R} />
          </clipPath>
          <filter id="atmoSoftBlur" x="-40%" y="-80%" width="180%" height="260%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
          <filter id="atmoBeamBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id="targetBlur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4.5" />
          </filter>
        </defs>

        <rect width="1920" height="1080" fill="url(#atmoSky)" />
        <SpaceField seconds={seconds} count={155} opacity={0.62} seedPrefix="atmo" />

        <g transform={`translate(${TARGET.x} ${TARGET.y}) scale(${earthScale}) translate(${-TARGET.x} ${-TARGET.y})`}>
          <circle cx={CX} cy={CY} r={R + 88} fill="#64b8c8" opacity={0.06} filter="url(#atmoSoftBlur)" />
          <circle cx={CX} cy={CY} r={R + 24} fill="none" stroke="#6fc7d0" strokeWidth={48} opacity={0.11} filter="url(#atmoSoftBlur)" />
          <circle cx={CX} cy={CY} r={R} fill="url(#earthNight)" />
          <g clipPath="url(#atmoEarthClip)">
            <ellipse cx={CX - 120} cy={700} rx={820} ry={74} fill="#8fabb0" opacity={0.045} filter="url(#atmoSoftBlur)" />
            <ellipse cx={CX + 160} cy={860} rx={960} ry={92} fill="#6e979f" opacity={0.035} filter="url(#atmoSoftBlur)" />
            <path
              d={`M ${CX - 1200} 670 C ${CX - 620} 610 ${CX - 120} 650 ${CX + 1250} 565`}
              fill="none"
              stroke="#b6d4d6"
              strokeWidth={24}
              opacity={0.06}
              filter="url(#atmoSoftBlur)"
            />
            <path
              d={`M ${CX - 1200} 740 C ${CX - 500} 695 ${CX + 260} 780 ${CX + 1300} 680`}
              fill="none"
              stroke="#83b0b8"
              strokeWidth={14}
              opacity={0.05}
              filter="url(#atmoSoftBlur)"
            />
            <g opacity={0.28 + targetGlow * 0.7}>
              {cities.map((city, i) => (
                <circle
                  key={i}
                  cx={city.x}
                  cy={city.y}
                  r={city.r * (1 + aperture * 1.2)}
                  fill="#f1bc76"
                  opacity={0.4 + 0.35 * Math.sin(seconds * 1.4 + city.phase)}
                />
              ))}
            </g>
            <circle
              cx={TARGET.x}
              cy={TARGET.y}
              r={36 + 160 * targetGlow}
              fill="none"
              stroke="#d7ece8"
              strokeWidth={0.8}
              opacity={0.15 * targetGlow}
            />
          </g>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#atmoRim)" strokeWidth={2.4} opacity={0.9} />
          <circle cx={CX} cy={CY} r={R + 13} fill="none" stroke="url(#atmoSoft)" strokeWidth={6} opacity={0.45} filter="url(#atmoSoftBlur)" />
          <circle cx={CX} cy={CY} r={R + 40} fill="none" stroke="#6ab5c2" strokeWidth={26} opacity={0.1} filter="url(#atmoSoftBlur)" />
        </g>

        <g opacity={0.48 * (1 - entry * 0.55)}>
          <path d={path(incomingA, incomingB, incomingC, incomingD, 1, 70)} fill="none" stroke="#b7d4d5" strokeWidth={0.7} />
        </g>
        {incoming > 0 ? (
          <g>
            <path
              d={path(incomingA, incomingB, incomingC, incomingD, incoming, 56)}
              fill="none"
              stroke="#f2fbf7"
              strokeWidth={5}
              opacity={0.12 * (1 - entry * 0.4)}
              filter="url(#atmoBeamBlur)"
              strokeLinecap="round"
            />
            <path
              d={path(incomingA, incomingB, incomingC, incomingD, incoming, 56)}
              fill="none"
              stroke="url(#beamTrailAtmo)"
              strokeWidth={1.25}
              opacity={0.83 * (1 - entry * 0.45)}
              strokeLinecap="round"
            />
            <circle cx={incomingHead.x} cy={incomingHead.y} r={18} fill="url(#targetHalo)" opacity={0.72} filter="url(#targetBlur)" />
            <circle cx={incomingHead.x} cy={incomingHead.y} r={2.2} fill="#fffdf2" />
          </g>
        ) : null}

        {entry > 0 ? (
          <g>
            <ellipse
              cx={IMPACT.x}
              cy={IMPACT.y}
              rx={18 + 126 * entry}
              ry={4 + 22 * entry}
              fill="none"
              stroke="#bfe9e8"
              strokeWidth={0.8}
              opacity={0.38 * (1 - entry)}
            />
            <line
              x1={IMPACT.x}
              x2={entryHead.x}
              y1={IMPACT.y}
              y2={entryHead.y}
              stroke="#dff6f2"
              strokeWidth={0.9}
              opacity={0.2 * (1 - descentLight * 0.35)}
            />
            <circle cx={entryHead.x} cy={entryHead.y} r={10} fill="url(#targetHalo)" opacity={0.55} filter="url(#targetBlur)" />
            <circle cx={entryHead.x} cy={entryHead.y} r={1.7} fill="#fffdf4" opacity={0.9} />
          </g>
        ) : null}

        <g opacity={targetGlow}>
          <circle cx={TARGET.x} cy={TARGET.y} r={10 + 46 * targetGlow} fill="url(#targetHalo)" opacity={0.62} filter="url(#targetBlur)" />
          <circle cx={TARGET.x} cy={TARGET.y} r={2.8 + 2 * targetGlow} fill="#fff6df" />
          <circle
            cx={TARGET.x}
            cy={TARGET.y}
            r={16 + 74 * aperture}
            fill="none"
            stroke="#f0d3a3"
            strokeWidth={0.7}
            opacity={0.45 * aperture}
          />
        </g>

        <g
          opacity={captionIn * captionOut}
          transform={`translate(0 ${(1 - captionIn) * 16})`}
          fontFamily={FONT}
        >
          <text x={156} y={170} fill="#97aaac" fontSize={19} fontWeight={360} letterSpacing={3.4}>
            抵达地球 · 夜侧
          </text>
          <text x={152} y={258} fill="#f1e9d9" fontSize={45} fontWeight={300} letterSpacing={2.3}>
            光抵达时，
          </text>
          <text x={152} y={318} fill="#f1e9d9" fontSize={45} fontWeight={300} letterSpacing={2.3}>
            出发已过去 <tspan fill="#efd0a0">40 年</tspan>。
          </text>
          <line x1={154} x2={410} y1={353} y2={353} stroke="#bda27b" strokeWidth={0.8} opacity={0.4} />
        </g>

        <rect width="1920" height="1080" fill="url(#atmoVignette)" pointerEvents="none" />
      </svg>
    </AbsoluteFill>
  );
};
