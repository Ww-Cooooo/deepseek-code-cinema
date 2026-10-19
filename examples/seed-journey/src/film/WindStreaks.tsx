import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {clamp01, progress} from '../motion';

/** Torn husk fibres and salt dust crossing the close view in the gust. */
export const WindStreaks: React.FC<{durationInFrames: number; strength?: number}> = ({
  durationInFrames,
  strength = 1,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, durationInFrames);
  const count = 34;

  const seeds = useMemo(() => {
    let state = 90211;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return Array.from({length: count}, () => ({
      x: -2.8 + rand() * 5.2,
      y: 0.25 + rand() * 2.5,
      z: -1.6 + rand() * 5.2,
      speed: 0.55 + rand() * 0.9,
      len: 0.35 + rand() * 0.9,
      phase: rand(),
      brightness: 0.25 + rand() * 0.6,
    }));
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 6), 3));
    return geo;
  }, []);

  useLayoutEffect(() => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const travel = (p * s.speed * 3.4 + s.phase) % 1;
      const x = s.x + travel * 2.2;
      const y = s.y + Math.sin((p + s.phase) * Math.PI * 2) * 0.08;
      const z = s.z - travel * 1.4;
      attr.setXYZ(i * 2, x, y, z);
      attr.setXYZ(i * 2 + 1, x - s.len, y + 0.03, z - s.len * 0.32);
    }
    attr.needsUpdate = true;
  }, [geometry, p, seeds]);

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color="#e6c79a"
        transparent
        opacity={0.16 * clamp01(strength)}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
};
