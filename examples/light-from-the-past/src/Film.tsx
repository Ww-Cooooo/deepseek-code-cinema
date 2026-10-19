import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, Series, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {film, review, timeline} from './config';
import {ensureFont, FONT} from './font';
import {Grain} from './scene/Grain';
import {beamPoint, range, smooth} from './scene/geometry';
import {Landscape} from './scene/Landscape';
import {LightPath} from './scene/LightPath';
import {Starfield} from './scene/Starfield';
import {Atmosphere} from './shots/Atmosphere';
import {LightCorridor} from './shots/LightCorridor';
import {LightYear} from './shots/LightYear';
import {PastShells} from './shots/PastShells';
import {ReturnSea} from './shots/ReturnSea';
import {StarSea} from './shots/StarSea';
import {layout, palette} from './theme';

const clampOpacity = (value: number) => Math.max(0, Math.min(1, value));

const SHOTS: Record<string, React.FC> = {
  'star-sea': StarSea,
  'light-corridor': LightCorridor,
  atmosphere: Atmosphere,
  'past-shells': PastShells,
  'light-year': LightYear,
  return: ReturnSea,
};

export const FullFilm: React.FC = () => {
  const frame = useCurrentFrame();
  useEffect(() => {
    void ensureFont();
  }, []);

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Series>
        {timeline.map((shot) => {
          const Shot = SHOTS[shot.id];
          if (!Shot) throw new Error(`No component for shot ${shot.id}`);
          return (
            <Series.Sequence key={shot.id} durationInFrames={shot.durationInFrames}>
              <Shot />
            </Series.Sequence>
          );
        })}
      </Series>
      <Grain frame={frame} />
      {film.audioFile ? <Audio src={staticFile(film.audioFile)} /> : null}
    </AbsoluteFill>
  );
};

export const ReviewFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const seconds = frame / fps;

  useEffect(() => {
    void ensureFont();
  }, []);

  const camera = smooth(range(seconds, 0.12, layout.beamArrive));
  const zoom = 1 + 0.046 * camera;
  const driftX = -8 * camera + Math.sin(seconds * 0.22) * 0.7;
  const driftY = -6 * camera + Math.cos(seconds * 0.18) * 0.5;

  const starLabelIn = smooth(range(seconds, 1.95, 2.75));
  const beamLabelPoint = beamPoint(0.62);
  const beamLabelIn = smooth(range(seconds, 3.85, 4.3));
  const beamLabelOut = 1 - smooth(range(seconds, 6.35, 6.8));
  const beamLabelOpacity = beamLabelIn * beamLabelOut;

  const captionIn = smooth(range(seconds, 5.78, 6.46));
  const captionY = 18 * (1 - captionIn);
  const fadeIn = 1 - smooth(range(seconds, 0, 0.82));
  const closeDark = smooth(range(seconds, 7.82, 8));

  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${driftX}px, ${driftY}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          style={{position: 'absolute', inset: 0}}
          preserveAspectRatio="xMidYMid slice"
        >
          <Landscape seconds={seconds} />
          <Starfield seconds={seconds} />
          <LightPath seconds={seconds} />

          <g
            opacity={clampOpacity(starLabelIn)}
            transform={`translate(0 ${(1 - starLabelIn) * 5})`}
          >
            <line
              x1={layout.star.x - 12}
              x2={layout.star.x + 12}
              y1={layout.star.y + 67}
              y2={layout.star.y + 67}
              stroke="#d6c2a0"
              strokeWidth={0.6}
              opacity={0.31}
            />
            <text
              x={layout.star.x}
              y={layout.star.y + 93}
              textAnchor="middle"
              fill="#9dafb3"
              fontFamily={FONT}
              fontSize={19}
              fontWeight={380}
              letterSpacing={2.6}
            >
              40 光年外 · 示意
            </text>
          </g>

          <g opacity={clampOpacity(beamLabelOpacity)}>
            <line
              x1={beamLabelPoint.x - 12}
              x2={beamLabelPoint.x + 11}
              y1={beamLabelPoint.y - 12}
              y2={beamLabelPoint.y + 11}
              stroke="#c4d8d7"
              strokeWidth={0.65}
              opacity={0.44}
            />
            <line
              x1={beamLabelPoint.x + 17}
              x2={beamLabelPoint.x + 32}
              y1={beamLabelPoint.y - 7}
              y2={beamLabelPoint.y - 7}
              stroke="#c4d8d7"
              strokeWidth={0.55}
              opacity={0.36}
            />
            <text
              x={beamLabelPoint.x + 39}
              y={beamLabelPoint.y}
              fill="#c2d2d4"
              fontFamily={FONT}
              fontSize={19}
              fontWeight={360}
              letterSpacing={2.1}
            >
              光行 40 年
            </text>
          </g>
        </svg>
      </div>

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 51% 43%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.24) 66%, rgba(0,0,0,0.58) 100%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(0,7,12,0.16) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.26) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 152,
          top: 174 + captionY,
          width: 1010,
          opacity: captionIn,
          transform: `translateY(${captionY}px)`,
          fontFamily: FONT,
          color: palette.ivory,
          textShadow: '0 2px 28px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            width: 58 * captionIn,
            height: 1,
            background: 'linear-gradient(90deg, rgba(215,179,127,0.85), rgba(215,179,127,0))',
            marginBottom: 28,
          }}
        />
        <div
          style={{
            fontSize: 54,
            fontWeight: 310,
            lineHeight: 1.55,
            letterSpacing: 2.4,
          }}
        >
          你看见的，
          <br />
          是它 <span style={{color: '#efd2a2', fontWeight: 360}}>40 年</span>前发出的光。
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 154,
          bottom: 105,
          fontFamily: FONT,
          fontSize: 18,
          fontWeight: 350,
          letterSpacing: 2.2,
          color: 'rgba(165,180,180,0.88)',
          opacity: captionIn * 0.9,
        }}
      >
        假设恒星：距离 40 光年 · 光行时间 40 年
      </div>

      <Grain frame={frame} />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          opacity: Math.max(fadeIn, closeDark * 0.2),
          pointerEvents: 'none',
        }}
      />

      <Audio src={staticFile(review.audioFile)} />
    </AbsoluteFill>
  );
};
