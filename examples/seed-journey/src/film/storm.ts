import * as THREE from 'three';
import {clamp01, ease} from '../motion';

// The seed leaves the gate at the exact world point where shot 3 ends.
export const STORM_SEED_START = new THREE.Vector3(0.08, 5.15, -50.5);

const seedPath = new THREE.CatmullRomCurve3(
  [
    STORM_SEED_START.clone(),
    new THREE.Vector3(-0.9, 5.75, -55.0),
    new THREE.Vector3(-2.45, 5.1, -60.0),
    new THREE.Vector3(-2.95, 4.45, -64.5),
    new THREE.Vector3(-2.1, 3.5, -68.4),
    new THREE.Vector3(-1.35, 2.35, -71.8),
    new THREE.Vector3(-0.2, 0.95, -74.2),
    new THREE.Vector3(0.35, 0.2, -75.0),
  ],
  false,
  'centripetal',
  0.5,
);

export const WAVE_IMPACT = 0.62;

export function stormSeedAt(p: number) {
  const t = clamp01(p);
  const flight = ease(clamp01(t / 0.66));
  const point = seedPath.getPoint(flight);
  if (t > 0.58) {
    const fall = clamp01((t - 0.58) / 0.42);
    point.y -= 0.38 * fall * fall;
    point.x += Math.sin(fall * Math.PI * 2.4) * 0.18 * fall;
  }
  const shudder = t < 0.58 ? Math.sin(t * 92) * 0.006 * (0.3 + t) : 0;
  point.x += shudder;
  return point;
}

export function stormCameraAt(p: number) {
  const t = clamp01(p);
  const follow = ease(clamp01((t - 0.02) / 0.78));
  const position = new THREE.Vector3(2.5, 5.2, -42.5).lerp(
    new THREE.Vector3(0.5, 2.55, -62.5),
    follow,
  );
  const seed = stormSeedAt(t);
  const target = seed.clone();
  target.y = Math.max(0.35, target.y - 0.15);
  target.z -= 0.9;
  if (t > 0.58) {
    const sink = clamp01((t - 0.58) / 0.42);
    target.y = 0.55 - sink * 0.3;
    target.z = -74.8;
  }
  const shake = 0.012 + t * 0.055 + (t > WAVE_IMPACT ? 0.05 : 0);
  position.x += Math.sin(t * 87 + 1.2) * shake;
  position.y += Math.sin(t * 103 + 0.4) * shake * 0.7;
  target.x += Math.sin(t * 71 + 2.4) * shake * 0.8;
  const fov = 35 + 7 * follow;
  const roll = Math.sin(t * 31) * 0.004 + (t > WAVE_IMPACT ? 0.008 : 0);
  return {position, target, fov, roll};
}

export function stormSpinAt(p: number) {
  const t = clamp01(p);
  const tumble = ease(clamp01((t - 0.05) / 0.6));
  return {
    spin: 0.4 + tumble * 8.6 + Math.sin(t * 4.2) * 0.5,
    pitch: -0.2 + tumble * 3.3 + Math.sin(t * 7.1) * 0.3,
    bank: Math.sin(t * 5.6 + 0.4) * (0.25 + tumble * 0.6),
  };
}

export function stormEnvelope(p: number) {
  const t = clamp01(p);
  return {
    wind: 0.55 + t * 0.55,
    rain: smooth(t, 0.02, 0.22),
    dark: smooth(t, 0.05, 0.55),
    flash:
      Math.exp(-Math.pow((t - 0.385) / 0.016, 2)) * 0.6 +
      Math.exp(-Math.pow((t - 0.635) / 0.013, 2)) * 0.5,
  };
}

function smooth(value: number, a: number, b: number) {
  const t = clamp01((value - a) / (b - a));
  return t * t * (3 - 2 * t);
}

export function waveTransformAt(p: number) {
  const t = clamp01((p - 0.44) / 0.19);
  return {
    x: 14 - 17.5 * t,
    y: 1.0 + 4.6 * ease(t) - 3.6 * clamp01((p - 0.67) / 0.25),
    z: -71.5,
    scaleY: 0.35 + 0.65 * ease(t),
    opacity: 0.78 * smooth(t, 0.02, 0.25) * (1 - 0.35 * clamp01((p - 0.7) / 0.3)),
    t,
  };
}
