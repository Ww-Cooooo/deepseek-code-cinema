import React from 'react';
import {Composition} from 'remotion';
import {Film, FilmFrame} from './Film';
import {durationInFrames, film} from './config';

const GraphicsDemo: React.FC = () => <FilmFrame mode="graphics" />;
const WorldDemo: React.FC = () => <FilmFrame mode="world" />;

export const Root: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={durationInFrames}
      width={film.width}
      height={film.height}
      fps={film.fps}
    />
    <Composition
      id="GraphicsDemo"
      component={GraphicsDemo}
      durationInFrames={durationInFrames}
      width={film.width}
      height={film.height}
      fps={film.fps}
    />
    <Composition
      id="WorldDemo"
      component={WorldDemo}
      durationInFrames={durationInFrames}
      width={film.width}
      height={film.height}
      fps={film.fps}
    />
  </>
);
