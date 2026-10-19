import * as THREE from 'three';
import {clamp01, ease} from '../motion';

// World units are metres. The seed is enlarged for screen legibility: its body is
// ~20 cm and its paper wing ~60 cm. This is a fable scale, not botanical proportion.
export const seedCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-1.24, 0.38, 0.2),
    new THREE.Vector3(-1.0, 0.55, -5.0),
    new THREE.Vector3(0.1, 1.18, -15.0),
    new THREE.Vector3(0.7, 3.0, -27.0),
    new THREE.Vector3(0.38, 4.7, -40.0),
    new THREE.Vector3(0.08, 5.15, -50.5),
  ],
  false,
  'centripetal',
  0.5,
);

// The review cut is also the full film's cut inside shot 3: a close water-level
// follow gives way to a low, wide view of the same seed approaching the gate.
export const SHOT_CUT_FRAME = 144;

const cameraACurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-1.75, 0.55, 4.25),
    new THREE.Vector3(-1.9, 0.8, 2.3),
    new THREE.Vector3(-2.15, 1.28, -2.2),
    new THREE.Vector3(-2.45, 2.05, -9.2),
  ],
  false,
  'centripetal',
  0.5,
);

const cameraBCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-3.5, 1.35, -18.5),
    new THREE.Vector3(-2.8, 1.45, -20.1),
    new THREE.Vector3(-1.0, 1.7, -22.5),
  ],
  false,
  'centripetal',
  0.5,
);

const targetBCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(1.25, 7.8, -50.0),
    new THREE.Vector3(0.7, 7.55, -49.5),
    new THREE.Vector3(0.0, 7.3, -49.0),
  ],
  false,
  'centripetal',
  0.5,
);

/** Slow lift-off, steady crossing, gentle arrival. */
export function travelProgress(p: number) {
  const t = clamp01(p);
  return ease(clamp01((t - 0.015) / 0.97));
}

export function seedPositionAt(p: number) {
  return seedCurve.getPoint(travelProgress(p));
}

export function cameraPoseAt(frame: number, durationInFrames: number) {
  const p = clamp01(frame / Math.max(1, durationInFrames - 1));
  const isB = frame >= SHOT_CUT_FRAME;

  if (!isB) {
    const t = clamp01(frame / (SHOT_CUT_FRAME - 1));
    const travel = ease(clamp01((t - 0.02) / 0.96));
    const position = cameraACurve.getPoint(travel);
    const ahead = seedPositionAt(clamp01(p + 0.022));
    const target = ahead.clone().add(new THREE.Vector3(0.02, 0.05, -1.9));
    const fov = 38 + 4 * ease(clamp01((t - 0.08) / 0.92));

    const breath = Math.sin(t * Math.PI * 5.1) * 0.006;
    position.x += breath * 0.7;
    position.y += Math.sin(t * Math.PI * 7.3 + 0.8) * 0.004;
    target.x += Math.sin(t * Math.PI * 3.2 + 1.4) * 0.004;
    target.y += Math.sin(t * Math.PI * 4.7 + 0.2) * 0.004;

    const roll = -0.004 + Math.sin(t * Math.PI * 2.1) * 0.0026;
    return {position, target, fov, roll};
  }

  const t = clamp01((frame - SHOT_CUT_FRAME) / Math.max(1, durationInFrames - 1 - SHOT_CUT_FRAME));
  const travel = ease(t);
  const position = cameraBCurve.getPoint(travel);
  const target = targetBCurve.getPoint(travel);
  const fov = 45 - 4 * ease(t);
  position.x += Math.sin(t * Math.PI * 4.2 + 0.4) * 0.005;
  position.y += Math.sin(t * Math.PI * 6.1 + 0.9) * 0.003;
  target.x += Math.sin(t * Math.PI * 2.7 + 1.2) * 0.005;
  const roll = -0.001 + Math.sin(t * Math.PI * 1.8) * 0.002;
  return {position, target, fov, roll};
}

export function seedSpinAt(p: number) {
  const t = clamp01(p);
  const spin = 0.38 + t * 1.7 + Math.sin(t * Math.PI * 2 * 0.7) * 0.22;
  const pitch = -0.38 + Math.sin(t * Math.PI * 3.4) * 0.14;
  const bank = Math.sin(t * Math.PI * 2.6 + 0.4) * 0.16 - 0.05;
  return {spin, pitch, bank};
}
