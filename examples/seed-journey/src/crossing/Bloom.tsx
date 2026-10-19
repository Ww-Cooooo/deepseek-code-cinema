import React, {useLayoutEffect, useMemo} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/examples/jsm/postprocessing/OutputPass.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const gradeShader = {
  uniforms: {
    tDiffuse: {value: null},
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      vec3 cool = color * vec3(0.9, 1.01, 1.07);
      vec3 warm = color * vec3(1.045, 1.0, 0.93);
      color = mix(cool, warm, smoothstep(0.015, 0.55, luma));
      color += vec3(0.0018, 0.0048, 0.006) * (1.0 - smoothstep(0.0, 0.18, luma));
      gl_FragColor = vec4(max(color, vec3(0.0)), texel.a);
    }
  `,
};

/**
 * Render-on-advance bloom. The time-dependent scene stays a pure function of
 * Remotion's frame; this component only takes over the final composite.
 */
export const Bloom: React.FC = () => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);

  const composer = useMemo(() => {
    const instance = new EffectComposer(gl);
    instance.addPass(new RenderPass(scene, camera));
    instance.addPass(
      new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        0.4,
        0.56,
        0.84,
      ),
    );
    instance.addPass(new ShaderPass(gradeShader));
    instance.addPass(new OutputPass());
    return instance;
  }, [gl, scene, camera, size.width, size.height]);

  useLayoutEffect(() => {
    composer.setPixelRatio(1);
    composer.setSize(size.width, size.height);
  }, [composer, size.width, size.height]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
};
