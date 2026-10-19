import React, {useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {Bloom} from '../../crossing/Bloom';
import {Seed} from '../../crossing/Seed';
import {PetrifiedWorld} from '../../crossing/World';
import {getGlowTexture} from '../../crossing/textures';
import {CameraRig} from '../CameraRig';
import {FilmGrade} from '../FilmGrade';
import {WindStreaks} from '../WindStreaks';
import {clamp01, progress} from '../../motion';
import {
  stormCameraAt,
  stormEnvelope,
  stormSeedAt,
  stormSpinAt,
  WAVE_IMPACT,
  waveTransformAt,
} from '../storm';

const Rain: React.FC<{durationInFrames: number; origin: THREE.Vector3}> = ({
  durationInFrames,
  origin,
}) => {
  const frame = useCurrentFrame();
  const count = 300;
  const drops = useMemo(() => {
    let state = 71233;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return Array.from({length: count}, () => ({
      x: -19 + rand() * 38,
      z: -17 + rand() * 34,
      offset: rand() * 20,
      speed: 15 + rand() * 15,
      len: 0.55 + rand() * 0.85,
    }));
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    return geo;
  }, []);

  useLayoutEffect(() => {
    const t = frame / 30;
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      const fall = (d.offset + t * d.speed) % 20;
      const y = 19 - fall;
      const x = d.x - fall * 0.22;
      const z = d.z + fall * 0.045;
      attr.setXYZ(i * 2, x, y, z);
      attr.setXYZ(i * 2 + 1, x + d.len * 0.24, y + d.len, z + d.len * 0.05);
    }
    attr.needsUpdate = true;
  }, [drops, frame, geometry]);

  return (
    <group position={[origin.x, 0, origin.z - 12]}>
      <lineSegments geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#a7c8c1"
          transparent
          opacity={0.26}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
};

const waveGeometry = (() => {
  const geo = new THREE.PlaneGeometry(36, 12, 64, 20);
  const position = geo.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const lift = Math.max(0, (y + 6) / 12);
    const z =
      Math.sin(x * 0.52 + 0.4) * 0.62 +
      Math.sin(x * 1.17 - 1.2) * 0.22 +
      Math.pow(lift, 2.1) * 3.1;
    position.setZ(i, z);
  }
  position.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
})();

const foamGeometry = (() => {
  const positions: number[] = [];
  let state = 88213;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = 0; i < 110; i++) {
    const x = -17 + rand() * 34;
    const top = 5.8 + rand() * 0.5;
    const z = Math.sin(x * 0.52 + 0.4) * 0.62 + Math.pow((top + 6) / 12, 2.1) * 3.1;
    positions.push(x, top, z + 0.02);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
})();

const WaveWall: React.FC<{p: number}> = ({p}) => {
  const wave = waveTransformAt(p);
  const foam = getGlowTexture();
  return (
    <group position={[wave.x, wave.y, wave.z]} scale={[1, wave.scaleY, 1]}>
      <mesh geometry={waveGeometry}>
        <meshStandardMaterial
          color="#0a3033"
          emissive="#143c3b"
          emissiveIntensity={0.35}
          roughness={0.25}
          metalness={0.12}
          transparent
          opacity={wave.opacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <points geometry={foamGeometry}>
        <pointsMaterial
          map={foam}
          color="#c8e0d8"
          size={0.5}
          sizeAttenuation
          transparent
          opacity={0.65 * wave.opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          alphaTest={0.02}
        />
      </points>
    </group>
  );
};

const Clouds: React.FC = () => {
  const glow = getGlowTexture();
  const puffs = useMemo(() => {
    let state = 53119;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return Array.from({length: 12}, () => ({
      x: -90 + rand() * 180,
      y: 17 + rand() * 24,
      z: -55 - rand() * 80,
      w: 70 + rand() * 100,
      h: 18 + rand() * 30,
      o: 0.24 + rand() * 0.28,
    }));
  }, []);
  return (
    <>
      {puffs.map((puff, index) => (
        <sprite
          key={`cloud-${index}`}
          position={[puff.x, puff.y, puff.z]}
          scale={[puff.w, puff.h, 1]}
          renderOrder={2}
        >
          <spriteMaterial
            map={glow}
            color={index % 3 === 0 ? '#35474a' : '#1b3033'}
            transparent
            opacity={puff.o}
            depthWrite={false}
            fog
          />
        </sprite>
      ))}
    </>
  );
};

const SplashRings: React.FC<{p: number}> = ({p}) => {
  if (p < 0.6) return null;
  const t = clamp01((p - 0.6) / 0.4);
  return (
    <>
      {[0, 0.22, 0.46].map((delay, index) => {
        const age = clamp01((t - delay) / (1 - delay));
        if (age <= 0) return null;
        const radius = 0.3 + age * 3.6;
        return (
          <mesh
            key={`splash-${index}`}
            position={[0.2, 0.03, -74.8]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[radius, radius, 1]}
          >
            <ringGeometry args={[0.78, 1, 64]} />
            <meshBasicMaterial
              color="#9fc0b4"
              transparent
              opacity={(1 - age) * (1 - age) * 0.28}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </>
  );
};

export const Headwind: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const pose = stormCameraAt(p);
  const seed = stormSeedAt(p);
  const spin = stormSpinAt(p);
  const env = stormEnvelope(p);
  const afterImpact = p > WAVE_IMPACT;
  const surfaceGlow = afterImpact
    ? clamp01((p - WAVE_IMPACT) / 0.12) * (1 - clamp01((p - 0.86) / 0.14) * 0.75)
    : 0;

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 35, near: 0.03, far: 800, position: [2.5, 5.2, -42.5]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02 - env.dark * 0.12;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig pose={pose} />
        <PetrifiedWorld seed={seed} storm={0.9} />
        <Clouds />
        <Rain durationInFrames={durationInFrames} origin={pose.position} />
        <WaveWall p={p} />
        <SplashRings p={p} />
        <group position={[-1, 1.5, -58]}>
          <WindStreaks durationInFrames={durationInFrames} strength={1.7} />
        </group>
        <Seed
          position={new THREE.Vector3(seed.x, Math.max(0.22, seed.y), seed.z)}
          spin={spin.spin}
          pitch={spin.pitch}
          bank={spin.bank}
          scale={1.15}
          glow={0.58}
          halo={1.35}
          showWake={false}
          wingFlutter={Math.sin(p * Math.PI * 17) * 0.42}
        />
        {surfaceGlow > 0 ? (
          <sprite position={[0.2, 0.16, -74.8]} scale={[1.6, 1.6, 1]}>
            <spriteMaterial
              map={getGlowTexture()}
              color="#ff9a4e"
              transparent
              opacity={0.42 * surfaceGlow}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        ) : null}
        <Bloom />
      </ThreeCanvas>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'rgba(186, 216, 210, 1)',
          opacity: env.flash * 0.16,
          mixBlendMode: 'screen',
        }}
      />
      <FilmGrade
        durationInFrames={durationInFrames}
        vignette={0.68}
        topShade={0.34}
        bottomShade={0.5}
        grain={0.055}
        tint="#0a1b1d"
        tintOpacity={0.12}
        black={env.dark * 0.08}
      />
    </AbsoluteFill>
  );
};
