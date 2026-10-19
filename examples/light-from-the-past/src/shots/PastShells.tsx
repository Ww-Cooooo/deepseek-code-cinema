import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, random} from 'remotion';
import {FONT} from '../font';
import {range, smooth} from '../scene/geometry';
import {SpaceField} from '../scene/SpaceField';

const E = {x: 720, y: 600};
const SQUASH = 0.64;

type Shell = {
  id: string;
  radius: number;
  angle: number;
  name: string;
  detail: string;
  dot: 'moon' | 'sun' | 'star' | 'far';
  reveal: number;
  labelOffset: {x: number; y: number};
  anchor: 'start' | 'end';
};

const SHELLS: Shell[] = [
  {
    id: 'moon',
    radius: 250,
    angle: -72,
    name: '月球',
    detail: '光行约 1.3 秒',
    dot: 'moon',
    reveal: 0.8,
    labelOffset: {x: -26, y: -27},
    anchor: 'end',
  },
  {
    id: 'sun',
    radius: 390,
    angle: -45,
    name: '太阳',
    detail: '光行约 8 分 20 秒',
    dot: 'sun',
    reveal: 2.3,
    labelOffset: {x: 24, y: -8},
    anchor: 'start',
  },
  {
    id: 'proxima',
    radius: 560,
    angle: -18,
    name: '比邻星 · 4.24 光年',
    detail: '光行约 4.24 年',
    dot: 'star',
    reveal: 4.0,
    labelOffset: {x: 26, y: -7},
    anchor: 'start',
  },
  {
    id: 'far',
    radius: 780,
    angle: 12,
    name: '40 光年外（示意）',
    detail: '光行约 40 年',
    dot: 'far',
    reveal: 5.8,
    labelOffset: {x: 28, y: 22},
    anchor: 'start',
  },
];

const pointOnShell = (radius: number, angle: number) => ({
  x: E.x + radius * Math.cos((angle * Math.PI) / 180),
  y: E.y + radius * Math.sin((angle * Math.PI) / 180) * SQUASH,
});

const Dot: React.FC<{kind: Shell['dot']; x: number; y: number; seconds: number}> = ({kind, x, y, seconds}) => {
  if (kind === 'sun') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={22} fill="#f4c987" opacity={0.1} />
        <circle r={6.5} fill="#f6d393" opacity={0.92} />
        <circle r={2.5} fill="#fff8df" />
      </g>
    );
  }
  if (kind === 'moon') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={12} fill="#c6d6d4" opacity={0.06} />
        <circle r={4.1} fill="#dce3d9" opacity={0.85} />
        <circle cx={-1.2} cy={-0.8} r={3.2} fill="#7e9698" opacity={0.5} />
      </g>
    );
  }
  if (kind === 'star') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={18} fill="#e4bb8b" opacity={0.08} />
        <circle r={3.4} fill="#f1c48f" opacity={0.9 + 0.1 * Math.sin(seconds * 1.4)} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={26} fill="#f7d3a0" opacity={0.06} />
      <circle r={3.1} fill="#ffe3b3" />
    </g>
  );
};

const EarthAtShellCenter: React.FC<{earthR: number; seconds: number}> = ({earthR, seconds}) => {
  const lights = useMemo(
    () =>
      Array.from({length: 12}, (_, i) => ({
        x: (random(`shell-earth-x-${i}`) - 0.5) * earthR * 1.12,
        y: (random(`shell-earth-y-${i}`) - 0.2) * earthR * 1.05,
        s: 0.4 + random(`shell-earth-s-${i}`) * 1.2,
      })),
    [earthR],
  );
  return (
    <g transform={`translate(${E.x} ${E.y})`}>
      <circle r={earthR * 1.55} fill="url(#shellEarthHalo)" />
      <circle r={earthR} fill="url(#shellEarth)" />
      <circle r={earthR * 1.025} fill="none" stroke="url(#shellEarthAtmo)" strokeWidth={Math.max(0.8, earthR * 0.018)} opacity={0.78} />
      <circle r={earthR * 1.08} fill="none" stroke="#6fbac7" strokeWidth={earthR * 0.06} opacity={0.1} filter="url(#shellBlur)" />
      <g clipPath="url(#shellEarthClip)">
        <ellipse cx={-earthR * 0.36} cy={-earthR * 0.18} rx={earthR * 0.56} ry={earthR * 0.84} fill="url(#shellCrescent)" opacity={0.7} />
        <path d={`M ${-earthR} ${earthR * 0.2} C ${-earthR * 0.4} ${-earthR * 0.08} ${earthR * 0.3} ${earthR * 0.04} ${earthR} ${earthR * 0.4}`} fill="none" stroke="#91b9bd" strokeWidth={earthR * 0.06} opacity={0.12} filter="url(#shellBlur)" />
        {lights.map((light, i) => (
          <circle
            key={i}
            cx={light.x}
            cy={light.y}
            r={light.s}
            fill="#f2c287"
            opacity={0.35 + 0.25 * Math.sin(seconds * 1.1 + i * 2.1)}
          />
        ))}
      </g>
      <text
        x={0}
        y={earthR + 30}
        textAnchor="middle"
        fill="#8fa6a9"
        fontFamily={FONT}
        fontSize={16}
        letterSpacing={3}
      >
        地球
      </text>
    </g>
  );
};

export const PastShells: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const seconds = Math.min(frame / fps, durationInFrames / fps);
  const earthR = 232 - 114 * smooth(range(seconds, 0, 1.6));
  const caption = smooth(range(seconds, 6.65, 7.35));
  const endGlow = smooth(range(seconds, 7.9, 9.0));

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="shellSky" cx="0.4" cy="0.45" r="0.86">
            <stop offset="0" stopColor="#041018" />
            <stop offset="0.54" stopColor="#02080e" />
            <stop offset="1" stopColor="#000102" />
          </radialGradient>
          <radialGradient id="shellEarth">
            <stop offset="0" stopColor="#0e3041" />
            <stop offset="0.48" stopColor="#071b25" />
            <stop offset="0.86" stopColor="#02080c" />
            <stop offset="1" stopColor="#010204" />
          </radialGradient>
          <radialGradient id="shellCrescent">
            <stop offset="0" stopColor="#9cd8df" stopOpacity="0.36" />
            <stop offset="0.6" stopColor="#4e8b99" stopOpacity="0.09" />
            <stop offset="1" stopColor="#4e8b99" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="shellEarthHalo">
            <stop offset="0" stopColor="#6eb6c6" stopOpacity="0.18" />
            <stop offset="0.4" stopColor="#4f92a1" stopOpacity="0.07" />
            <stop offset="1" stopColor="#4f92a1" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="shellEarthAtmo" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0" stopColor="#d4f2f1" stopOpacity="0" />
            <stop offset="0.34" stopColor="#93d0d6" stopOpacity="0.24" />
            <stop offset="0.58" stopColor="#d1f0ef" stopOpacity="0.92" />
            <stop offset="0.78" stopColor="#70b6c4" stopOpacity="0.18" />
            <stop offset="1" stopColor="#70b6c4" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="shellVignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.72" stopColor="#000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0.7" />
          </radialGradient>
          <clipPath id="shellEarthClip">
            <circle r={earthR} />
          </clipPath>
          <filter id="shellBlur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="shellGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>

        <rect width="1920" height="1080" fill="url(#shellSky)" />
        <g transform={`translate(${-18 * smooth(range(seconds, 0, 9))} 0)`}>
          <SpaceField seconds={seconds} count={220} opacity={0.8} seedPrefix="shell" />
        </g>
        <ellipse cx={1040} cy={430} rx={900} ry={220} fill="#64848d" opacity={0.025} transform="rotate(-7 1040 430)" />

        {SHELLS.map((shell, index) => {
          const reveal = smooth(range(seconds, shell.reveal, shell.reveal + 1.0));
          if (reveal <= 0) return null;
          const dot = pointOnShell(shell.radius, shell.angle);
          const labelStart = smooth(range(seconds, shell.reveal + 0.45, shell.reveal + 1.0));
          const ringOpacity = 0.2 + 0.15 * reveal;
          const isFar = shell.id === 'far';
          const labelX = dot.x + shell.labelOffset.x;
          const labelY = dot.y + shell.labelOffset.y;
          return (
            <g key={shell.id} opacity={reveal}>
              <ellipse
                cx={E.x}
                cy={E.y}
                rx={shell.radius}
                ry={shell.radius * SQUASH}
                fill="none"
                stroke={isFar ? '#d7c29e' : '#80bcc5'}
                strokeWidth={isFar ? 1.0 : 0.72}
                strokeOpacity={ringOpacity}
                strokeDasharray={isFar ? '3 13' : undefined}
                transform={`translate(${E.x} ${E.y}) scale(${1.012 - 0.012 * reveal}) translate(${-E.x} ${-E.y})`}
              />
              <line
                x1={E.x}
                y1={E.y}
                x2={dot.x}
                y2={dot.y}
                stroke={isFar ? '#cab996' : '#75aeb7'}
                strokeWidth={0.5}
                strokeDasharray="2 7"
                opacity={0.16 + 0.12 * reveal}
              />
              <g opacity={labelStart} filter="url(#shellGlow)">
                <Dot kind={shell.dot} x={dot.x} y={dot.y} seconds={seconds} />
              </g>
              <Dot kind={shell.dot} x={dot.x} y={dot.y} seconds={seconds} />
              <g
                opacity={labelStart}
                transform={`translate(0 ${(1 - labelStart) * 6})`}
                fontFamily={FONT}
              >
                <line
                  x1={dot.x + (shell.anchor === 'start' ? 9 : -9)}
                  x2={labelX - (shell.anchor === 'start' ? 7 : -7)}
                  y1={dot.y - 4}
                  y2={labelY - 6}
                  stroke={isFar ? '#c6b694' : '#9dc6ca'}
                  strokeWidth={0.55}
                  opacity={0.45}
                />
                <text
                  x={labelX}
                  y={labelY}
                  fill={isFar ? '#e4d3b4' : '#e2e8df'}
                  fontSize={20}
                  fontWeight={isFar ? 430 : 390}
                  letterSpacing={1.1}
                  textAnchor={shell.anchor}
                  style={{paintOrder: 'stroke'}}
                  stroke="#01050a"
                  strokeWidth={4}
                >
                  {shell.name}
                </text>
                <text
                  x={labelX}
                  y={labelY + 26}
                  fill={isFar ? '#b39c7b' : '#97acad'}
                  fontSize={17}
                  fontWeight={360}
                  letterSpacing={1.4}
                  textAnchor={shell.anchor}
                  style={{paintOrder: 'stroke'}}
                  stroke="#01050a"
                  strokeWidth={4}
                >
                  {shell.detail}
                </text>
              </g>
              <circle
                cx={dot.x}
                cy={dot.y}
                r={shell.dot === 'far' ? 7 + 24 * endGlow : 0}
                fill="none"
                stroke="#f0d4a6"
                strokeWidth={0.7}
                opacity={isFar ? 0.28 * endGlow : 0}
              />
              {index === 3 ? (
                <circle cx={dot.x} cy={dot.y} r={3.2} fill="#fff1d6" opacity={0.85 + 0.15 * endGlow} />
              ) : null}
            </g>
          );
        })}

        <EarthAtShellCenter earthR={earthR} seconds={seconds} />

        <g opacity={caption} transform={`translate(0 ${(1 - caption) * 13})`}>
          <line x1={146} x2={224} y1={148} y2={148} stroke="#b9a37e" strokeWidth={0.8} opacity={0.5} />
          <text
            x={142}
            y={224}
            fill="#f0eadf"
            fontFamily={FONT}
            fontSize={54}
            fontWeight={300}
            letterSpacing={2.6}
            style={{paintOrder: 'stroke'}}
            stroke="#01050a"
            strokeWidth={6}
          >
            同一眼，
          </text>
          <text
            x={142}
            y={288}
            fill="#f0eadf"
            fontFamily={FONT}
            fontSize={54}
            fontWeight={300}
            letterSpacing={2.6}
            style={{paintOrder: 'stroke'}}
            stroke="#01050a"
            strokeWidth={6}
          >
            不同的过去。
          </text>
        </g>

        <text
          x={144}
          y={1018}
          fill="rgba(132,154,157,0.8)"
          fontFamily={FONT}
          fontSize={14}
          fontWeight={350}
          letterSpacing={1.8}
        >
          等光行时圈 · 非比例示意
        </text>

        <rect width="1920" height="1080" fill="url(#shellVignette)" pointerEvents="none" />
      </svg>
    </AbsoluteFill>
  );
};
