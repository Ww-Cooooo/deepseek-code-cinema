import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Bloom} from '../../crossing/Bloom';
import {Seed} from '../../crossing/Seed';
import {PetrifiedWorld} from '../../crossing/World';
import {CameraRig} from '../CameraRig';
import {FilmGrade} from '../FilmGrade';
import {SeedPod} from '../Pod';
import {SEED_REST, stillCameraAt} from '../opening';

export const StillForest: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const pose = stillCameraAt(frame, durationInFrames);
  const open = 0.055 + Math.sin((frame / durationInFrames) * Math.PI * 2) * 0.012;

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 52, near: 0.03, far: 800, position: [2.4, 3.6, 10.2]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.04;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig pose={pose} />
        <PetrifiedWorld seed={SEED_REST} />
        <SeedPod open={open} />
        <Seed
          position={SEED_REST}
          spin={0.6}
          pitch={-0.18}
          bank={0.08}
          glow={0.34}
          showWake={false}
          wingFlutter={0.04}
        />
        <Bloom />
      </ThreeCanvas>
      <FilmGrade
        durationInFrames={durationInFrames}
        fadeIn={18}
        vignette={0.62}
        topShade={0.28}
        bottomShade={0.46}
        grain={0.045}
      />
    </AbsoluteFill>
  );
};
