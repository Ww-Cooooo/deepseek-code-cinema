import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Bloom} from '../../crossing/Bloom';
import {Seed} from '../../crossing/Seed';
import {getGlowTexture, getShaftTexture} from '../../crossing/textures';
import {CameraRig} from '../CameraRig';
import {FilmGrade} from '../FilmGrade';
import {Sprout} from '../Sprout';
import {MudFloor, Silt} from '../underwater';
import {clamp01, ease, phase, progress} from '../../motion';

const dawnCamera = (p: number) => {
  const rise = ease(clamp01(p / 0.82));
  const position = new THREE.Vector3(0.62, 0.16, 2.25).lerp(
    new THREE.Vector3(0.46, 0.62, 2.18),
    rise,
  );
  const target = new THREE.Vector3(0, 0.1, 0.12).lerp(
    new THREE.Vector3(0.02, 0.44, 0.08),
    rise,
  );
  position.x += Math.sin(p * Math.PI * 2.2) * 0.004;
  position.y += Math.sin(p * Math.PI * 3.1 + 0.3) * 0.003;
  return {position, target, fov: 36 + 2 * rise, roll: -0.002 + Math.sin(p * 3.7) * 0.0015};
};

export const Crack: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const pose = dawnCamera(p);
  const crack = 0.16 + ease(phase(p, 0.1, 0.62)) * 0.84;
  const rootGrowth = ease(phase(p, 0.24, 0.82));
  const growth = ease(phase(p, 0.45, 0.96));
  const leafOpen = ease(phase(p, 0.62, 0.98));
  const glow = getGlowTexture();
  const shaft = getShaftTexture();
  const mist = useMemo(() => {
    let state = 9133;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return Array.from({length: 8}, () => ({
      x: -5.5 + rand() * 11,
      y: 0.2 + rand() * 1.8,
      z: -4 - rand() * 5,
      w: 2.5 + rand() * 4,
      h: 0.7 + rand() * 1.6,
      o: 0.05 + rand() * 0.07,
    }));
  }, []);

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 36, near: 0.015, far: 90, position: [0.62, 0.16, 2.25]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.06;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig pose={pose} />
        <color attach="background" args={['#061011']} />
        <fogExp2 attach="fog" args={['#0b1714', 0.052]} />
        <ambientLight intensity={0.32} color="#5c6e62" />
        <hemisphereLight args={['#8fa49a', '#17120c', 0.62]} />
        <directionalLight color="#ffd0a0" intensity={2.7} position={[-7, 2.4, -3.8]} />
        <directionalLight color="#87a99e" intensity={0.8} position={[3, 3.6, 2.4]} />
        <pointLight color="#9ed36a" intensity={0.2 + growth * 0.9} distance={2.2} decay={2} position={[0.05, 0.35, 0.25]} />

        <MudFloor y={-0.12} radius={6.5} color="#4f4332" rough={0.82} />
        <mesh position={[0, -0.085, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.8, 72]} />
          <meshPhysicalMaterial
            color="#10221c"
            roughness={0.16}
            metalness={0.25}
            clearcoat={0.7}
            clearcoatRoughness={0.2}
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
        <Silt count={150} center={[0, 0.3, 0.2]} range={[3.2, 1.8, 3.2]} size={0.016} color="#d9c39a" opacity={0.4} />

        {mist.map((puff, index) => (
          <sprite key={`dawn-mist-${index}`} position={[puff.x, puff.y, puff.z]} scale={[puff.w, puff.h, 1]} renderOrder={2}>
            <spriteMaterial
              map={glow}
              color={index % 3 === 0 ? '#d9a976' : '#78928a'}
              transparent
              opacity={puff.o}
              depthWrite={false}
              fog
            />
          </sprite>
        ))}
        <mesh position={[-2.6, 1.5, -2.8]} rotation={[0, 0.12, 0.26]} renderOrder={1}>
          <planeGeometry args={[1.6, 5.4]} />
          <meshBasicMaterial
            map={shaft}
            color="#ffc085"
            transparent
            opacity={0.14}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </mesh>
        <sprite position={[-5.5, 1.15, -5.5]} scale={[9, 5, 1]} renderOrder={1}>
          <spriteMaterial
            map={glow}
            color="#e8a268"
            transparent
            opacity={0.18}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </sprite>

        <group position={[0, 0.0, 0.22]} rotation={[0, 0.22, 0]}>
          <Seed
            position={new THREE.Vector3(0, 0, 0)}
            spin={0.42}
            pitch={-0.42}
            bank={0.16}
            scale={1.05}
            glow={0.48 + crack * 0.22}
            halo={1.1}
            crack={crack}
            showWake={false}
            wingFlutter={0.08 + Math.sin(p * 6.2) * 0.05}
          />
          <group position={[0.03, 0.05, -0.02]}>
            <Sprout growth={growth} rootGrowth={rootGrowth} leafOpen={leafOpen} />
          </group>
        </group>
        <pointLight color="#ffb469" intensity={0.25 + crack * 0.45} distance={1.6} decay={2} position={[0, 0.06, 0.12]} />
        <Bloom />
      </ThreeCanvas>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 22% 44%, rgba(255,178,112,0.1), rgba(0,0,0,0) 48%)',
          mixBlendMode: 'screen',
          opacity: 0.5 + growth * 0.3,
        }}
      />
      <FilmGrade
        durationInFrames={durationInFrames}
        fadeIn={10}
        vignette={0.64}
        topShade={0.32}
        bottomShade={0.4}
        grain={0.045}
        tint="#1b2418"
        tintOpacity={0.05}
      />
    </AbsoluteFill>
  );
};
