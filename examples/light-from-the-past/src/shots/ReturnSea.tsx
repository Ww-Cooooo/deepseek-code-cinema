import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from '../font';
import {range, smooth} from '../scene/geometry';
import {layout, palette} from '../theme';
import {SeaWorld} from './SeaWorld';

const FOCUS = {x: 1456, y: 804};
const START_ZOOM = 2.7;
const END_ZOOM = 1.08;

const threads = [
  {x: 250, y: 190, phase: 0.2},
  {x: 920, y: 90, phase: 1.8},
  {x: 1740, y: 245, phase: 3.1},
  {x: 360, y: 420, phase: 4.2},
  {x: 1100, y: 150, phase: 2.4},
  {x: 1680, y: 430, phase: 5.3},
];

export const ReturnSea: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const reveal = smooth(range(seconds, 0.25, 4.1));
  const zoom = START_ZOOM + (END_ZOOM - START_ZOOM) * reveal;

  const startTx = 960 - FOCUS.x * START_ZOOM;
  const startTy = 540 - FOCUS.y * START_ZOOM;
  const endTx = 960 - 960 * END_ZOOM;
  const endTy = 540 - 540 * END_ZOOM;
  const tx = startTx + (endTx - startTx) * reveal;
  const ty = startTy + (endTy - startTy) * reveal;

  const titleIn = smooth(range(seconds, 4.7, 5.55));
  const titleOut = 1 - smooth(range(seconds, 6.25, 6.85));
  const blackout = smooth(range(seconds, 6.4, 6.98));
  const fadeIn = 1 - smooth(range(seconds, 0, 0.55));
  const threadsIn = smooth(range(seconds, 3.7, 5.1));

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <SeaWorld seconds={seconds} pulse={false} showLightPath={false} />
        <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0}}>
          <g opacity={threadsIn * 0.55}>
            {threads.map((thread, i) => (
              <line
                key={i}
                x1={thread.x}
                y1={thread.y}
                x2={layout.head.x}
                y2={layout.head.y - 4}
                stroke={i % 3 === 0 ? '#d7c3a0' : '#a8c3c5'}
                strokeWidth={i % 2 === 0 ? 0.55 : 0.4}
                strokeDasharray={i % 2 === 0 ? '1.5 9' : undefined}
                opacity={0.18 + 0.1 * Math.sin(seconds * 0.7 + thread.phase)}
              />
            ))}
            {threads.map((thread, i) => (
              <circle
                key={`dot-${i}`}
                cx={thread.x}
                cy={thread.y}
                r={i === 2 ? 2.4 : 1.4}
                fill="#e8ddc6"
                opacity={0.48 * threadsIn}
              />
            ))}
          </g>
        </svg>
      </div>

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 52% 44%, rgba(0,0,0,0) 26%, rgba(0,0,0,0.22) 66%, rgba(0,0,0,0.62) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,7,12,0.15) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.3) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 152,
          top: 172 + (1 - titleIn) * 16,
          width: 900,
          opacity: titleIn * titleOut,
          fontFamily: FONT,
          color: palette.ivory,
          textShadow: '0 2px 30px rgba(0,0,0,0.72)',
        }}
      >
        <div
          style={{
            width: 55 * titleIn,
            height: 1,
            background: 'linear-gradient(90deg, rgba(212,177,125,0.9), rgba(212,177,125,0))',
            marginBottom: 27,
          }}
        />
        <div style={{fontSize: 52, fontWeight: 300, lineHeight: 1.58, letterSpacing: 2.4}}>
          仰望星空，
          <br />
          就是<span style={{color: '#efd1a1'}}>回望时间</span>。
        </div>
      </div>

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          opacity: Math.max(fadeIn, blackout),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
