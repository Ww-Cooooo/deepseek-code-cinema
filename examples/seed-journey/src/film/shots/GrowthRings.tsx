import React, {useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {Bloom} from '../../crossing/Bloom';
import {Seed} from '../../crossing/Seed';
import {createBarkMaterial, createTrunkGeometry} from '../../crossing/World';
import {getDiscTexture, getGlowTexture, getRingTexture} from '../../crossing/textures';
import {CameraRig} from '../CameraRig';
import {FilmGrade} from '../FilmGrade';
import {Sprout} from '../Sprout';
import {ease, progress} from '../../motion';

const cameraAt = (p: number) => {
  const r = ease(Math.min(1, p / 0.82));
  const position = new THREE.Vector3(0.62, 0.3, 1.72)
    .lerp(new THREE.Vector3(0.46, 2.4, 8.6), Math.min(1, r * 2.2))
    .lerp(new THREE.Vector3(0.0, 52, 112), Math.max(0, (r - 0.3) / 0.7))
    .lerp(new THREE.Vector3(0.0, 168, 356), Math.max(0, (r - 0.62) / 0.38));
  const target = new THREE.Vector3(0, 0.26, 0.02);
  return {
    position,
    target,
    fov: 36 + 20 * r,
    roll: Math.sin(p * Math.PI * 1.3) * 0.0015 * (1 - r),
  };
};

const fog = (p: number) => 0.0032 + 0.02 * (1 - Math.min(1, p / 0.28));

const Fogginess: React.FC<{density: number}> = ({density}) => {
  const scene = useThree((state) => state.scene);
  useLayoutEffect(() => {
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density = density;
      scene.fog.color.set('#0a1817');
    }
  }, [density, scene]);
  return null;
};

const Sky: React.FC = () => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uSun: {value: new THREE.Vector3(0, 0.13, -1).normalize()},
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uSun;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, -0.2, 1.0);
            vec3 low = vec3(0.075, 0.062, 0.043);
            vec3 mid = vec3(0.018, 0.038, 0.040);
            vec3 high = vec3(0.003, 0.010, 0.013);
            vec3 color = mix(low, mid, smoothstep(0.0, 0.2, h));
            color = mix(color, high, smoothstep(0.16, 0.78, h));
            float sun = max(dot(vDir, normalize(uSun)), 0.0);
            color += vec3(1.0, 0.46, 0.17) * pow(sun, 30.0) * 0.42;
            color += vec3(0.28, 0.12, 0.04) * pow(sun, 5.0) * 0.18;
            float band = exp(-pow((h - 0.02) / 0.07, 2.0));
            color += vec3(0.1, 0.045, 0.017) * band;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      }),
    [],
  );
  return <mesh material={material} frustumCulled={false}><sphereGeometry args={[700, 48, 24]} /></mesh>;
};

const Sun: React.FC = () => {
  const glow = getGlowTexture();
  return (
    <group position={[0, 52, -410]}>
      <mesh>
        <sphereGeometry args={[13, 28, 20]} />
        <meshBasicMaterial color="#ffe3b9" fog={false} toneMapped={false} />
      </mesh>
      <sprite scale={[100, 100, 1]}>
        <spriteMaterial map={glow} color="#ffa55a" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </sprite>
      <sprite scale={[300, 300, 1]}>
        <spriteMaterial map={glow} color="#b85f2c" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </sprite>
    </group>
  );
};

const Basin: React.FC = () => {
  const ring = getRingTexture();
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.085, 0]}>
        <circleGeometry args={[900, 96]} />
        <meshStandardMaterial color="#051416" roughness={0.22} metalness={0.35} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]}>
        <circleGeometry args={[330, 160]} />
        <meshStandardMaterial
          map={ring}
          bumpMap={ring}
          bumpScale={0.055}
          color="#b49d77"
          roughness={0.78}
          metalness={0.06}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[1.45, 64]} />
        <meshStandardMaterial color="#3b2d1d" roughness={0.72} metalness={0.08} />
      </mesh>
    </>
  );
};

const RimForest: React.FC = () => {
  const material = useMemo(createBarkMaterial, []);
  const trees = useMemo(() => {
    let state = 77123;
    const rand = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    };
    return Array.from({length: 26}, (_, index) => {
      const angle = (index / 26) * Math.PI * 2 + (rand() - 0.5) * 0.22;
      const radius = 92 + rand() * 165;
      return {
        position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number],
        height: 20 + rand() * 44,
        radius: 1.4 + rand() * 3.2,
        seed: Math.floor(rand() * 1000),
        leanX: (rand() - 0.5) * 0.12,
        leanZ: (rand() - 0.5) * 0.16,
      };
    });
  }, []);

  const geometries = useMemo(
    () => trees.map((tree) => createTrunkGeometry({
      height: tree.height,
      bottomRadius: tree.radius,
      topRadius: tree.radius * 0.5,
      seed: tree.seed,
      bendX: ((tree.seed % 13) - 6) * 0.09,
      bendZ: ((tree.seed % 9) - 4) * 0.11,
      radialSegments: 12,
      heightSegments: 18,
    })),
    [trees],
  );

  return (
    <>
      {trees.map((tree, index) => (
        <mesh
          key={`rim-${index}`}
          geometry={geometries[index]}
          material={material}
          position={tree.position}
          rotation={[tree.leanX, 0, tree.leanZ]}
        />
      ))}
    </>
  );
};

const CenterLife: React.FC<{p: number}> = ({p}) => {
  const disc = getDiscTexture();
  const strength = p > 0.42 ? Math.min(1, (p - 0.42) / 0.2) : 0;
  return (
    <>
      <group position={[0, 0.015, 0]}>
        <Seed
          position={new THREE.Vector3(0, 0, 0.18)}
          spin={0.42}
          pitch={-0.42}
          bank={0.16}
          scale={0.88}
          glow={0.5}
          halo={0.45}
          crack={1}
          showWake={false}
          wingFlutter={0.05}
        />
        <Sprout growth={1} rootGrowth={1} leafOpen={1} />
      </group>
      {strength > 0 ? (
        <>
          <sprite position={[0.02, 0.8, 0]} scale={[7.5, 7.5, 1]} renderOrder={5}>
            <spriteMaterial
              map={disc}
              color="#b8e37a"
              transparent
              opacity={0.34 * strength}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          <sprite position={[0.02, 0.5, 0]} scale={[18, 18, 1]} renderOrder={4}>
            <spriteMaterial
              map={disc}
              color="#ffab5d"
              transparent
              opacity={0.2 * strength}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </>
      ) : null}
    </>
  );
};

const HazeLayer: React.FC = () => {
  const glow = getGlowTexture();
  return (
    <>
      <sprite position={[0, 5, -95]} scale={[280, 26, 1]} renderOrder={3}>
        <spriteMaterial map={glow} color="#b98152" transparent opacity={0.09} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} toneMapped={false} />
      </sprite>
      <sprite position={[-90, 3, -160]} scale={[240, 30, 1]} renderOrder={3}>
        <spriteMaterial map={glow} color="#799386" transparent opacity={0.1} depthWrite={false} fog={false} />
      </sprite>
      <sprite position={[120, 2, -80]} scale={[180, 22, 1]} renderOrder={3}>
        <spriteMaterial map={glow} color="#8da79a" transparent opacity={0.08} depthWrite={false} fog={false} />
      </sprite>
    </>
  );
};

export const GrowthRings: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const pose = cameraAt(p);

  return (
    <AbsoluteFill style={{background: '#020809', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        dpr={1}
        gl={{antialias: true, alpha: false, powerPreference: 'high-performance'}}
        camera={{fov: 36, near: 0.02, far: 1600, position: [0.62, 0.3, 1.72]}}
        onCreated={({gl}) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.02;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        style={{position: 'absolute', inset: 0}}
      >
        <CameraRig pose={pose} />
        <color attach="background" args={['#061314']} />
        <fogExp2 attach="fog" args={['#0a1817', 0.0032]} />
        <Fogginess density={fog(p)} />
        <Sky />
        <Sun />
        <ambientLight intensity={0.18} color="#46625f" />
        <hemisphereLight args={['#7c958e', '#120f0a', 0.5]} />
        <directionalLight color="#ffc48d" intensity={2.3} position={[-150, 80, -300]} />
        <directionalLight color="#7fa19a" intensity={0.8} position={[160, 80, 120]} />
        <Basin />
        <RimForest />
        <HazeLayer />
        <CenterLife p={p} />
        <Bloom />
      </ThreeCanvas>
      <FilmGrade
        durationInFrames={durationInFrames}
        fadeIn={12}
        vignette={0.58}
        topShade={0.18}
        bottomShade={0.4}
        grain={0.04}
        tint="#1d2419"
        tintOpacity={0.04}
      />
    </AbsoluteFill>
  );
};
