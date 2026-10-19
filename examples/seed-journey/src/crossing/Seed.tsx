import React, {useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {previewDurationInFrames} from '../config';
import {clamp01, progress} from '../motion';
import {seedPositionAt, seedSpinAt} from './choreography';
import {getGlowTexture, getSeedTexture} from './textures';

/**
 * One seed, readable as a seed rather than an ember:
 * a flattened hard shell with a visible seam, a paper samara wing with veins,
 * a bristle tuft at the tail, and only a small warm core. The wing is part of
 * the silhouette, so at distance the seed reads as a winged speck, not a dot.
 */
const WING_SHAPE = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.14, 0.1, 0.34, 0.155, 0.56, 0.07);
  shape.bezierCurveTo(0.48, 0.028, 0.37, 0.0, 0.25, -0.022);
  shape.bezierCurveTo(0.145, -0.044, 0.06, -0.05, 0, 0);
  return shape;
})();

type SceneryLineProps = {
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  children?: React.ReactNode;
};

// R3F's lowercase <line> host element collides with React's SVG <line> typings.
// Keep the host element while giving TypeScript the three.js props we use.
const SceneryLine: React.FC<SceneryLineProps> = (props) =>
  React.createElement('line' as any, props);

const Wake: React.FC<{p: number; seedHeight: number}> = ({p, seedHeight}) => {
  const fade = clamp01(1 - seedHeight / 3.8);
  const rings = [0, 1, 2].map((index) => {
    const age = (p * 0.7 + index / 3) % 1;
    const history = Math.max(0, p - age * 0.055);
    const position = seedPositionAt(history);
    const radius = 0.14 + age * 0.72;
    const opacity = Math.pow(1 - age, 2.1) * 0.06 * fade;
    return {position, radius, opacity};
  });

  return (
    <>
      {rings.map((ring, index) => (
        <mesh
          key={`wake-${index}`}
          position={[ring.position.x, 0.014, ring.position.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[ring.radius, ring.radius, 1]}
        >
          <ringGeometry args={[0.72, 1, 48]} />
          <meshBasicMaterial
            color="#ffb46c"
            transparent
            opacity={ring.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
};

export type SeedProps = {
  position?: THREE.Vector3;
  spin?: number;
  pitch?: number;
  bank?: number;
  scale?: number;
  glow?: number;
  wingFlutter?: number;
  showWake?: boolean;
  /** 0 = intact shell, 1 = hairline seam lit from inside. */
  crack?: number;
  /** Multiplier for the outer halo; keep low in macro shots. */
  halo?: number;
};

export const Seed: React.FC<SeedProps> = ({
  position,
  spin,
  pitch,
  bank,
  scale = 1,
  glow,
  wingFlutter,
  showWake = true,
  crack = 0,
  halo = 1,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, previewDurationInFrames);
  const autoPosition = seedPositionAt(p);
  const autoSpin = seedSpinAt(p);
  const at = position ?? autoPosition;
  const spinValue = spin ?? autoSpin.spin;
  const pitchValue = pitch ?? autoSpin.pitch;
  const bankValue = bank ?? autoSpin.bank;
  const heightGlow = clamp01(at.y / 5.2);
  const glowValue = clamp01(glow ?? 0.32 + heightGlow * 0.5);
  const flutter = wingFlutter ?? Math.sin(p * Math.PI * 6.4 + 0.7) * 0.2;
  const shell = getSeedTexture();
  const glowTexture = getGlowTexture();

  const bodyGeometry = useMemo(() => {
    // A lenticular samara body: thick at the germ, tapering to a blunt point.
    // The silhouette is deliberately asymmetric so it cannot read as a berry.
    const geometry = new THREE.SphereGeometry(1, 56, 36);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      const ax = Math.abs(x);
      const taper = 0.58 + 0.42 * Math.sqrt(Math.max(0, 1 - Math.pow(ax, 2.4) * 0.72));
      const point = Math.pow(Math.max(0, x), 2.6);
      position.setXYZ(
        i,
        x * 0.245 + point * 0.018,
        y * 0.112 * taper - point * 0.022,
        z * 0.066 * taper,
      );
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const wingGeometry = useMemo(() => {
    const geometry = new THREE.ShapeGeometry(WING_SHAPE, 40);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      // A dried paper wing is never a flat leaf: it curls along its length
      // and cups slightly across the chord.
      position.setZ(i, Math.sin(x * 6.2) * 0.018 - x * x * 0.1 + y * y * 0.22);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  const wingVeins = useMemo(() => {
    const pointSets = [
      [
        new THREE.Vector3(0.02, 0.002, 0),
        new THREE.Vector3(0.22, 0.064, 0),
        new THREE.Vector3(0.5, 0.06, 0),
      ],
      [
        new THREE.Vector3(0.02, 0.0, 0),
        new THREE.Vector3(0.24, 0.022, 0),
        new THREE.Vector3(0.47, 0.033, 0),
      ],
      [
        new THREE.Vector3(0.02, -0.002, 0),
        new THREE.Vector3(0.2, -0.012, 0),
        new THREE.Vector3(0.4, 0.012, 0),
      ],
    ];
    return pointSets.map((points) => {
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.BufferGeometry().setFromPoints(curve.getPoints(28));
    });
  }, []);

  const seamGeometries = useMemo(() => {
    return [1, -1].map((side) => {
      const points = [
        new THREE.Vector3(-0.215, -0.004, 0),
        new THREE.Vector3(-0.15, 0.02, 0.045 * side),
        new THREE.Vector3(0.0, 0.028, 0.058 * side),
        new THREE.Vector3(0.15, 0.018, 0.042 * side),
        new THREE.Vector3(0.215, -0.004, 0),
      ];
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, 40, 0.0027, 5, false);
    });
  }, []);

  const crackGeometries = useMemo(() => {
    return [1, -1].map((side) => {
      const points = [
        new THREE.Vector3(-0.12, 0.028, 0.061 * side),
        new THREE.Vector3(0.0, 0.035, 0.068 * side),
        new THREE.Vector3(0.13, 0.022, 0.06 * side),
      ];
      return new THREE.BufferGeometry().setFromPoints(
        new THREE.CatmullRomCurve3(points).getPoints(24),
      );
    });
  }, []);

  const bristleGeometries = useMemo(() => {
    const rand = (seed: number) => {
      let state = seed;
      return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
      };
    };
    const next = rand(4913);
    return Array.from({length: 7}, () => {
      const spread = (next() - 0.5) * 0.09;
      const lift = 0.015 + next() * 0.04;
      return new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.205, 0.0, spread * 0.35),
        new THREE.Vector3(-0.25, lift * 0.6, spread * 0.8),
        new THREE.Vector3(-0.3, lift, spread),
      ]);
    });
  }, []);

  return (
    <>
      <group position={at} scale={scale}>
        <pointLight color="#ff9c50" intensity={0.26 * (0.6 + glowValue * 0.4)} distance={1.05} decay={2} />
        <group rotation={[pitchValue, spinValue, bankValue]}>
          <mesh geometry={bodyGeometry}>
            <meshStandardMaterial
              map={shell}
              bumpMap={shell}
              bumpScale={0.018}
              color="#9a6438"
              emissive="#7a3410"
              emissiveIntensity={0.055 + glowValue * 0.035}
              roughness={0.64}
              metalness={0.015}
            />
          </mesh>

          {seamGeometries.map((geometry, index) => (
            <mesh key={`seam-${index}`} geometry={geometry}>
              <meshStandardMaterial
                color="#281408"
                roughness={0.9}
                metalness={0}
              />
            </mesh>
          ))}

          {crackGeometries.map((geometry, index) => (
            <SceneryLine key={`crack-${index}`} geometry={geometry}>
              <lineBasicMaterial
                color="#ffd6a0"
                transparent
                opacity={0.06 + crack * 0.8}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
              />
            </SceneryLine>
          ))}

          {bristleGeometries.map((geometry, index) => (
            <SceneryLine key={`bristle-${index}`} geometry={geometry}>
              <lineBasicMaterial color="#8e6a3c" transparent opacity={0.55} />
            </SceneryLine>
          ))}

          <group
            position={[0.075, -0.002, 0.0]}
            rotation={[-Math.PI / 2 + flutter + 0.18, 0.08, -0.2]}
          >
            <mesh geometry={wingGeometry}>
              <meshStandardMaterial
                map={shell}
                color="#cdbb95"
                emissive="#6f4318"
                emissiveIntensity={0.055}
                roughness={0.78}
                metalness={0.0}
                transparent
                opacity={0.66}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            {wingVeins.map((geometry, index) => (
              <SceneryLine key={`vein-${index}`} geometry={geometry} position={[0.03, 0, 0.003]}>
                <lineBasicMaterial color="#4a2c14" transparent opacity={0.62} />
              </SceneryLine>
            ))}
          </group>

          <sprite
            scale={[0.34 + glowValue * 0.22, 0.34 + glowValue * 0.22, 1]}
            position={[0.1, 0.015, 0]}
          >
            <spriteMaterial
              map={glowTexture}
              color="#ff8c3f"
              transparent
              opacity={(0.035 + glowValue * 0.055) * halo}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>

          <mesh position={[0.225, -0.012, 0.0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.012, 0.038, 8]} />
            <meshStandardMaterial color="#4b2a12" roughness={0.9} />
          </mesh>
        </group>
      </group>
      {showWake ? <Wake p={p} seedHeight={at.y} /> : null}
    </>
  );
};
