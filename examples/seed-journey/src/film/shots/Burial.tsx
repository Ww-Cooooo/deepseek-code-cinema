import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Bloom} from '../../crossing/Bloom';
import {Seed} from '../../crossing/Seed';
import {CameraRig} from '../CameraRig';
import {FilmGrade} from '../FilmGrade';
import {progress} from '../../motion';
import {Bubbles, Caustics, MudFloor, Silt, UnderwaterLight} from '../underwater';
import {
  BURIAL_MUD_Y,
  burialCameraAt,
  burialCrackAt,
  burialSeedAt,
  burialSpinAt,
} from '../burial';

export const Burial: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const pose = burialCameraAt(p);
  const seed = burialSeedAt(p);
  const spin = burialSpinAt(p);
  const crack = burialCrackAt(p);

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 42, near: 0.02, far: 120, position: [0.78, 0.52, -73.8]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig pose={pose} />
        <color attach="background" args={['#020b0c']} />
        <fogExp2 attach="fog" args={['#041214', 0.075]} />
        <UnderwaterLight strength={0.82} warm={0.18} />
        <MudFloor y={BURIAL_MUD_Y} radius={11} color="#3e3528" />
        <Caustics y={BURIAL_MUD_Y + 0.015} strength={0.05} />
        <Silt count={240} center={[0, -0.75, -75.7]} range={[3.6, 2.8, 3.6]} size={0.022} opacity={0.3} />
        <Bubbles p={p} origin={seed} active={0.58} />
        <group rotation={[0, 0.4, 0]}>
          <mesh position={[seed.x, -0.4, seed.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[5.5, 5.5]} />
            <meshBasicMaterial color="#071416" transparent opacity={0.22} depthWrite={false} />
          </mesh>
        </group>
        <Seed
          position={seed}
          spin={spin.spin}
          pitch={spin.pitch}
          bank={spin.bank}
          scale={1.45}
          glow={0.4}
          halo={1.25}
          crack={crack}
          showWake={false}
          wingFlutter={Math.sin(p * Math.PI * 9) * 0.18 * (1 - p)}
        />
        <Bloom />
      </ThreeCanvas>
      <FilmGrade
        durationInFrames={durationInFrames}
        fadeIn={10}
        vignette={0.7}
        topShade={0.36}
        bottomShade={0.52}
        grain={0.05}
        tint="#0a1e1f"
        tintOpacity={0.1}
      />
    </AbsoluteFill>
  );
};
