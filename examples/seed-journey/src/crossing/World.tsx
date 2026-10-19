import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';
import {useCurrentFrame} from 'remotion';
import {previewDurationInFrames} from '../config';
import {progress} from '../motion';
import {
  getBarkTexture,
  getDiscTexture,
  getGlowTexture,
  getShaftTexture,
  getStreakTexture,
} from './textures';
import {WaterSheet} from './water';

const SUN_POSITION = new THREE.Vector3(0, 12.5, -272);
const SUN_DIRECTION = SUN_POSITION.clone().normalize();
const FOG_COLOR = new THREE.Color('#0b191b');

type Rng = () => number;

function lcg(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function createBarkMaterial() {
  const bark = getBarkTexture();
  return new THREE.MeshStandardMaterial({
    map: bark,
    bumpMap: bark,
    bumpScale: 0.11,
    color: '#817865',
    roughness: 0.8,
    metalness: 0.055,
    side: THREE.DoubleSide,
  });
}

export function createTrunkGeometry(options: {
  height: number;
  bottomRadius: number;
  topRadius: number;
  seed: number;
  bendX?: number;
  bendZ?: number;
  radialSegments?: number;
  heightSegments?: number;
}) {
  const {
    height,
    bottomRadius,
    topRadius,
    seed,
    bendX = 0,
    bendZ = 0,
    radialSegments = 24,
    heightSegments = 44,
  } = options;
  const geometry = new THREE.CylinderGeometry(
    topRadius,
    bottomRadius,
    height,
    radialSegments,
    heightSegments,
    true,
  );
  geometry.translate(0, height / 2, 0);
  const position = geometry.attributes.position;
  const twist = ((seed % 9) - 4) * 0.04;

  for (let i = 0; i < position.count; i++) {
    let x = position.getX(i);
    let y = position.getY(i);
    let z = position.getZ(i);
    const t = THREE.MathUtils.clamp(y / height, 0, 1);
    const originalAngle = Math.atan2(z, x);
    const radius = Math.hypot(x, z);

    const flare = 1 + 0.48 * Math.exp(-t * 13);
    const ridge =
      1 +
      0.12 * Math.sin(originalAngle * 8 + y * 0.24 + seed * 0.73) +
      0.055 * Math.sin(originalAngle * 15 - y * 0.16 + seed * 1.31) +
      0.024 * Math.sin(originalAngle * 27 + y * 0.44 + seed * 2.7);
    const angle = originalAngle + twist * t;
    x = Math.cos(angle) * radius * ridge * flare;
    z = Math.sin(angle) * radius * ridge * flare;
    x += bendX * Math.pow(t, 1.4);
    z += bendZ * Math.pow(t, 1.7);

    if (t > 0.94) {
      const blend = (t - 0.94) / 0.06;
      const splinter = Math.sin(originalAngle * 4.1 + seed * 1.7) * 0.5 + 0.5;
      y -= blend * height * splinter * 0.045;
      x += Math.sin(originalAngle * 7 + seed) * height * 0.006 * blend;
      z += Math.cos(originalAngle * 5.3 + seed) * height * 0.006 * blend;
    }

    position.setXYZ(i, x, y, z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function taperedTube(
  points: THREE.Vector3[],
  startRadius: number,
  endRadius: number,
  tubularSegments = 14,
  radialSegments = 7,
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const point = curve.getPointAt(t);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];
    const radius = THREE.MathUtils.lerp(startRadius, endRadius, t);

    for (let j = 0; j <= radialSegments; j++) {
      const v = (j / radialSegments) * Math.PI * 2;
      const sin = Math.sin(v);
      const cos = -Math.cos(v);
      const nx = cos * normal.x + sin * binormal.x;
      const ny = cos * normal.y + sin * binormal.y;
      const nz = cos * normal.z + sin * binormal.z;
      vertices.push(
        point.x + radius * nx,
        point.y + radius * ny,
        point.z + radius * nz,
      );
      normals.push(nx, ny, nz);
      uvs.push(j / radialSegments, t * 2.2);
    }
  }

  for (let i = 1; i <= tubularSegments; i++) {
    for (let j = 1; j <= radialSegments; j++) {
      const a = (radialSegments + 1) * (i - 1) + (j - 1);
      const b = (radialSegments + 1) * i + (j - 1);
      const c = (radialSegments + 1) * i + j;
      const d = (radialSegments + 1) * (i - 1) + j;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

type TreeProps = {
  position: [number, number, number];
  height: number;
  radius: number;
  seed: number;
  leanX?: number;
  leanZ?: number;
  branches?: number;
  roots?: boolean;
  material: THREE.Material;
};

const PetrifiedTree: React.FC<TreeProps> = ({
  position,
  height,
  radius,
  seed,
  leanX = 0,
  leanZ = 0,
  branches = 0,
  roots = false,
  material,
}) => {
  const trunk = useMemo(
    () =>
      createTrunkGeometry({
        height,
        bottomRadius: radius,
        topRadius: radius * 0.56,
        seed,
        bendX: ((seed % 13) - 6) * 0.075,
        bendZ: ((seed % 9) - 4) * 0.09,
        radialSegments: radius > 2 ? 30 : 20,
        heightSegments: radius > 2 ? 54 : 34,
      }),
    [height, radius, seed],
  );

  const branchGeometries = useMemo(() => {
    if (branches <= 0) return [];
    const rand = lcg(seed * 811 + 29);
    const list: THREE.BufferGeometry[] = [];
    for (let i = 0; i < branches; i++) {
      const at = 0.74 + rand() * 0.19;
      const angle = rand() * Math.PI * 2;
      const length = height * (0.1 + rand() * 0.12);
      const start = new THREE.Vector3(
        Math.cos(angle) * radius * 0.76,
        height * at,
        Math.sin(angle) * radius * 0.76,
      );
      const outward = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const end = start
        .clone()
        .add(outward.clone().multiplyScalar(length))
        .add(new THREE.Vector3(0, height * (-0.13 + rand() * 0.22), 0));
      const mid = start.clone().lerp(end, 0.45);
      mid.y += height * (rand() * 0.035);
      const tip = end
        .clone()
        .add(outward.clone().multiplyScalar(length * 0.28))
        .add(new THREE.Vector3(0, -height * (0.035 + rand() * 0.08), 0));
      list.push(
        taperedTube(
          [start, mid, end, tip],
          radius * (0.11 + rand() * 0.05),
          radius * 0.018,
          16,
          8,
        ),
      );

      if (rand() > 0.42) {
        const twigAngle = angle + (rand() > 0.5 ? 1 : -1) * (0.5 + rand() * 0.8);
        const twigStart = start.clone().lerp(end, 0.55 + rand() * 0.25);
        const twigEnd = twigStart
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos(twigAngle) * length * 0.42,
              -height * (0.04 + rand() * 0.07),
              Math.sin(twigAngle) * length * 0.42,
            ),
          );
        list.push(
          taperedTube(
            [twigStart, twigStart.clone().lerp(twigEnd, 0.5), twigEnd],
            radius * 0.047,
            radius * 0.008,
            10,
            6,
          ),
        );
      }
    }
    return list;
  }, [branches, height, radius, seed]);

  const rootGeometries = useMemo(() => {
    if (!roots) return [];
    const rand = lcg(seed * 1711 + 91);
    const list: THREE.BufferGeometry[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + seed * 0.17 + rand() * 0.35;
      const reach = radius * (1.05 + rand() * 0.75);
      const start = new THREE.Vector3(
        Math.cos(angle) * radius * 0.62,
        Math.max(0.18, radius * 0.36),
        Math.sin(angle) * radius * 0.62,
      );
      const end = new THREE.Vector3(
        Math.cos(angle) * reach,
        -0.08,
        Math.sin(angle) * reach,
      );
      const mid = start.clone().lerp(end, 0.48);
      mid.y += radius * 0.08;
      list.push(taperedTube([start, mid, end], radius * 0.12, radius * 0.02, 10, 7));
    }
    return list;
  }, [radius, roots, seed]);

  const baseCollar = useMemo(
    () => new THREE.IcosahedronGeometry(1, 1),
    [],
  );

  return (
    <group position={position} rotation={[leanX, 0, leanZ]}>
      <mesh geometry={trunk} material={material} />
      <mesh
        geometry={baseCollar}
        material={material}
        position={[0, 0.02, 0]}
        scale={[radius * 1.2, Math.max(0.25, radius * 0.3), radius * 1.2]}
        rotation={[0, seed * 0.4, 0]}
      />
      {branchGeometries.map((geometry, index) => (
        <mesh key={`branch-${index}`} geometry={geometry} material={material} />
      ))}
      {rootGeometries.map((geometry, index) => (
        <mesh key={`root-${index}`} geometry={geometry} material={material} />
      ))}
    </group>
  );
};

const Sky: React.FC<{storm?: number}> = ({storm = 0}) => {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          uSunDirection: {value: SUN_DIRECTION},
          uStorm: {value: storm},
        },
        vertexShader: /* glsl */ `
          varying vec3 vDirection;
          void main() {
            vDirection = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uSunDirection;
          uniform float uStorm;
          varying vec3 vDirection;

          void main() {
            vec3 direction = normalize(vDirection);
            float height = clamp(direction.y, -0.08, 1.0);
            vec3 low = vec3(0.050, 0.050, 0.042);
            vec3 mid = vec3(0.016, 0.034, 0.040);
            vec3 high = vec3(0.002, 0.006, 0.010);
            vec3 color = mix(low, mid, smoothstep(0.0, 0.25, height));
            color = mix(color, high, smoothstep(0.2, 0.84, height));

            float sunAmount = max(dot(direction, normalize(uSunDirection)), 0.0);
            color += vec3(1.0, 0.47, 0.16) * pow(sunAmount, 24.0) * 0.24 * (1.0 - uStorm * 0.84);
            color += vec3(1.0, 0.34, 0.09) * pow(sunAmount, 6.0) * 0.09 * (1.0 - uStorm * 0.9);
            float horizonWarm = exp(-pow((height - 0.025) / 0.11, 2.0))
              * exp(-abs(direction.x - normalize(uSunDirection).x) * 2.6);
            color += vec3(0.12, 0.047, 0.013) * horizonWarm * (1.0 - uStorm * 0.86);

            float band = sin(height * 45.0 + direction.x * 2.2 + direction.z * 0.9) * 0.5 + 0.5;
            color += vec3(0.055, 0.042, 0.026) * band * smoothstep(0.02, 0.16, height) * 0.12;
            vec3 stormColor = mix(vec3(0.007, 0.016, 0.018), vec3(0.022, 0.032, 0.032), smoothstep(0.0, 0.62, height));
            color = mix(color, stormColor, uStorm);
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );

  return (
    <mesh material={material} frustumCulled={false}>
      <sphereGeometry args={[480, 64, 32]} />
    </mesh>
  );
};

const Stars: React.FC = () => {
  const geometry = useMemo(() => {
    const rand = lcg(81273);
    const vertices: number[] = [];
    for (let i = 0; i < 85; i++) {
      const theta = rand() * Math.PI * 2;
      const elevation = 0.14 + rand() * 0.76;
      const radius = 420;
      const horizontal = Math.cos(elevation) * radius;
      vertices.push(
        Math.cos(theta) * horizontal,
        Math.sin(elevation) * radius,
        Math.sin(theta) * horizontal - 70,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    return geo;
  }, []);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#b9d0ca"
        size={0.8}
        sizeAttenuation
        transparent
        opacity={0.4}
        depthWrite={false}
        fog={false}
      />
    </points>
  );
};

const Sun: React.FC = () => {
  const glow = getGlowTexture();
  const streak = getStreakTexture();
  return (
    <group position={SUN_POSITION}>
      <mesh>
        <sphereGeometry args={[12.5, 32, 24]} />
        <meshBasicMaterial color="#fff0d1" fog={false} toneMapped={false} />
      </mesh>
      <sprite scale={[80, 80, 1]} renderOrder={-3}>
        <spriteMaterial
          map={glow}
          color="#ffad61"
          transparent
          opacity={0.54}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[245, 245, 1]} renderOrder={-4}>
        <spriteMaterial
          map={glow}
          color="#b45e2e"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </sprite>
      <sprite scale={[240, 9, 1]} renderOrder={-2}>
        <spriteMaterial
          map={streak}
          color="#ff9f5d"
          transparent
          opacity={0.24}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
};

const Arch: React.FC<{material: THREE.Material}> = ({material}) => {
  const bridge = useMemo(
    () =>
      taperedTube(
        [
          new THREE.Vector3(-8.4, 15.2, -47.5),
          new THREE.Vector3(-3.6, 18.6, -48.1),
          new THREE.Vector3(2.2, 17.1, -48.0),
          new THREE.Vector3(8.8, 13.2, -48.4),
        ],
        1.7,
        0.82,
        24,
        9,
      ),
    [],
  );

  const vines = useMemo(() => {
    const rand = lcg(77219);
    return Array.from({length: 11}, (_, index) => {
      const x = -8 + rand() * 16;
      const y = 16 + rand() * 6;
      const length = 2.5 + rand() * 9;
      const points = [
        new THREE.Vector3(x, y, -47.6 + rand() * 1.1),
        new THREE.Vector3(x + (rand() - 0.5) * 0.8, y - length * 0.48, -47.5 + rand() * 1.1),
        new THREE.Vector3(x + (rand() - 0.5) * 1.5, y - length, -47.6 + rand() * 0.9),
      ];
      return taperedTube(points, 0.005 + rand() * 0.008, 0.002, 9, 5);
    });
  }, []);

  return (
    <group>
      <PetrifiedTree
        position={[-8.2, 0, -48.2]}
        height={35}
        radius={4.5}
        seed={15}
        leanZ={-0.035}
        branches={0}
        roots
        material={material}
      />
      <PetrifiedTree
        position={[8.9, 0, -48.8]}
        height={32}
        radius={4.1}
        seed={31}
        leanZ={0.06}
        branches={0}
        roots
        material={material}
      />
      <mesh geometry={bridge} material={material} />
      {vines.map((geometry, index) => (
        <mesh key={`vine-${index}`} geometry={geometry} material={material} />
      ))}
    </group>
  );
};

const DistantForest: React.FC<{material: THREE.Material}> = ({material}) => {
  const trees = useMemo(() => {
    const rand = lcg(61237);
    return Array.from({length: 14}, () => {
      const side = rand() > 0.5 ? 1 : -1;
      const x = side * (17 + Math.pow(rand(), 0.72) * 100);
      const z = -76 - rand() * 105;
      const height = 19 + rand() * 48;
      const radius = 1.3 + rand() * 3.2;
      return {
        position: [x, 0, z] as [number, number, number],
        height,
        radius,
        seed: Math.floor(rand() * 1000),
        leanX: (rand() - 0.5) * 0.12,
        leanZ: (rand() - 0.5) * 0.14,
        branches: 0,
      };
    });
  }, []);

  return (
    <>
      {trees.map((tree, index) => (
        <PetrifiedTree
          key={`far-${index}`}
          position={tree.position}
          height={tree.height}
          radius={tree.radius}
          seed={tree.seed}
          leanX={tree.leanX}
          leanZ={tree.leanZ}
          branches={tree.branches}
          material={material}
        />
      ))}
    </>
  );
};

const LightShafts: React.FC = () => {
  const shaft = getShaftTexture();
  const beams = [
    {x: -10, y: 12, w: 10, h: 38, rot: 0.12, opacity: 0.055},
    {x: -3.2, y: 13, w: 7, h: 42, rot: 0.06, opacity: 0.075},
    {x: 3.5, y: 13.5, w: 9, h: 36, rot: -0.08, opacity: 0.06},
    {x: 11, y: 12, w: 12, h: 30, rot: -0.15, opacity: 0.045},
  ];

  return (
    <group position={[0, 0, -54]}>
      {beams.map((beam, index) => (
        <mesh
          key={`shaft-${index}`}
          position={[beam.x, beam.y, 0]}
          rotation={[0, 0, beam.rot]}
          renderOrder={1}
        >
          <planeGeometry args={[beam.w, beam.h]} />
          <meshBasicMaterial
            map={shaft}
            color="#ffb571"
            transparent
            opacity={beam.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            fog={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <sprite position={[0, 10, -6]} scale={[130, 36, 1]} renderOrder={1}>
        <spriteMaterial
          map={getGlowTexture()}
          color="#b37243"
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
};

const Snags: React.FC<{material: THREE.Material}> = ({material}) => {
  const snags = useMemo(() => {
    const rand = lcg(92073);
    return Array.from({length: 17}, (_, index) => {
      const side = index % 2 === 0 ? 1 : -1;
      const x = side * (3.2 + rand() * 24);
      const z = -4.5 - rand() * 50;
      const base = new THREE.Vector3(x, -0.2, z);
      const end = new THREE.Vector3(
        x + (rand() - 0.5) * 2.4,
        0.8 + rand() * 5.8,
        z + (rand() - 0.5) * 2.2,
      );
      const mid = base.clone().lerp(end, 0.5);
      mid.x += (rand() - 0.5) * 0.8;
      mid.z += (rand() - 0.5) * 0.8;
      return {
        geometry: taperedTube([base, mid, end], 0.16 + rand() * 0.24, 0.02, 9, 6),
      };
    });
  }, []);

  return (
    <>
      {snags.map((snag, index) => (
        <mesh key={`snag-${index}`} geometry={snag.geometry} material={material} />
      ))}
    </>
  );
};

const FogLayers: React.FC = () => {
  const glow = getGlowTexture();
  return (
    <>
      <sprite position={[-2, 1.2, -14]} scale={[50, 8, 1]} renderOrder={3}>
        <spriteMaterial
          map={glow}
          color="#81978c"
          transparent
          opacity={0.13}
          depthWrite={false}
          fog
        />
      </sprite>
      <sprite position={[6, 1.6, -30]} scale={[90, 10, 1]} renderOrder={3}>
        <spriteMaterial
          map={glow}
          color="#8ca096"
          transparent
          opacity={0.12}
          depthWrite={false}
          fog
        />
      </sprite>
      <sprite position={[-4, 2.2, -53]} scale={[130, 15, 1]} renderOrder={3}>
        <spriteMaterial
          map={glow}
          color="#7f958c"
          transparent
          opacity={0.1}
          depthWrite={false}
          fog
        />
      </sprite>
      <sprite position={[0, 10, -88]} scale={[170, 32, 1]} renderOrder={2}>
        <spriteMaterial
          map={glow}
          color="#b5784c"
          transparent
          opacity={0.08}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </sprite>
    </>
  );
};

const Mist: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = getGlowTexture();
  const sprites = useMemo(() => {
    const rand = lcg(22841);
    return Array.from({length: 15}, (_, index) => ({
      position: [
        -75 + rand() * 150,
        0.7 + rand() * 7.5,
        -20 - rand() * 105,
      ] as [number, number, number],
      scale: 34 + rand() * 82,
      opacity: 0.06 + rand() * 0.1,
      phase: rand() * Math.PI * 2,
      color: index % 4 === 0 ? '#c08f64' : '#93a69c',
    }));
  }, []);

  const puffs = useMemo(() => {
    const rand = lcg(71019);
    return Array.from({length: 20}, (_, index) => {
      const side = index % 2 === 0 ? 1 : -1;
      return {
        position: [
          side * (4.5 + rand() * 32),
          0.35 + rand() * 2.4,
          -7 - rand() * 52,
        ] as [number, number, number],
        scale: 5 + rand() * 16,
        opacity: 0.065 + rand() * 0.1,
        phase: rand() * Math.PI * 2,
        color: index % 5 === 0 ? '#b88b66' : '#93a99f',
      };
    });
  }, []);

  const p = progress(frame, previewDurationInFrames);

  return (
    <>
      {sprites.map((sprite, index) => (
        <sprite
          key={`mist-${index}`}
          position={[
            sprite.position[0] + Math.sin(p * Math.PI * 2 + sprite.phase) * 2.2,
            sprite.position[1] + Math.sin(p * Math.PI + sprite.phase) * 0.2,
            sprite.position[2],
          ]}
          scale={[sprite.scale, sprite.scale * 0.34, 1]}
          renderOrder={2}
        >
          <spriteMaterial
            map={glow}
            color={sprite.color}
            transparent
            opacity={sprite.opacity}
            depthWrite={false}
            fog
            toneMapped
          />
        </sprite>
      ))}
      {puffs.map((puff, index) => (
        <sprite
          key={`puff-${index}`}
          position={[
            puff.position[0] + Math.sin(p * Math.PI * 2 + puff.phase) * 1.1,
            puff.position[1] + Math.cos(p * Math.PI * 1.7 + puff.phase) * 0.08,
            puff.position[2],
          ]}
          scale={[puff.scale, puff.scale * 0.3, 1]}
          renderOrder={3}
        >
          <spriteMaterial
            map={glow}
            color={puff.color}
            transparent
            opacity={puff.opacity}
            depthWrite={false}
            fog
            toneMapped
          />
        </sprite>
      ))}
    </>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const disc = getDiscTexture();
  const p = progress(frame, previewDurationInFrames);
  const count = 300;
  const geometry = useMemo(() => {
    const rand = lcg(571221);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -12 + rand() * 28;
      positions[i * 3 + 1] = 0.1 + rand() * 8;
      positions[i * 3 + 2] = -44 + rand() * 48;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  useLayoutEffect(() => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const x = attr.getX(i);
      const y = attr.getY(i);
      const z = attr.getZ(i);
      attr.setX(i, x + Math.sin(p * Math.PI * 4 + i * 1.73) * 0.16 + 0.48 * p);
      attr.setY(i, y + Math.sin(p * Math.PI * 2.2 + i * 0.37) * 0.2);
      attr.setZ(i, z - 1.0 * p);
    }
    attr.needsUpdate = true;
  }, [geometry, p]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        map={disc}
        color="#d9ad7b"
        size={0.045}
        sizeAttenuation
        transparent
        opacity={0.36}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        alphaTest={0.01}
        fog
      />
    </points>
  );
};

const Bokeh: React.FC = () => {
  const frame = useCurrentFrame();
  const disc = getDiscTexture();
  const p = progress(frame, previewDurationInFrames);
  const motes = useMemo(() => {
    const rand = lcg(98213);
    return Array.from({length: 12}, (_, index) => ({
      x: -4.2 + rand() * 6.5,
      y: 0.4 + rand() * 2.8,
      z: 2.4 - rand() * 8.5,
      size: 0.08 + rand() * 0.2,
      opacity: 0.08 + rand() * 0.16,
      phase: rand() * Math.PI * 2,
      warm: index % 3 !== 0,
    }));
  }, []);

  return (
    <>
      {motes.map((mote, index) => (
        <sprite
          key={`mote-${index}`}
          position={[
            mote.x + Math.sin(p * Math.PI * 2.3 + mote.phase) * 0.25,
            mote.y + Math.sin(p * Math.PI * 1.5 + mote.phase) * 0.12,
            mote.z,
          ]}
          scale={[mote.size, mote.size, 1]}
          renderOrder={4}
        >
          <spriteMaterial
            map={disc}
            color={mote.warm ? '#ffbd7a' : '#8c9e91'}
            transparent
            opacity={mote.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog
          />
        </sprite>
      ))}
    </>
  );
};

export const PetrifiedWorld: React.FC<{seed?: THREE.Vector3; storm?: number}> = ({
  seed,
  storm = 0,
}) => {
  const material = useMemo(createBarkMaterial, []);
  const s = THREE.MathUtils.clamp(storm, 0, 1);

  return (
    <>
      <color attach="background" args={['#061214']} />
      <fogExp2 attach="fog" args={[FOG_COLOR.getHex(), 0.0135 + s * 0.017]} />

      <ambientLight intensity={0.25 - 0.11 * s} color="#3c5c5b" />
      <hemisphereLight args={['#6f8c88', '#12110b', 0.55 - 0.2 * s]} />
      <directionalLight color="#ffd0a0" intensity={3.2 - 2.35 * s} position={[-55, 50, -150]} />
      <directionalLight color="#92b8b2" intensity={1.25 - 0.45 * s} position={[18, 12, 34]} />
      <directionalLight color="#557b77" intensity={0.6 - 0.15 * s} position={[-30, 18, 10]} />
      <directionalLight color="#8e9c92" intensity={0.55 - 0.4 * s} position={[35, 6, -15]} />

      <Sky storm={s} />
      <Stars />
      {s < 0.55 ? <Sun /> : null}
      <WaterSheet
        seed={seed}
        choppy={1 + s * 1.15}
        glow={1 - s * 0.75}
        deep={s > 0.3 ? '#021014' : undefined}
        fogDensity={0.0135 + s * 0.017}
      />
      {s < 0.55 ? <LightShafts /> : null}
      <FogLayers />
      <Mist />
      <Snags material={material} />
      <Bokeh />

      <Arch material={material} />

      <PetrifiedTree
        position={[-4.9, 0, -1.2]}
        height={33}
        radius={1.38}
        seed={5}
        leanZ={-0.06}
        leanX={0.025}
        branches={0}
        roots
        material={material}
      />
      <PetrifiedTree
        position={[7.8, 0, -7.2]}
        height={26}
        radius={1.06}
        seed={12}
        leanZ={0.09}
        branches={0}
        roots
        material={material}
      />
      <PetrifiedTree
        position={[-14.8, 0, -27]}
        height={38}
        radius={2.05}
        seed={8}
        leanZ={-0.075}
        branches={2}
        roots
        material={material}
      />
      <PetrifiedTree
        position={[16.2, 0, -33]}
        height={36}
        radius={1.85}
        seed={18}
        leanZ={0.06}
        branches={2}
        roots
        material={material}
      />
      <PetrifiedTree
        position={[-16.5, 0, -40]}
        height={43}
        radius={2.5}
        seed={27}
        leanZ={-0.03}
        branches={3}
        material={material}
      />
      <PetrifiedTree
        position={[18.5, 0, -47]}
        height={32}
        radius={2.2}
        seed={36}
        leanZ={0.04}
        branches={3}
        material={material}
      />
      <DistantForest material={material} />
      <Dust />
    </>
  );
};
