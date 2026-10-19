import React, {useMemo} from 'react';
import * as THREE from 'three';
import {taperedTube} from '../crossing/World';
import {clamp01, ease} from '../motion';

const leafShape = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.13, 0.06, 0.24, 0.16, 0.37, 0.24);
  shape.bezierCurveTo(0.24, 0.3, 0.1, 0.22, 0, 0);
  return shape;
})();

const Leaf: React.FC<{at: number; side: number; open: number; scale: number}> = ({at, side, open, scale}) => (
  <group position={[0, at, 0]} rotation={[0.2, 0, side * (0.2 + open * 0.95)]} scale={[scale, scale, scale]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={[open, open, 1]}>
      <shapeGeometry args={[leafShape, 18]} />
      <meshStandardMaterial
        color={side > 0 ? '#9dcc6a' : '#7fb452'}
        emissive="#34521a"
        emissiveIntensity={0.5}
        roughness={0.58}
        side={THREE.DoubleSide}
      />
    </mesh>
  </group>
);

/**
 * The first sprout: root hairs into the silt, a bent stem, two leaves.
 * Growth is a pure function of the passed values, so every frame is stable.
 */
export const Sprout: React.FC<{growth: number; rootGrowth: number; leafOpen: number}> = ({
  growth,
  rootGrowth,
  leafOpen,
}) => {
  const g = clamp01(growth);
  const r = clamp01(rootGrowth);
  const open = clamp01(leafOpen);

  const stem = useMemo(() => {
    const h = 0.04 + g * 0.94;
    return taperedTube(
      [
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0.03 * g, h * 0.34, -0.025 * g),
        new THREE.Vector3(0.09 * g, h * 0.68, -0.01 * g),
        new THREE.Vector3(0.075 * g, h, 0.02 * g),
      ],
      0.022,
      0.005,
      16,
      7,
    );
  }, [g]);

  const roots = useMemo(() => {
    if (r <= 0.01) return [];
    return [0.2, 1.3, 2.5, 3.7, 5.1].map((angle, index) => {
      const reach = (0.16 + (index % 3) * 0.08) * ease(r);
      return taperedTube(
        [
          new THREE.Vector3(0, 0.01, 0),
          new THREE.Vector3(Math.cos(angle) * reach * 0.55, -0.06 * r, Math.sin(angle) * reach * 0.55),
          new THREE.Vector3(Math.cos(angle) * reach, -0.22 * r, Math.sin(angle) * reach),
        ],
        0.012,
        0.002,
        8,
        5,
      );
    });
  }, [r]);

  const leafScale = 0.65 + g * 0.55;

  return (
    <group>
      <mesh geometry={stem}>
        <meshStandardMaterial color="#8dbb5f" emissive="#315014" emissiveIntensity={0.45} roughness={0.6} />
      </mesh>
      {roots.map((geometry, index) => (
        <mesh key={`root-${index}`} geometry={geometry}>
          <meshStandardMaterial color="#6c5531" roughness={0.9} />
        </mesh>
      ))}
      {g > 0.32 ? <Leaf at={0.42 * g + 0.04} side={1} open={clamp01((open - 0.15) / 0.85)} scale={leafScale} /> : null}
      {g > 0.52 ? <Leaf at={0.66 * g + 0.04} side={-1} open={clamp01((open - 0.35) / 0.65)} scale={leafScale * 0.92} /> : null}
      {g > 0.75 ? <Leaf at={0.9 * g} side={1} open={clamp01((open - 0.55) / 0.45)} scale={0.42} /> : null}
      {g > 0.84 ? (
        <pointLight color="#b7df79" intensity={0.35 * open} distance={1.2} decay={2} position={[0.08, 0.9 * g, 0]} />
      ) : null}
    </group>
  );
};
