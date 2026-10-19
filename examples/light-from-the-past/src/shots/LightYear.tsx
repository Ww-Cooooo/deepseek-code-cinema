import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from '../font';
import {range, smooth} from '../scene/geometry';
import {SpaceField} from '../scene/SpaceField';

const X0 = 222;
const X1 = 1640;
const Y = 690;
const SEGMENTS = 40;

const rulerPoint = (t: number) => ({x: X0 + (X1 - X0) * t, y: Y});

export const LightYear: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const seconds = Math.min(frame / fps, durationInFrames / fps);
  const straight = smooth(range(seconds, 0, 0.88));
  const travel = smooth(range(seconds, 0.82, 4.75));
  const lock = smooth(range(seconds, 4.55, 5.15));
  const caption = smooth(range(seconds, 5.25, 6.0));
  const age = smooth(range(seconds, 5.95, 6.55));
  const cut = smooth(range(seconds, 6.35, 7.05));
  const fall = smooth(range(seconds, 7.25, 8.0));
  const count = Math.round(travel * 40);
  const head = rulerPoint(travel);

  const bow = (1 - straight) * 150;
  const curvePoints = Array.from({length: 101}, (_, i) => {
    const t = i / 100;
    return {
      x: X0 + (X1 - X0) * t,
      y: Y - bow * Math.sin(Math.PI * t),
    };
  });
  const curvePath = curvePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="rulerSky" cx="0.52" cy="0.44" r="0.9">
            <stop offset="0" stopColor="#040d14" />
            <stop offset="0.58" stopColor="#010609" />
            <stop offset="1" stopColor="#000102" />
          </radialGradient>
          <linearGradient id="rulerLine" gradientUnits="userSpaceOnUse" x1={X0} y1={Y} x2={X1} y2={Y}>
            <stop offset="0" stopColor="#ffe6bd" stopOpacity="0.1" />
            <stop offset="0.3" stopColor="#ffe4b7" stopOpacity="0.68" />
            <stop offset="0.68" stopColor="#edf1de" stopOpacity="0.95" />
            <stop offset="1" stopColor="#d3f0ed" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="rulerHead">
            <stop offset="0" stopColor="#fff" stopOpacity="0.98" />
            <stop offset="0.1" stopColor="#fff5da" stopOpacity="0.8" />
            <stop offset="0.42" stopColor="#d4eeeb" stopOpacity="0.2" />
            <stop offset="1" stopColor="#d4eeeb" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rulerVignette" cx="0.5" cy="0.49" r="0.78">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0.1" />
            <stop offset="1" stopColor="#000" stopOpacity="0.72" />
          </radialGradient>
          <filter id="rulerGlow" x="-20%" y="-300%" width="140%" height="700%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
          <filter id="rulerHeadBlur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4.2" />
          </filter>
        </defs>

        <rect width="1920" height="1080" fill="url(#rulerSky)" />
        <SpaceField seconds={seconds} count={165} opacity={0.58} seedPrefix="ruler" />
        <ellipse cx={980} cy={410} rx={800} ry={170} fill="#637f88" opacity={0.018} transform="rotate(-5 980 410)" />

        <g opacity={0.42 + 0.38 * straight}>
          <path d={curvePath} fill="none" stroke="#d4e3db" strokeWidth={0.7} opacity={0.55} />
          <path d={curvePath} fill="none" stroke="#f5e7cd" strokeWidth={9} opacity={0.06} filter="url(#rulerGlow)" />
        </g>

        <line x1={X0} x2={head.x} y1={Y} y2={Y} stroke="url(#rulerLine)" strokeWidth={1.4} opacity={0.9 * smooth(range(seconds, 0.48, 0.95))} />
        <line x1={X0} x2={head.x} y1={Y} y2={Y} stroke="#f0f7e9" strokeWidth={8} opacity={0.06 * smooth(range(seconds, 0.48, 0.95))} filter="url(#rulerGlow)" />

        {Array.from({length: SEGMENTS + 1}, (_, i) => {
          const t = i / SEGMENTS;
          if (t > travel + 0.0001) return null;
          const p = rulerPoint(t);
          const major = i % 10 === 0;
          const mid = i % 5 === 0;
          const height = major ? 19 : mid ? 11 : 5;
          return (
            <g key={i}>
              <line
                x1={p.x}
                x2={p.x}
                y1={Y + 5}
                y2={Y + 5 + height}
                stroke={major ? '#e8dfcd' : '#91b5b7'}
                strokeWidth={major ? 1.15 : 0.7}
                opacity={major ? 0.8 : 0.42}
              />
              {major ? (
                <text x={p.x} y={Y + 56} textAnchor="middle" fill="#8ea4a6" fontFamily={FONT} fontSize={16} letterSpacing={1.5}>
                  {i}
                </text>
              ) : null}
            </g>
          );
        })}

        {travel > 0 ? (
          <g>
            <circle cx={head.x} cy={head.y} r={32} fill="url(#rulerHead)" opacity={0.9} filter="url(#rulerHeadBlur)" />
            <circle cx={head.x} cy={head.y} r={3} fill="#fffdf3" />
            <circle cx={head.x} cy={head.y} r={1.2} fill="#fff" />
          </g>
        ) : null}

        <text x={X0} y={Y - 28} fill="rgba(136,160,161,0.82)" fontFamily={FONT} fontSize={14} fontWeight={360} letterSpacing={3}>
          沿光的路径
        </text>
        <text x={X1} y={Y - 28} textAnchor="end" fill="rgba(173,190,184,0.9)" fontFamily={FONT} fontSize={14} fontWeight={360} letterSpacing={3}>
          {travel > 0 ? '距离 / DISTANCE' : ''}
        </text>

        <g opacity={smooth(range(seconds, 0.55, 1.15)) * (0.7 + 0.3 * lock)}>
          <text x={1548} y={198} textAnchor="end" fill="#8fa5a7" fontFamily={FONT} fontSize={19} fontWeight={360} letterSpacing={4}>
            已走过的距离
          </text>
          <text
            x={1514}
            y={354}
            textAnchor="end"
            fill="#f2e7d2"
            fontFamily={FONT}
            fontSize={166}
            fontWeight={240}
            letterSpacing={-2}
            style={{fontVariantNumeric: 'tabular-nums'}}
          >
            {count}
          </text>
          <text x={1544} y={338} fill="#d7c7ab" fontFamily={FONT} fontSize={36} fontWeight={300} letterSpacing={2}>
            光年
          </text>
          <line x1={1140} x2={1560} y1={382} y2={382} stroke="#baa582" strokeWidth={0.75} opacity={0.42} />
        </g>

        <g opacity={caption} transform={`translate(0 ${(1 - caption) * 14})`}>
          <text x={146} y={214} fill="#8fa5a7" fontFamily={FONT} fontSize={18} fontWeight={360} letterSpacing={4}>
            光年
          </text>
          <text x={142} y={300} fill="#f2ecdf" fontFamily={FONT} fontSize={62} fontWeight={290} letterSpacing={2.4}>
            是距离。
          </text>
          <text x={142} y={356} fill="#a9b8b7" fontFamily={FONT} fontSize={27} fontWeight={340} letterSpacing={2.1}>
            不是恒星的年龄。
          </text>
        </g>

        <g opacity={age} transform={`translate(${(1 - age) * 16} 0)`}>
          <text x={1710} y={560} textAnchor="middle" fill="#a8b6b4" fontFamily={FONT} fontSize={30} fontWeight={320} letterSpacing={4}>
            年龄
          </text>
          <line
            x1={1618}
            x2={1618 + 184 * cut}
            y1={592}
            y2={592 - 68 * cut}
            stroke="#efcfa1"
            strokeWidth={1.1}
            opacity={0.85 * cut}
          />
          <text x={1710} y={596} textAnchor="middle" fill="rgba(173,188,185,0.55)" fontFamily={FONT} fontSize={14} fontWeight={340} letterSpacing={2}>
            需要另外测量
          </text>
        </g>

        <text x={146} y={1016} fill="rgba(128,149,152,0.82)" fontFamily={FONT} fontSize={15} fontWeight={350} letterSpacing={1.5}>
          1 光年 = 光在真空中走一年的距离 · 约 9.46 万亿公里
        </text>

        {fall > 0 ? (
          <g>
            <line
              x1={head.x}
              y1={Y}
              x2={head.x + 18 * fall}
              y2={Y + 242 * fall}
              stroke="#f7e7cd"
              strokeWidth={1.1}
              opacity={0.5 * (1 - fall * 0.25)}
            />
            <circle cx={head.x + 18 * fall} cy={Y + 242 * fall} r={5 + 9 * fall} fill="url(#rulerHead)" opacity={0.7} />
          </g>
        ) : null}

        <rect width="1920" height="1080" fill="url(#rulerVignette)" pointerEvents="none" />
      </svg>
    </AbsoluteFill>
  );
};
