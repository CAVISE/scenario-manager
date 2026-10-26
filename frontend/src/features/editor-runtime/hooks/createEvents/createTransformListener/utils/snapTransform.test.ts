import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { snapTransform } from './snapTransform';

describe('snapTransform', () => {
  it('snaps planar movement while preserving the object height', () => {
    useWorkspacePreferences.setState({
      snapToGrid: true,
      gridSnapStep: 0.5,
      snapRotation: false,
    });
    const target = new THREE.Object3D();
    target.position.set(1.24, -0.74, 3.17);

    snapTransform(target, 'car');

    expect(target.position.toArray()).toEqual([1, -0.5, 3.17]);
  });

  it('uses the vertical rotation axis for buildings', () => {
    useWorkspacePreferences.setState({
      snapRotation: true,
      rotationSnapDegrees: 45,
      snapToGrid: false,
    });
    const target = new THREE.Object3D();
    target.rotation.y = THREE.MathUtils.degToRad(52);

    snapTransform(target, 'building');

    expect(target.rotation.y).toBeCloseTo(THREE.MathUtils.degToRad(45));
  });

  it('keeps supported objects on the road while leaving lidars relative to their car', () => {
    useWorkspacePreferences.setState({ snapToRoad: true, snapToGrid: false });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(100, 100));
    road.position.z = 7;
    road.updateMatrixWorld();

    const car = new THREE.Object3D();
    car.position.set(1, 2, 20);
    snapTransform(car, 'car', road);

    const lidar = new THREE.Object3D();
    lidar.position.set(1, 2, 20);
    snapTransform(lidar, 'lidar', road);

    expect(car.position.z).toBe(7);
    expect(lidar.position.z).toBe(20);
  });
});
