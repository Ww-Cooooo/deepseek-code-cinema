import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {film, type RenderMode} from './config';
import {ensureFont} from './font';
import {GraphicsSample} from './GraphicsSample';
import {WorldSample} from './WorldSample';

export type FilmFrameProps = {mode: RenderMode};

export const FilmFrame: React.FC<FilmFrameProps> = ({mode}) => {
  useEffect(() => {
    void ensureFont();
  }, []);

  return (
    <AbsoluteFill style={{background: '#d6d9dd', overflow: 'hidden'}}>
      {mode === 'world' ? <WorldSample /> : <GraphicsSample />}
      {film.audioFile ? <Audio src={staticFile(film.audioFile)} /> : null}
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => <FilmFrame mode={film.renderMode} />;
