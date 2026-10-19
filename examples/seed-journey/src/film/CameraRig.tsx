import React, {useLayoutEffect} from 'react';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';

export type CameraPose = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  roll?: number;
  near?: number;
  far?: number;
};

/** Applies a frame-derived pose. No wall clock and no accumulated motion. */
export const CameraRig: React.FC<{pose: CameraPose}> = ({pose}) => {
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    if (pose.roll) camera.rotateZ(pose.roll);
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = pose.fov;
    perspective.near = pose.near ?? 0.03;
    perspective.far = pose.far ?? 1800;
    perspective.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [
    camera,
    pose.position.x,
    pose.position.y,
    pose.position.z,
    pose.target.x,
    pose.target.y,
    pose.target.z,
    pose.fov,
    pose.roll,
    pose.near,
    pose.far,
  ]);

  return null;
};
