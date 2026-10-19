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
import {gustCameraAt, gustOpenAt, gustSeedAt, gustSpinAt} from '../opening';
import {WindStreaks} from '../WindStreaks';
import {clamp01, progress} from '../../motion';

export const Gust: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const pose = gustCameraAt(p);
  const seed = gustSeedAt(p);
  const spin = gustSpinAt(p);
  const open = gustOpenAt(p);
  const flutter = Math.sin(p * Math.PI * 11) * (0.18 + 0.22 * clamp01((p - 0.2) / 0.4));

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 40, near: 0.03, far: 800, position: [0.2, 1.18, 3.2]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig pose={pose} />
        <PetrifiedWorld seed={seed} />
        <SeedPod open={open} />
        <Seed
          position={seed}
          spin={spin.spin}
          pitch={spin.pitch}
          bank={spin.bank}
          glow={0.45}
          showWake={false}
          wingFlutter={flutter}
        />
        <WindStreaks durationInFrames={durationInFrames} />
        <Bloom />
      </ThreeCanvas>
      <FilmGrade
        durationInFrames={durationInFrames}
        vignette={0.58}
        topShade={0.26}
        bottomShade={0.42}
        grain={0.045}
      />
    </AbsoluteFill>
  );
};
