import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from '../font';
import {clamp01, range, smooth} from '../scene/geometry';
import {SpaceField} from '../scene/SpaceField';
import {getStarTexture} from '../scene/textures';

type Point = {x: number; y: number};

const bezier = (a: Point, b: Point, c: Point, d: Point, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
};

const sample = (a: Point, b: Point, c: Point, d: Point, from: number, to: number, n = 64) => {
  const points: Point[] = [];
  const count = Math.max(2, n);
  for (let i = 0; i < count; i++) {
    points.push(bezier(a, b, c, d, from + ((to - from) * i) / (count - 1)));
  }
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
};

const Earth: React.FC<{x: number; y: number; r: number; seconds: number; lit: number}> = ({x, y, r, seconds, lit}) => {
  const cityOpacity = smooth(range(r, 48, 142));
  const cities = useMemo(
    () => [
      [-0.44, 0.16, 1.5], [-0.22, 0.44, 1.0], [0.06, 0.18, 1.3], [0.27, 0.51, 1.1],
      [0.49, 0.13, 0.8], [-0.12, -0.18, 0.9], [0.31, -0.1, 0.75], [0.02, 0.66, 0.8],
      [-0.58, -0.12, 0.7], [0.52, 0.36, 0.6], [0.16, -0.38, 0.55], [-0.34, 0.62, 0.9],
      [0.4, 0.64, 0.6], [0.64, -0.12, 0.48], [-0.7, 0.28, 0.5], [0.2, 0.32, 0.8],
    ],
    [],
  );

  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r * 1.52} fill="url(#earthGlow)" />
      <circle
        r={r}
        fill="url(#earthSurface)"
        stroke="rgba(109,183,201,0.55)"
        strokeWidth={Math.max(0.6, r * 0.012)}
      />
      <g clipPath="url(#earthClip)">
        <ellipse cx={-r * 0.34} cy={-r * 0.14} rx={r * 0.6} ry={r * 0.92} fill="url(#earthCrescent)" opacity={0.52 + 0.24 * lit} />
        <path
          d={`M ${-r * 0.8} ${-r * 0.28} C ${-r * 0.25} ${-r * 0.5} ${r * 0.18} ${-r * 0.4} ${r * 0.75} ${-r * 0.12}`}
          fill="none"
          stroke="#bcdde3"
          strokeWidth={Math.max(0.5, r * 0.016)}
          opacity={0.1 + 0.08 * lit}
          filter="url(#softEarthCloud)"
        />
        <path
          d={`M ${-r * 0.9} ${r * 0.25} C ${-r * 0.3} ${r * 0.02} ${r * 0.12} ${r * 0.18} ${r * 0.85} ${r * 0.47}`}
          fill="none"
          stroke="#86b8c3"
          strokeWidth={Math.max(0.4, r * 0.012)}
          opacity={0.08}
          filter="url(#softEarthCloud)"
        />
        {r > 34
          ? cities.map(([cx, cy, s], i) => (
              <circle
                key={i}
                cx={cx * r}
                cy={cy * r}
                r={Math.max(0.45, r * 0.009 * s)}
                fill="#f3c187"
                opacity={cityOpacity * (0.5 + 0.3 * Math.sin(seconds * 1.2 + i * 2.4))}
              />
            ))
          : null}
      </g>
      <circle
        r={r * 1.012}
        fill="none"
        stroke="url(#earthRim)"
        strokeWidth={Math.max(0.8, r * 0.018)}
        opacity={0.7}
      />
      <circle
        r={r * 1.045}
        fill="none"
        stroke="#74bccb"
        strokeWidth={Math.max(1.2, r * 0.045)}
        opacity={0.16}
        filter="url(#softEarthCloud)"
      />
    </g>
  );
};

export const LightCorridor: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const seconds = Math.min(frame / fps, durationInFrames / fps);
  const pull = smooth(range(seconds, 0.6, 8.55));

  const star = {
    x: 280 - 198 * pull,
    y: 540 - 112 * pull,
    r: 570 - 505 * pull,
  };
  const earth = {
    x: 1660 - 218 * pull,
    y: 500 + 66 * pull,
    r: 11 + 143 * pull,
  };

  const beamProgress = smooth(range(seconds, 0.95, 8.45));
  const start: Point = {x: star.x + star.r * 0.88, y: star.y - star.r * 0.14};
  const end: Point = {x: earth.x - earth.r * 0.94, y: earth.y - earth.r * 0.28};
  const c1: Point = {x: start.x + (end.x - start.x) * 0.34, y: Math.min(start.y, end.y) - 130};
  const c2: Point = {x: start.x + (end.x - start.x) * 0.7, y: Math.max(start.y, end.y) - 82};
  const head = bezier(start, c1, c2, end, beamProgress);
  const trailStart = Math.max(0, beamProgress - 0.16);
  const routePath = sample(start, c1, c2, end, 0, 1, 100);
  const trailPath = beamProgress > 0.01 ? sample(start, c1, c2, end, trailStart, beamProgress, 44) : '';

  const speedIn = smooth(range(seconds, 0.85, 1.6)) * (1 - smooth(range(seconds, 3.75, 4.35)));
  const distanceIn = smooth(range(seconds, 4.35, 5.0)) * (1 - smooth(range(seconds, 7.45, 8.05)));
  const starTexture = useMemo(() => getStarTexture(), []);
  const textureRotation = seconds * 0.9;
  const hit = smooth(range(seconds, 8.25, 9));

  return (
    <AbsoluteFill style={{background: '#010307', overflow: 'hidden'}}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="corridorSky" cx="0.62" cy="0.46" r="0.85">
            <stop offset="0" stopColor="#061019" />
            <stop offset="0.55" stopColor="#02070d" />
            <stop offset="1" stopColor="#000102" />
          </radialGradient>
          <radialGradient id="corridorStarHalo">
            <stop offset="0" stopColor="#fff8e4" stopOpacity="0.82" />
            <stop offset="0.12" stopColor="#ffdba4" stopOpacity="0.48" />
            <stop offset="0.36" stopColor="#e99b50" stopOpacity="0.16" />
            <stop offset="1" stopColor="#b05c27" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="starLimbShade">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.62" stopColor="#2a0b02" stopOpacity="0.03" />
            <stop offset="0.9" stopColor="#210500" stopOpacity="0.38" />
            <stop offset="0.985" stopColor="#140200" stopOpacity="0.72" />
            <stop offset="1" stopColor="#180300" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="starLimbStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffd69b" stopOpacity="0.06" />
            <stop offset="0.62" stopColor="#ffcf8b" stopOpacity="0.32" />
            <stop offset="0.92" stopColor="#fff1cd" stopOpacity="0.95" />
            <stop offset="1" stopColor="#ffd8a1" stopOpacity="0.24" />
          </linearGradient>
          <radialGradient id="earthSurface">
            <stop offset="0" stopColor="#10384a" />
            <stop offset="0.56" stopColor="#09222e" />
            <stop offset="0.9" stopColor="#031016" />
            <stop offset="1" stopColor="#010407" />
          </radialGradient>
          <radialGradient id="earthCrescent">
            <stop offset="0" stopColor="#9bd9e4" stopOpacity="0.36" />
            <stop offset="0.62" stopColor="#3d7d8f" stopOpacity="0.1" />
            <stop offset="1" stopColor="#3d7d8f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="earthGlow">
            <stop offset="0" stopColor="#75b7c7" stopOpacity="0.14" />
            <stop offset="0.35" stopColor="#4b8b9e" stopOpacity="0.08" />
            <stop offset="1" stopColor="#4b8b9e" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="earthRim" x1="0" y1="0" x2="1" y2="0.78">
            <stop offset="0" stopColor="#d2f2f1" stopOpacity="0" />
            <stop offset="0.3" stopColor="#8ecbd2" stopOpacity="0.22" />
            <stop offset="0.55" stopColor="#c8eef0" stopOpacity="0.84" />
            <stop offset="0.72" stopColor="#75aeba" stopOpacity="0.2" />
            <stop offset="1" stopColor="#75aeba" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="beamHeadHalo">
            <stop offset="0" stopColor="#fff" stopOpacity="0.98" />
            <stop offset="0.1" stopColor="#fff5d7" stopOpacity="0.8" />
            <stop offset="0.4" stopColor="#d7f0ef" stopOpacity="0.22" />
            <stop offset="1" stopColor="#d7f0ef" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="beamTrail" gradientUnits="userSpaceOnUse" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
            <stop offset="0" stopColor="#ffe4bd" stopOpacity="0" />
            <stop offset="0.55" stopColor="#efdfc8" stopOpacity="0.34" />
            <stop offset="1" stopColor="#f2ffff" stopOpacity="0.95" />
          </linearGradient>
          <clipPath id="earthClip">
            <circle r={earth.r} />
          </clipPath>
          <filter id="softEarthCloud" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="contactBlur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <filter id="corridorGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <rect width="1920" height="1080" fill="url(#corridorSky)" />
        <g transform={`translate(${-46 * pull} ${18 * pull})`}>
          <SpaceField seconds={seconds} count={210} opacity={0.8} seedPrefix="corridor" />
        </g>
        <ellipse cx={1220 + 100 * pull} cy={400} rx={800} ry={200} fill="#6f8d96" opacity={0.026} transform="rotate(-8 1220 400)" />

        <g transform={`translate(${star.x} ${star.y})`}>
          <circle r={star.r * 2.35} fill="url(#corridorStarHalo)" opacity={0.34 + 0.07 * Math.sin(seconds * 0.9)} />
          <circle r={star.r * 1.32} fill="url(#corridorStarHalo)" opacity={0.38} filter="url(#corridorGlow)" />
          <g clipPath="url(#starClip)">
            <image
              href={starTexture}
              x={-star.r}
              y={-star.r}
              width={star.r * 2}
              height={star.r * 2}
              preserveAspectRatio="xMidYMid slice"
              opacity={0.94}
              transform={`rotate(${textureRotation})`}
            />
            <circle r={star.r} fill="url(#starLimbShade)" />
            <circle r={star.r * 0.985} fill="none" stroke="#ffd49c" strokeWidth={Math.max(0.8, star.r * 0.009)} opacity={0.36} />
          </g>
          <clipPath id="starClip">
            <circle r={star.r} />
          </clipPath>
          <circle
            r={star.r}
            fill="none"
            stroke="url(#starLimbStroke)"
            strokeWidth={Math.max(1, star.r * 0.013)}
            opacity={0.9}
          />
          <g fill="none" stroke="#ffd5a0" opacity={0.36} filter="url(#corridorGlow)">
            <path
              d={`M ${star.r * 0.58} ${-star.r * 0.62} C ${star.r * 0.88} ${-star.r * 0.8} ${star.r * 1.01} ${-star.r * 0.48} ${star.r * 0.8} ${-star.r * 0.36}`}
              strokeWidth={Math.max(0.7, star.r * 0.008)}
            />
            <path
              d={`M ${star.r * 0.5} ${star.r * 0.58} C ${star.r * 0.73} ${star.r * 0.8} ${star.r * 0.98} ${star.r * 0.63} ${star.r * 0.84} ${star.r * 0.43}`}
              strokeWidth={Math.max(0.5, star.r * 0.006)}
              opacity={0.6}
            />
          </g>
        </g>

        <g opacity={0.34}>
          <path d={routePath} fill="none" stroke="#b9d5d7" strokeWidth={0.7} />
          {[0.25, 0.5, 0.75].map((t, i) => {
            const p = bezier(start, c1, c2, end, t);
            return (
              <line
                key={i}
                x1={p.x - 6}
                x2={p.x + 6}
                y1={p.y - 6}
                y2={p.y + 6}
                stroke="#b9d5d7"
                strokeWidth={0.5}
                opacity={0.4}
              />
            );
          })}
        </g>

        {beamProgress > 0 ? (
          <g>
            <path d={trailPath} fill="none" stroke="#eaf8f5" strokeWidth={5.5} opacity={0.12} filter="url(#corridorGlow)" strokeLinecap="round" />
            <path d={trailPath} fill="none" stroke="url(#beamTrail)" strokeWidth={1.35} opacity={0.9} strokeLinecap="round" />
            <circle cx={head.x} cy={head.y} r={25} fill="url(#beamHeadHalo)" opacity={0.7} filter="url(#contactBlur)" />
            <circle cx={head.x} cy={head.y} r={2.4} fill="#fffdf2" />
            <circle cx={head.x} cy={head.y} r={1.2} fill="#fff" opacity={0.9} />
          </g>
        ) : null}

        <Earth x={earth.x} y={earth.y} r={earth.r} seconds={seconds} lit={hit} />

        {seconds > 8.15 ? (
          <g opacity={hit}>
            <circle cx={end.x} cy={end.y} r={7 + 30 * hit} fill="url(#beamHeadHalo)" opacity={0.8} />
            <circle cx={end.x} cy={end.y} r={3 + 23 * hit} fill="none" stroke="#d9f1f0" strokeWidth={0.8} opacity={0.55 * (1 - hit * 0.35)} />
          </g>
        ) : null}

        <g opacity={speedIn} transform={`translate(0 ${(1 - speedIn) * 14})`}>
          <text x={930 - 78 * pull} y={214} fill="#91a5a8" fontFamily={FONT} fontSize={20} fontWeight={350} letterSpacing={4}>
            光，每秒约走
          </text>
          <text x={922 - 78 * pull} y={372} fill="#f4e8d2" fontFamily={FONT} fontSize={150} fontWeight={250} letterSpacing={3}>
            30 万
          </text>
          <line x1={930 - 78 * pull} x2={1370 - 78 * pull} y1={406} y2={406} stroke="#b49b76" strokeWidth={0.8} opacity={0.48} />
          <text x={934 - 78 * pull} y={452} fill="#b9c7c8" fontFamily={FONT} fontSize={24} fontWeight={350} letterSpacing={3}>
            公里 / 秒 · 真空光速
          </text>
        </g>

        <g opacity={distanceIn} transform={`translate(0 ${(1 - distanceIn) * 14})`}>
          <text x={930 - 78 * pull} y={214} fill="#91a5a8" fontFamily={FONT} fontSize={20} fontWeight={350} letterSpacing={4}>
            假设距离 40 光年
          </text>
          <text x={922 - 78 * pull} y={372} fill="#f4e8d2" fontFamily={FONT} fontSize={150} fontWeight={250} letterSpacing={3}>
            40 年
          </text>
          <line x1={930 - 78 * pull} x2={1370 - 78 * pull} y1={406} y2={406} stroke="#b49b76" strokeWidth={0.8} opacity={0.48} />
          <text x={934 - 78 * pull} y={452} fill="#b9c7c8" fontFamily={FONT} fontSize={24} fontWeight={350} letterSpacing={3}>
            以光速，也要走 40 年
          </text>
        </g>

        <rect width="1920" height="1080" fill="url(#corridorVignette)" pointerEvents="none" />
        <defs>
          <radialGradient id="corridorVignette" cx="0.5" cy="0.48" r="0.72">
            <stop offset="0" stopColor="#000" stopOpacity="0" />
            <stop offset="0.7" stopColor="#000" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0.62" />
          </radialGradient>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};
