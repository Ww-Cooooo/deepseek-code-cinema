import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {Reflector} from 'three/examples/jsm/objects/Reflector.js';
import {useCurrentFrame} from 'remotion';
import {previewDurationInFrames} from '../config';
import {progress} from '../motion';
import {seedPositionAt} from './choreography';

const waterVertex = /* glsl */ `
  uniform mat4 textureMatrix;
  varying vec4 vReflectCoord;
  varying vec3 vWorldPosition;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vReflectCoord = textureMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const waterFragment = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec3 color;
  uniform vec3 uDeep;
  uniform vec3 uFogColor;
  uniform vec3 uSunDirection;
  uniform vec3 uSeed;
  uniform float uFogDensity;
  uniform float uTime;
  uniform float uGlow;
  uniform float uChoppy;

  varying vec4 vReflectCoord;
  varying vec3 vWorldPosition;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 p = vWorldPosition.xz;
    float n1 = valueNoise(p * 0.53 + vec2(uTime * 0.07, -uTime * 0.11));
    float n2 = valueNoise(p * 1.79 - vec2(uTime * 0.13, uTime * 0.05));
    float waves = sin(p.x * 0.74 + p.y * 0.31 + uTime * 0.72) * 0.55
      + sin(p.x * 1.63 - p.y * 0.9 + uTime * 1.1) * 0.28
      + (n1 - 0.5) * 0.85 + (n2 - 0.5) * 0.32;

    vec2 distortion = vec2(
      sin(p.y * 0.8 + uTime * 0.65) * 0.0015 + (n1 - 0.5) * 0.0021,
      cos(p.x * 0.9 - uTime * 0.5) * 0.0012 + (n2 - 0.5) * 0.0017
    ) * uChoppy;

    vec4 reflected = texture2D(tDiffuse, vReflectCoord.xy / vReflectCoord.w + distortion);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - clamp(dot(viewDirection, vec3(0.0, 1.0, 0.0)), 0.0, 1.0), 2.15);

    float reflectionMix = clamp(0.14 + fresnel * 0.56, 0.0, 0.7);
    vec3 base = mix(uDeep, reflected.rgb, reflectionMix);
    base *= vec3(0.66, 0.85, 0.9);
    base += (n1 - 0.5) * 0.012;
    float saltFilm = smoothstep(0.72, 0.96, n2) * smoothstep(0.34, 0.0, abs(n1 - 0.5));
    base += vec3(0.026, 0.028, 0.022) * saltFilm;

    vec3 normal = normalize(vec3(
      distortion.x * 14.0 + waves * 0.02,
      1.0,
      distortion.y * 14.0 + waves * 0.015
    ));
    vec3 sunDirection = normalize(uSunDirection);
    vec3 halfVector = normalize(sunDirection + viewDirection);
    float glint = pow(max(dot(normal, halfVector), 0.0), 120.0);
    glint *= 0.35 + 0.65 * smoothstep(-0.1, 0.9, waves);
    base += vec3(1.0, 0.55, 0.24) * glint * 0.65;

    float seedDistance = distance(vWorldPosition.xz, uSeed.xz);
    float seedGlow = exp(-seedDistance * seedDistance * 4.5) * smoothstep(4.5, 0.4, uSeed.y) * uGlow;
    base += vec3(1.0, 0.48, 0.15) * seedGlow * 0.055;

    float depth = distance(cameraPosition, vWorldPosition);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * depth * depth);
    base = mix(base, uFogColor, clamp(fog, 0.0, 0.97));

    gl_FragColor = vec4(base, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const WATER_SHADER = {
  name: 'SaltMirrorWater',
  uniforms: {
    color: {value: new THREE.Color(0xffffff)},
    tDiffuse: {value: null},
    textureMatrix: {value: new THREE.Matrix4()},
    uDeep: {value: new THREE.Color('#02151a')},
    uFogColor: {value: new THREE.Color('#0b191b')},
    uSunDirection: {value: new THREE.Vector3(0, 0.12, -1).normalize()},
    uSeed: {value: new THREE.Vector3()},
    uFogDensity: {value: 0.0135},
    uTime: {value: 0},
    uGlow: {value: 1},
    uChoppy: {value: 1},
  },
  vertexShader: waterVertex,
  fragmentShader: waterFragment,
};

export type WaterSheetProps = {
  seed?: THREE.Vector3;
  time?: number;
  glow?: number;
  choppy?: number;
  deep?: string;
  fogDensity?: number;
};

export const WaterSheet: React.FC<WaterSheetProps> = ({
  seed,
  time,
  glow = 1,
  choppy = 1,
  deep,
  fogDensity,
}) => {
  const frame = useCurrentFrame();
  const reflector = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(1500, 1500, 1, 1);
    const water = new Reflector(geometry, {
      clipBias: 0.003,
      textureWidth: 1024,
      textureHeight: 1024,
      color: 0xffffff,
      multisample: 2,
      shader: WATER_SHADER,
    });
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0;
    water.renderOrder = -1;
    water.frustumCulled = false;
    return water;
  }, []);

  useLayoutEffect(() => {
    const p = progress(frame, previewDurationInFrames);
    const at = seed ?? seedPositionAt(p);
    const uniforms = (reflector.material as THREE.ShaderMaterial).uniforms;
    uniforms.uTime.value = time ?? p * 8;
    uniforms.uSeed.value.copy(at);
    uniforms.uGlow.value = glow;
    uniforms.uChoppy.value = choppy;
    if (deep) uniforms.uDeep.value.set(deep);
    if (fogDensity !== undefined) uniforms.uFogDensity.value = fogDensity;
  }, [choppy, deep, fogDensity, frame, glow, reflector, seed, time]);

  return <primitive object={reflector} />;
};
