import React, {useEffect} from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {preview} from './config';
import {CrossingShot} from './crossing/CrossingShot';
import {ensureFont} from './font';

export const CrossingPreview: React.FC = () => {
  useEffect(() => {
    void ensureFont();
  }, []);

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <CrossingShot />
      <Audio src={staticFile(preview.audioFile)} />
    </AbsoluteFill>
  );
};
