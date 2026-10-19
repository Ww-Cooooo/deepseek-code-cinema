import React, {useEffect} from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  film,
  filmSpec,
  fullDurationInFrames,
  fullTimeline,
} from '../config';
import {ensureFont, FONT} from '../font';
import {clamp01} from '../motion';
import {CrossingShot} from '../crossing/CrossingShot';
import {StillForest} from './shots/StillForest';
import {Gust} from './shots/Gust';
import {Headwind} from './shots/Headwind';
import {Burial} from './shots/Burial';
import {Crack} from './shots/Crack';
import {GrowthRings} from './shots/GrowthRings';

const shotById: Record<string, React.FC<{durationInFrames: number}>> = {
  'still-forest': StillForest,
  gust: Gust,
  crossing: ({durationInFrames}) => (
    <CrossingShot fade={false} />
  ),
  headwind: Headwind,
  burial: Burial,
  crack: Crack,
  'growth-rings': GrowthRings,
};

const Title: React.FC<{durationInFrames: number}> = () => {
  const frame = useCurrentFrame();
  // Title enters after the forest has established itself, and leaves before
  // the seed is lifted. Nothing else in the film is lettered.
  const appear = clamp01((frame - 36) / 26);
  const leave = clamp01((frame - 126) / 30);
  const opacity = appear * (1 - leave);
  const rise = (1 - appear) * 10 - leave * 6;

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '17.5%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity,
          transform: `translateY(${rise}px)`,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 300,
            fontSize: 66,
            lineHeight: 1.2,
            letterSpacing: '0.3em',
            paddingLeft: '0.3em',
            color: '#e7d3ad',
            textShadow: '0 0 26px rgba(255,177,105,0.18)',
          }}
        >
          一粒种子的远行
        </div>
        <div
          style={{
            marginTop: 18,
            width: 210,
            height: 1,
            background:
              'linear-gradient(90deg, rgba(231,211,173,0) 0%, rgba(231,211,173,0.45) 50%, rgba(231,211,173,0) 100%)',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => {
  useEffect(() => {
    void ensureFont();
  }, []);

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      {fullTimeline.map((shot) => {
        const Shot = shotById[shot.id];
        if (!Shot) return null;
        return (
          <Sequence
            key={shot.id}
            from={shot.from}
            durationInFrames={shot.durationInFrames}
            name={`${shot.id} — ${shot.title}`}
          >
            <Shot durationInFrames={shot.durationInFrames} />
            {shot.id === 'still-forest' ? (
              <Title durationInFrames={shot.durationInFrames} />
            ) : null}
          </Sequence>
        );
      })}
      <Audio src={staticFile(film.audioFile)} />
    </AbsoluteFill>
  );
};

export const filmMeta = {
  compositionId: film.compositionId,
  durationInFrames: fullDurationInFrames,
  width: filmSpec.width,
  height: filmSpec.height,
  fps: filmSpec.fps,
};
