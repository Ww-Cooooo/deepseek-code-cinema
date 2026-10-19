import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {clamp01} from '../motion';
import {getGrainDataUrl} from '../crossing/textures';

export type FilmGradeProps = {
  durationInFrames: number;
  vignette?: number;
  topShade?: number;
  bottomShade?: number;
  grain?: number;
  tint?: string;
  tintOpacity?: number;
  fadeIn?: number;
  fadeOut?: number;
  black?: number;
};

/** Shared photographic finish: vignette, soft top/bottom shade, grain and tint. */
export const FilmGrade: React.FC<FilmGradeProps> = ({
  durationInFrames,
  vignette = 0.55,
  topShade = 0.22,
  bottomShade = 0.36,
  grain = 0.04,
  tint = '#11201e',
  tintOpacity = 0.05,
  fadeIn = 0,
  fadeOut = 0,
  black = 0,
}) => {
  const frame = useCurrentFrame();
  const grainUrl = useMemo(() => getGrainDataUrl(), []);
  const x = (frame * 37) % 192;
  const y = (frame * 53) % 192;
  const inMul = fadeIn > 0 ? clamp01(frame / fadeIn) : 1;
  const outMul = fadeOut > 0 ? clamp01((durationInFrames - 1 - frame) / fadeOut) : 1;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 48%, rgba(4,12,12,0) ${100 - vignette * 55}%, rgba(1,5,6,${vignette * 0.7}) 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(180deg, rgba(0,7,9,${topShade}) 0%, rgba(0,0,0,0) 24%, rgba(0,0,0,0) 64%, rgba(0,4,5,${bottomShade}) 100%)`,
        }}
      />
      {tintOpacity > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: tint,
            opacity: tintOpacity,
            mixBlendMode: 'color',
          }}
        />
      ) : null}
      {grain > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: grain,
            mixBlendMode: 'overlay',
            backgroundImage: `url(${grainUrl})`,
            backgroundSize: '192px 192px',
            backgroundPosition: `${x}px ${y}px`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundColor: '#000',
          opacity: (1 - inMul) + (1 - outMul) + black,
        }}
      />
    </>
  );
};
