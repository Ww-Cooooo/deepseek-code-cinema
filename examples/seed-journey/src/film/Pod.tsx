import React, {useMemo} from 'react';
import * as THREE from 'three';
import {createBarkMaterial, taperedTube} from '../crossing/World';
import {getGlowTexture} from '../crossing/textures';

const HALF_SHELL = (() => {
  const geometry = new THREE.SphereGeometry(1, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  return geometry;
})();

/**
 * The fallen pod that carried the last seed. Two fibrous half-shells hinged at
 * the stem end; the top one lifts in the gust. Deliberately oversized (3 m)
 * against the centimetre-scale seed so the empty pod reads as a shelter.
 */
export const SeedPod: React.FC<{open?: number}> = ({open = 0}) => {
  const material = useMemo(() => {
    const base = createBarkMaterial();
    const mat = base.clone();
    mat.color = new THREE.Color('#5c523d');
    mat.roughness = 0.86;
    mat.bumpScale = 0.16;
    return mat;
  }, []);

  const inner = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6b5a3b',
        roughness: 0.92,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    [],
  );

  const ribs = useMemo(
    () =>
      [-0.62, -0.2, 0.22, 0.64].map((z) =>
        taperedTube(
          [
            new THREE.Vector3(-0.95, 0.12, z * 0.5),
            new THREE.Vector3(0, 0.26, z * 0.62),
            new THREE.Vector3(0.95, 0.12, z * 0.5),
          ],
          0.024,
          0.012,
          12,
          6,
        ),
      ),
    [],
  );

  const roots = useMemo(() => {
    const list: THREE.BufferGeometry[] = [];
    const angles = [-0.9, -0.45, 0.1, 0.55, 1.0, 2.2, 3.8];
    for (const angle of angles) {
      const reach = 0.55 + (Math.sin(angle * 2.1) + 1) * 0.5;
      list.push(
        taperedTube(
          [
            new THREE.Vector3(Math.cos(angle) * 0.4, 0.10, Math.sin(angle) * 0.22),
            new THREE.Vector3(Math.cos(angle) * reach, 0.02, Math.sin(angle) * reach * 0.7),
            new THREE.Vector3(Math.cos(angle) * (reach + 0.4), -0.14, Math.sin(angle) * (reach + 0.2)),
          ],
          0.05,
          0.012,
          12,
          6,
        ),
      );
    }
    return list;
  }, []);

  const glow = getGlowTexture();

  return (
    <group position={[-1.45, 0.05, 0.55]} rotation={[0.03, 0.5, -0.06]}>
      <mesh geometry={HALF_SHELL} material={material} scale={[1.08, 0.2, 0.34]} />
      <mesh
        geometry={HALF_SHELL}
        material={inner}
        scale={[1.0, 0.17, 0.3]}
        rotation={[Math.PI, 0, 0]}
        position={[0, 0.08, 0]}
      />

      <group position={[-1.02, 0.16, 0]}>
        <group rotation={[0, 0, open * 1.12]}>
          <mesh
            geometry={HALF_SHELL}
            material={material}
            scale={[1.08, 0.2, 0.34]}
            position={[1.02, 0, 0]}
            rotation={[0, 0, 0]}
          />
          <mesh
            geometry={HALF_SHELL}
            material={inner}
            scale={[1.0, 0.17, 0.3]}
            position={[1.02, -0.02, 0]}
            rotation={[Math.PI, 0, 0]}
          />
        </group>
      </group>

      {ribs.map((geometry, index) => (
        <mesh key={`pod-rib-${index}`} geometry={geometry} material={material} />
      ))}

      <mesh position={[0.02, 0.2, 0]}>
        <sphereGeometry args={[0.26, 20, 12]} />
        <meshBasicMaterial color="#2a1c0e" transparent opacity={0.55} />
      </mesh>

      <sprite position={[0.1, 0.3, 0]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial
          map={glow}
          color="#ff9f55"
          transparent
          opacity={0.08 + open * 0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>

      <pointLight
        color="#ff9c55"
        intensity={0.4 + open * 0.25}
        distance={2.4}
        decay={2}
        position={[0.1, 0.3, 0]}
      />

      {roots.map((geometry, index) => (
        <mesh key={`pod-root-${index}`} geometry={geometry} material={material} />
      ))}

      <mesh position={[-1.15, 0.2, 0.05]} rotation={[0.2, 0.1, 0.9]}>
        <cylinderGeometry args={[0.03, 0.05, 0.7, 8]} />
        <meshStandardMaterial color="#4b4231" roughness={0.95} />
      </mesh>
    </group>
  );
};
