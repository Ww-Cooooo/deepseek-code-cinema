import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONT} from './font';
import {ease, phase, progress} from './motion';

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const camera = useThree((state) => state.camera);

  // No useFrame integration: the camera pose is a pure function of the frame.
  useLayoutEffect(() => {
    const p = progress(frame, durationInFrames);
    const t = ease(phase(p, 0.02, 0.94));
    camera.position.set(7.3 - 2.1 * t, 3.2 - 0.75 * t, 8.8 - 2.2 * t);
    camera.lookAt(0.1, 0.2, 0);
    camera.updateProjectionMatrix();
  }, [camera, frame, durationInFrames]);

  return null;
};

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = progress(frame, durationInFrames);
  const late = ease(phase(p, 0.28, 0.9));
  const spin = Math.PI * 0.75 * late;
  const bob = Math.sin(p * Math.PI * 2) * 0.1;

  return (
    <>
      <CameraRig />
      <color attach="background" args={['#d6d9dd']} />
      <fog attach="fog" args={['#d6d9dd', 10, 23]} />

      <ambientLight intensity={0.24} />
      <hemisphereLight args={['#f4f6f8', '#7f8993', 1.05]} />
      <directionalLight
        castShadow
        position={[4.8, 7.4, 5.6]}
        intensity={2.15}
        color="#fff1df"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.0006}
      />
      <directionalLight position={[-4.5, 2.0, -3.5]} intensity={0.65} color="#b9cee3" />

      {/* Floor and back wall give the key light a place to fall and the
          objects a shared contact surface. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.24, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#b5bcc3" roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[0, 2.9, -4.4]} receiveShadow>
        <planeGeometry args={[22, 13]} />
        <meshStandardMaterial color="#cdd1d6" roughness={1} metalness={0} />
      </mesh>

      {/* Blocking object: hard faces, a readable shadow and silhouette. */}
      <mesh
        castShadow
        receiveShadow
        position={[-2.35, 0.18, -0.35]}
        rotation={[0.08, -0.35 + spin * 0.8, 0.04]}
      >
        <boxGeometry args={[2.7, 2.7, 2.7]} />
        <meshStandardMaterial color="#343b43" roughness={0.56} metalness={0.16} />
      </mesh>

      {/* Rounded object: shading and highlight on a different material. */}
      <mesh castShadow receiveShadow position={[1.6, 0.26 + bob, 1.15]}>
        <sphereGeometry args={[1.26, 48, 32]} />
        <meshStandardMaterial color="#7e8b98" roughness={0.34} metalness={0.24} />
      </mesh>
      <mesh castShadow receiveShadow position={[1.6, -1.02, 1.15]}>
        <cylinderGeometry args={[1.35, 1.35, 0.22, 48]} />
        <meshStandardMaterial color="#929ba4" roughness={0.86} metalness={0.08} />
      </mesh>

      {/* Thin ring: an open form that shows depth and occlusion. */}
      <mesh
        castShadow
        receiveShadow
        position={[0.2, 1.95, -1.8]}
        rotation={[1.12 + spin * 0.22, spin * 0.75, 0.14]}
      >
        <torusGeometry args={[0.92, 0.23, 20, 64]} />
        <meshStandardMaterial color="#536b80" roughness={0.42} metalness={0.38} />
      </mesh>

      {/* Foreground column: it crosses in front of the sphere as the camera moves. */}
      <mesh castShadow receiveShadow position={[3.05, 0.2, 1.85]} rotation={[0, -0.28, 0]}>
        <boxGeometry args={[0.52, 3.9, 0.52]} />
        <meshStandardMaterial color="#272e35" roughness={0.62} metalness={0.12} />
      </mesh>

      {/* A shallow step: a contact edge at the floor. */}
      <mesh castShadow receiveShadow position={[-0.3, -0.94, -1.1]}>
        <boxGeometry args={[3.2, 0.36, 1.5]} />
        <meshStandardMaterial color="#9ea7b0" roughness={0.9} metalness={0.04} />
      </mesh>
    </>
  );
};

/**
 * Neutral 3D world track. It is a tool check, not a film template.
 * If you add a <Sequence> inside the Canvas, give it layout="none".
 */
export const WorldSample: React.FC = () => {
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{background: '#d6d9dd', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows="percentage"
        dpr={1}
        gl={{antialias: true, alpha: false}}
        camera={{fov: 41, near: 0.1, far: 80, position: [7.3, 3.2, 8.8]}}
        style={{position: 'absolute', inset: 0}}
      >
        <Scene />
      </ThreeCanvas>

      <div
        style={{
          position: 'absolute',
          left: 98,
          top: 62,
          fontFamily: FONT,
          fontSize: 22,
          letterSpacing: 3,
          color: '#3a424a',
          textShadow: '0 1px 10px rgba(214,217,221,0.9)',
        }}
      >
        CODE TO VIDEO · 6s 工具检查
      </div>
      <div
        style={{
          position: 'absolute',
          right: 96,
          top: 62,
          fontFamily: FONT,
          fontSize: 20,
          letterSpacing: 2,
          color: '#45505a',
          textShadow: '0 1px 10px rgba(214,217,221,0.9)',
        }}
      >
        3D / WORLD
      </div>
      <div
        style={{
          position: 'absolute',
          left: 98,
          bottom: 84,
          fontFamily: FONT,
          color: '#20262c',
          textShadow: '0 1px 12px rgba(214,217,221,0.92)',
        }}
      >
        <div style={{fontSize: 78, fontWeight: 650, letterSpacing: 2, lineHeight: 1}}>
          世界 / WORLD
        </div>
        <div style={{fontSize: 27, marginTop: 18, color: '#46515b', letterSpacing: 1}}>
          相机 · 方向光 · 材质 · 遮挡
        </div>
        <div style={{fontSize: 22, marginTop: 9, color: '#59646e', letterSpacing: 1}}>
          帧驱动 · ThreeCanvas · 无实时 useFrame 积分
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 98,
          bottom: 92,
          width: 244,
          borderTop: '2px solid rgba(32,38,44,0.55)',
          paddingTop: 14,
          fontFamily: FONT,
          fontSize: 20,
          letterSpacing: 2,
          color: '#3a424a',
          textAlign: 'right',
          textShadow: '0 1px 10px rgba(214,217,221,0.9)',
        }}
      >
        06s / SHADOW MAP
      </div>
    </AbsoluteFill>
  );
};
