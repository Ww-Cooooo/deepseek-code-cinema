import * as THREE from 'three';
import {clamp01, ease} from '../motion';

export const POD_POSITION = new THREE.Vector3(-1.45, 0.05, 0.55);
export const SEED_REST = new THREE.Vector3(-1.36, 0.33, 0.6);
export const CROSSING_START = new THREE.Vector3(-1.24, 0.38, 0.2);

const cameraPath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(2.4, 3.6, 10.2),
    new THREE.Vector3(1.4, 2.55, 7.4),
    new THREE.Vector3(0.6, 1.6, 4.6),
    new THREE.Vector3(0.2, 1.18, 3.2),
  ],
  false,
  'centripetal',
  0.5,
);

const targetPath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.4, 5.6, -38),
    new THREE.Vector3(0.05, 2.8, -12),
    new THREE.Vector3(-0.95, 0.85, 1.8),
    new THREE.Vector3(-1.35, 0.5, 0.55),
  ],
  false,
  'centripetal',
  0.5,
);

export function stillCameraAt(frame: number, durationInFrames: number) {
  const t = clamp01(frame / Math.max(1, durationInFrames - 1));
  const p = ease(clamp01((t - 0.02) / 0.98));
  const position = cameraPath.getPoint(p);
  const target = targetPath.getPoint(p);
  const breath = Math.sin(t * Math.PI * 2.1) * 0.012;
  position.x += breath;
  position.y += Math.sin(t * Math.PI * 3.4 + 0.6) * 0.008;
  return {
    position,
    target,
    fov: 52 - 12 * p,
    roll: Math.sin(t * Math.PI * 1.3) * 0.002,
  };
}

const gustSeedPath = new THREE.CatmullRomCurve3(
  [
    SEED_REST.clone(),
    new THREE.Vector3(-1.6, 0.52, 0.58),
    new THREE.Vector3(-1.76, 1.2, 0.52),
    new THREE.Vector3(-1.86, 1.78, 0.38),
    new THREE.Vector3(-1.6, 1.25, 0.3),
    new THREE.Vector3(-1.36, 0.66, 0.24),
    CROSSING_START.clone(),
  ],
  false,
  'centripetal',
  0.5,
);

export function gustSeedAt(p: number) {
  const t = clamp01(p);
  const travel = ease(clamp01((t - 0.18) / 0.82));
  const position = gustSeedPath.getPoint(travel);
  const tremble = t < 0.28 ? Math.sin(t * 90) * 0.003 : 0;
  position.x += tremble;
  return position;
}

export function gustSpinAt(p: number) {
  const t = clamp01(p);
  return {
    spin: 0.4 + t * 3.1 + Math.sin(t * Math.PI * 3.2) * 0.3,
    pitch: -0.25 + Math.sin(t * Math.PI * 4.2) * 0.2,
    bank: Math.sin(t * Math.PI * 3.4 + 0.3) * 0.32,
  };
}

export function gustOpenAt(p: number) {
  const t = clamp01(p);
  return clamp01((t - 0.08) / 0.34) * 1.0;
}

const gustCamA = new THREE.Vector3(0.2, 1.18, 3.2);
const gustCamB = new THREE.Vector3(0.62, 1.52, 4.15);

export function gustCameraAt(p: number) {
  const t = clamp01(p);
  const follow = ease(clamp01((t - 0.12) / 0.88));
  const seed = gustSeedAt(t);
  const position = gustCamA.clone().lerp(gustCamB, follow);
  position.x += Math.sin(t * Math.PI * 2.2) * 0.012;
  position.y += Math.sin(t * Math.PI * 3.7 + 0.4) * 0.008;
  return {
    position,
    target: seed.clone().add(new THREE.Vector3(0.06, 0.04, -0.48)),
    fov: 40 + 4 * follow,
    roll: Math.sin(t * Math.PI * 1.4) * 0.0025,
  };
}
