import React, {useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {previewDurationInFrames} from '../config';
import {clamp01, progress} from '../motion';
import {cameraPoseAt} from './choreography';
import {PetrifiedWorld} from './World';
import {Seed} from './Seed';
import {Bloom} from './Bloom';
import {getGrainDataUrl} from './textures';

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    const pose = cameraPoseAt(frame, previewDurationInFrames);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.rotateZ(pose.roll);
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = pose.fov;
    perspective.near = 0.04;
    perspective.far = 650;
    perspective.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [camera, frame]);

  return null;
};

const Grade: React.FC<{fade?: boolean}> = ({fade = true}) => {
  const frame = useCurrentFrame();
  const grain = useMemo(() => getGrainDataUrl(), []);
  const fadeIn = fade ? clamp01(frame / 8) : 1;
  const x = (frame * 37) % 192;
  const y = (frame * 53) % 192;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 50% 48%, rgba(6,14,14,0) 40%, rgba(2,7,8,0.22) 72%, rgba(0,3,4,0.62) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(180deg, rgba(0,8,10,0.22) 0%, rgba(0,0,0,0) 23%, rgba(0,0,0,0) 64%, rgba(0,5,6,0.38) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.042,
          mixBlendMode: 'overlay',
          backgroundImage: `url(${grain})`,
          backgroundSize: '192px 192px',
          backgroundPosition: `${x}px ${y}px`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'rgba(17, 31, 29, 0.06)',
          mixBlendMode: 'color',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundColor: '#000',
          opacity: 1 - fadeIn,
        }}
      />
    </>
  );
};

export const CrossingShot: React.FC<{fade?: boolean}> = ({
  fade = true,
}) => {
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 40, near: 0.04, far: 650, position: [-1.72, 0.5, 4.7]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.06;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig />
        <PetrifiedWorld />
        <Seed />
        <Bloom />
      </ThreeCanvas>
      <Grade fade={fade} />
    </AbsoluteFill>
  );
};
