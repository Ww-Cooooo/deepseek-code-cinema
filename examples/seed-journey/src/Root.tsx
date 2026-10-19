import React from 'react';
import {Composition} from 'remotion';
import {CrossingPreview} from './CrossingPreview';
import {Film} from './film/Film';
import {
  film,
  filmSpec,
  fullDurationInFrames,
  preview,
  previewDurationInFrames,
} from './config';

export const Root: React.FC = () => (
  <>
    <Composition
      id={film.compositionId}
      component={Film}
      durationInFrames={fullDurationInFrames}
      width={filmSpec.width}
      height={filmSpec.height}
      fps={filmSpec.fps}
    />
    <Composition
      id={preview.compositionId}
      component={CrossingPreview}
      durationInFrames={previewDurationInFrames}
      width={filmSpec.width}
      height={filmSpec.height}
      fps={filmSpec.fps}
    />
  </>
);
