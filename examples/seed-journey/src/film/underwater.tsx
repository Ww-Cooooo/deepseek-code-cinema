import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {getDiscTexture, getGlowTexture, getMudTexture, getShaftTexture} from '../crossing/textures';

const lcg = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

/** Wet silt floor seen from just above it. Radius small: fog owns the edge. */
export const MudFloor: React.FC<{
  y: number;
  radius?: number;
  color?: string;
  rough?: number;
}> = ({y, radius = 9, color = '#4c4030', rough = 0.9}) => {
  const map = getMudTexture();
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[radius, 96]} />
        <meshStandardMaterial
          map={map}
          bumpMap={map}
          bumpScale={0.035}
          color={color}
          roughness={rough}
          metalness={0.03}
        />
      </mesh>
      <Stones />
    </group>
  );
};

const Stones: React.FC = () => {
  const stones = useMemo(() => {
    const rand = lcg(44117);
    return Array.from({length: 18}, () => {
      const angle = rand() * Math.PI * 2;
      const distance = 0.55 + rand() * 5.2;
      return {
        position: [
          Math.cos(angle) * distance,
          0.015 + rand() * 0.03,
          Math.sin(angle) * distance,
        ] as [number, number, number],
        scale: [0.07 + rand() * 0.26, 0.025 + rand() * 0.07, 0.06 + rand() * 0.2] as [
          number,
          number,
          number,
        ],
        rotation: [rand() * 0.6, rand() * Math.PI, rand() * 0.5] as [number, number, number],
      };
    });
  }, []);

  return (
    <>
      {stones.map((stone, index) => (
        <mesh key={`stone-${index}`} position={stone.position} scale={stone.scale} rotation={stone.rotation}>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color="#24261f" roughness={0.82} metalness={0.05} />
        </mesh>
      ))}
    </>
  );
};

/** A faint, moving caustic net on the mud. Small additive rings, no post FX. */
export const Caustics: React.FC<{y: number; strength?: number}> = ({y, strength = 0.055}) => {
  const frame = useCurrentFrame();
  const glow = getGlowTexture();
  const rings = useMemo(() => {
    const rand = lcg(90121);
    return Array.from({length: 7}, () => ({
      x: -1.8 + rand() * 3.6,
      z: -1.6 + rand() * 3.2,
      scale: 0.8 + rand() * 2.4,
      phase: rand() * Math.PI * 2,
      rate: 0.18 + rand() * 0.12,
    }));
  }, []);
  const t = frame / 30;

  return (
    <>
      {rings.map((ring, index) => (
        <sprite
          key={`caustic-${index}`}
          position={[ring.x + Math.sin(t * 0.21 + ring.phase) * 0.14, y + 0.012, ring.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[ring.scale, ring.scale * 0.55, 1]}
        >
          <spriteMaterial
            map={glow}
            color={index % 2 === 0 ? '#9fc6ad' : '#d3a875'}
            transparent
            opacity={strength * (0.75 + 0.25 * Math.sin(t * ring.rate * 6 + ring.phase))}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
      ))}
    </>
  );
};

/** Suspended silt: tiny, slow, deterministic. */
export const Silt: React.FC<{
  count?: number;
  range?: [number, number, number];
  center?: [number, number, number];
  size?: number;
  color?: string;
  opacity?: number;
}> = ({count = 260, range = [7, 4, 7], center = [0, -0.5, 0], size = 0.035, color = '#c7b58f', opacity = 0.34}) => {
  const frame = useCurrentFrame();
  const disc = getDiscTexture();
  const base = useMemo(() => {
    const rand = lcg(73129);
    return Array.from({length: count}, () => ({
      x: (rand() - 0.5) * range[0],
      y: (rand() - 0.5) * range[1],
      z: (rand() - 0.5) * range[2],
      phase: rand() * Math.PI * 2,
      sway: 0.02 + rand() * 0.1,
    }));
  }, [count, range]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, [count]);

  useLayoutEffect(() => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const t = frame / 30;
    for (let i = 0; i < base.length; i++) {
      const p = base[i];
      attr.setXYZ(
        i,
        center[0] + p.x + Math.sin(t * 0.17 + p.phase) * p.sway,
        center[1] + p.y + Math.sin(t * 0.11 + p.phase * 1.7) * p.sway * 0.7,
        center[2] + p.z + Math.cos(t * 0.13 + p.phase) * p.sway,
      );
    }
    attr.needsUpdate = true;
  }, [base, center, frame, geometry]);

  return (
    <points geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={disc}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        alphaTest={0.01}
      />
    </points>
  );
};

/** Bubbles lifting off the seed after it hits the silt. */
export const Bubbles: React.FC<{p: number; origin: THREE.Vector3; active?: number}> = ({p, origin, active = 0.32}) => {
  const disc = getDiscTexture();
  const bubbles = useMemo(() => {
    const rand = lcg(55601);
    return Array.from({length: 18}, () => ({
      offset: rand(),
      x: (rand() - 0.5) * 0.35,
      z: (rand() - 0.5) * 0.35,
      size: 0.012 + rand() * 0.028,
      speed: 0.25 + rand() * 0.35,
    }));
  }, []);

  if (p < active) return null;
  const t = (p - active) / Math.max(0.001, 1 - active);

  return (
    <>
      {bubbles.map((bubble, index) => {
        const age = (t * bubble.speed * 1.6 + bubble.offset) % 1;
        return (
          <sprite
            key={`bubble-${index}`}
            position={[
              origin.x + bubble.x + Math.sin(age * 7 + index) * 0.03,
              origin.y + 0.05 + age * 0.9,
              origin.z + bubble.z,
            ]}
            scale={[bubble.size, bubble.size, 1]}
          >
            <spriteMaterial
              map={disc}
              color="#cfe4d8"
              transparent
              opacity={Math.sin(age * Math.PI) * 0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        );
      })}
    </>
  );
};

/** Shafts of surface light and a soft ceiling glow, used under water. */
export const UnderwaterLight: React.FC<{strength?: number; warm?: number}> = ({strength = 1, warm = 0.35}) => {
  const shaft = getShaftTexture();
  const glow = getGlowTexture();
  const shafts = [
    {x: -1.0, z: -0.7, w: 0.75, h: 4.2, rot: 0.2, o: 0.11},
    {x: 0.4, z: -1.1, w: 0.5, h: 4.6, rot: -0.12, o: 0.075},
    {x: 1.4, z: -0.5, w: 0.9, h: 3.6, rot: 0.1, o: 0.06},
  ];
  return (
    <>
      <ambientLight intensity={0.22 * strength} color="#4c6b68" />
      <hemisphereLight args={['#789892', '#120f0a', 0.5 * strength]} />
      <directionalLight color="#f4c08a" intensity={1.1 * strength} position={[-2.4, 4.5, -2.2]} />
      <directionalLight color="#4f7d7a" intensity={0.55 * strength} position={[2.2, 1.4, 2.6]} />
      <spotLight
        color="#ffc38c"
        intensity={2.2 * strength}
        position={[0.2, 4.2, 0.6]}
        angle={0.5}
        penumbra={1}
        distance={14}
        decay={1.4}
      />
      {shafts.map((beam, index) => (
        <mesh key={`uw-shaft-${index}`} position={[beam.x, 1.35, beam.z]} rotation={[0, 0, beam.rot]} renderOrder={2}>
          <planeGeometry args={[beam.w, beam.h]} />
          <meshBasicMaterial
            map={shaft}
            color="#e9bd8c"
            transparent
            opacity={beam.o * strength}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
      <sprite position={[0, 3.7, -1.6]} scale={[7.5, 3.2, 1]}>
        <spriteMaterial
          map={glow}
          color={`rgb(${180 + warm * 50}, ${150 + warm * 40}, ${110 + warm * 20})`}
          transparent
          opacity={0.1 * strength}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </sprite>
    </>
  );
};
