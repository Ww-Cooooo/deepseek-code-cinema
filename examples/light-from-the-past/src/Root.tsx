import React from 'react';
import {Composition} from 'remotion';
import {FullFilm, ReviewFilm} from './Film';
import {durationInFrames, film, review, reviewDurationInFrames} from './config';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={FullFilm}
      durationInFrames={durationInFrames}
      width={film.width}
      height={film.height}
      fps={film.fps}
    />
    <Composition
      id={review.compositionId}
      component={ReviewFilm}
      durationInFrames={reviewDurationInFrames}
      width={film.width}
      height={film.height}
      fps={film.fps}
    />
  </>
);
