import * as THREE from 'three';
import {clamp01, ease} from '../motion';

/** The seed enters the frame just under the surface and is taken by the silt. */
export const BURIAL_MUD_Y = -1.62;
export const BURIAL_SEED_START = new THREE.Vector3(0.35, 0.12, -75.0);

const path = new THREE.CatmullRomCurve3(
  [
    BURIAL_SEED_START.clone(),
    new THREE.Vector3(0.3, -0.24, -75.2),
    new THREE.Vector3(0.12, -0.78, -75.55),
    new THREE.Vector3(-0.08, -1.28, -75.9),
    new THREE.Vector3(-0.14, -1.48, -76.05),
  ],
  false,
  'centripetal',
  0.5,
);

export function burialSeedAt(p: number) {
  const t = clamp01(p);
  const fall = ease(clamp01(t / 0.72));
  const point = path.getPoint(fall);
  const drift = 1 - clamp01((t - 0.55) / 0.35);
  point.x += Math.sin(t * Math.PI * 3.2 + 0.6) * 0.08 * drift;
  point.z += Math.cos(t * Math.PI * 2.6) * 0.035 * drift;
  if (t > 0.72) {
    const settle = clamp01((t - 0.72) / 0.28);
    point.y = -1.48 - 0.05 * ease(settle);
  }
  return point;
}

export function burialCameraAt(p: number) {
  const t = clamp01(p);
  const descend = ease(clamp01((t - 0.02) / 0.74));
  const position = new THREE.Vector3(0.78, 0.52, -73.8).lerp(
    new THREE.Vector3(0.62, -0.92, -74.55),
    descend,
  );
  const seed = burialSeedAt(t);
  const target = seed.clone().add(new THREE.Vector3(-0.05, 0.02, -0.42));
  if (t > 0.72) {
    const still = clamp01((t - 0.72) / 0.28);
    target.y = THREE.MathUtils.lerp(target.y, -1.42, still);
  }
  const breath = 0.006 + 0.013 * (1 - descend);
  position.x += Math.sin(t * 27 + 0.4) * breath;
  position.y += Math.sin(t * 41 + 1.1) * breath * 0.6;
  return {
    position,
    target,
    fov: 42 - 8 * descend,
    roll: Math.sin(t * 7.2) * 0.003 * (1 - descend),
  };
}

export function burialSpinAt(p: number) {
  const t = clamp01(p);
  const rest = ease(clamp01((t - 0.56) / 0.3));
  const tumble = 1 - rest;
  return {
    spin: 0.8 + Math.sin(t * 5.4) * 0.7 * tumble + rest * 0.1,
    pitch: -0.32 - Math.cos(t * 7.1) * 0.45 * tumble + rest * 0.6,
    bank: Math.sin(t * 4.8 + 0.3) * 0.42 * tumble + rest * 0.2,
  };
}

export function burialCrackAt(p: number) {
  return 0.04 + ease(clamp01((clamp01(p) - 0.86) / 0.14)) * 0.16;
}
