import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { createLidarMesh, disposeLidarGroup } from '../utils/LidarUtils';
import { Lidar } from '@/store/types/useEditorStoreTypes';

describe('LidarUtils', () => {
  const mockLidar: Lidar = {
    id: 'lidar-1',
    carId: 'car-1',
    x: 10,
    y: 20,
    z: 30,
    range: 100,
    rotation: Math.PI / 2,
    channels: 1,
    rotation_frequency: 2,
  };

  describe('createLidarMesh', () => {
    it('should create lidar group with correct userData', () => {
      const group = createLidarMesh(mockLidar);

      expect(group).toBeInstanceOf(THREE.Group);
      expect(group.userData).toEqual({
        type: 'lidar',
        id: 'lidar-1',
        carId: 'car-1',
      });
    });

    it('should set correct position and rotation', () => {
      const group = createLidarMesh(mockLidar);

      expect(group.position.x).toBe(10);
      expect(group.position.y).toBe(20);
      expect(group.position.z).toBe(30);
      expect(group.rotation.z).toBe(Math.PI / 2);
    });

    it('should create body mesh with cylinder geometry', () => {
      const group = createLidarMesh(mockLidar);
      const body = group.children[0] as THREE.Mesh;

      expect(body).toBeInstanceOf(THREE.Mesh);
      expect(body.geometry).toBeInstanceOf(THREE.CylinderGeometry);
      expect(body.material).toBeInstanceOf(THREE.MeshStandardMaterial);
    });

    it('should create body with correct userData', () => {
      const group = createLidarMesh(mockLidar);
      const body = group.children[0] as THREE.Mesh;

      expect(body.userData).toEqual({
        type: 'lidar',
        id: 'lidar-1',
        carId: 'car-1',
      });
    });

    it('should create body with dark color material', () => {
      const group = createLidarMesh(mockLidar);
      const body = group.children[0] as THREE.Mesh;
      const material = body.material as THREE.MeshStandardMaterial;

      expect(material.color.getHex()).toBe(0x222222);
    });

    it('should create cone mesh with cone geometry', () => {
      const group = createLidarMesh(mockLidar);
      const cone = group.children[1] as THREE.Mesh;

      expect(cone).toBeInstanceOf(THREE.Mesh);
      expect(cone.geometry).toBeInstanceOf(THREE.ConeGeometry);
    });

    it('should create cone with correct dimensions based on range', () => {
      const group = createLidarMesh(mockLidar);
      const cone = group.children[1] as THREE.Mesh;
      const geometry = cone.geometry as THREE.ConeGeometry;

      expect(geometry.parameters.radius).toBe(10);
      expect(geometry.parameters.height).toBe(30);
      expect(geometry.parameters.radialSegments).toBe(32);
      expect(geometry.parameters.heightSegments).toBe(1);
      expect(geometry.parameters.openEnded).toBe(true);
    });

    it('should create cone with correct material properties', () => {
      const group = createLidarMesh(mockLidar);
      const cone = group.children[1] as THREE.Mesh;
      const material = cone.material as THREE.MeshBasicMaterial;

      expect(material.color.getHex()).toBe(0x00ffff);
      expect(material.wireframe).toBe(true);
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.15);
    });

    it('should set cone rotation and position', () => {
      const group = createLidarMesh(mockLidar);
      const cone = group.children[1] as THREE.Mesh;

      expect(cone.rotation.x).toBe(Math.PI);
      expect(cone.position.z).toBe(15);
    });

    it('should create cone with correct userData', () => {
      const group = createLidarMesh(mockLidar);
      const cone = group.children[1] as THREE.Mesh;

      expect(cone.userData).toEqual({
        type: 'lidar',
        id: 'lidar-1',
        carId: 'car-1',
      });
    });

    it('should handle different range values', () => {
      const customLidar: Lidar = {
        ...mockLidar,
        range: 200,
      };

      const group = createLidarMesh(customLidar);
      const cone = group.children[1] as THREE.Mesh;
      const geometry = cone.geometry as THREE.ConeGeometry;

      expect(geometry.parameters.radius).toBe(20);
      expect(geometry.parameters.height).toBe(60);
      expect(cone.position.z).toBe(30);
    });

    it('should handle range 0', () => {
      const customLidar: Lidar = {
        ...mockLidar,
        range: 0,
      };

      const group = createLidarMesh(customLidar);
      const cone = group.children[1] as THREE.Mesh;
      const geometry = cone.geometry as THREE.ConeGeometry;

      expect(geometry.parameters.radius).toBe(0);
      expect(geometry.parameters.height).toBe(0);
      expect(cone.position.z).toBe(0);
    });

    it('should have exactly 2 children', () => {
      const group = createLidarMesh(mockLidar);

      expect(group.children).toHaveLength(2);
    });
  });

  describe('disposeLidarGroup', () => {
    it('should dispose all geometries in group', () => {
      const group = createLidarMesh(mockLidar);
      const disposeSpies: ReturnType<typeof vi.spyOn>[] = [];

      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh && mesh.geometry) {
          disposeSpies.push(vi.spyOn(mesh.geometry, 'dispose'));
        }
      });

      disposeLidarGroup(group);

      disposeSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should dispose all materials in group', () => {
      const group = createLidarMesh(mockLidar);
      const disposeSpies: ReturnType<typeof vi.spyOn>[] = [];

      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          materials.forEach((material) => {
            if (material) {
              disposeSpies.push(vi.spyOn(material, 'dispose'));
            }
          });
        }
      });

      disposeLidarGroup(group);

      disposeSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should handle group with no children', () => {
      const emptyGroup = new THREE.Group();

      expect(() => disposeLidarGroup(emptyGroup)).not.toThrow();
    });

    it('should handle mesh without geometry', () => {
      const group = new THREE.Group();
      const meshWithoutGeometry = new THREE.Mesh();
      group.add(meshWithoutGeometry);

      expect(() => disposeLidarGroup(group)).not.toThrow();
    });

    it('should handle mesh with array of materials', () => {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [
        new THREE.MeshBasicMaterial(),
        new THREE.MeshStandardMaterial(),
      ]);
      group.add(mesh);

      const disposeSpies = (mesh.material as THREE.Material[]).map((material) =>
        vi.spyOn(material, 'dispose')
      );

      disposeLidarGroup(group);

      disposeSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should handle nested groups', () => {
      const outerGroup = new THREE.Group();
      const innerGroup = new THREE.Group();
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial()
      );
      innerGroup.add(mesh);
      outerGroup.add(innerGroup);

      const geometrySpy = vi.spyOn(mesh.geometry, 'dispose');
      const materialSpy = vi.spyOn(mesh.material as THREE.Material, 'dispose');

      disposeLidarGroup(outerGroup);

      expect(geometrySpy).toHaveBeenCalled();
      expect(materialSpy).toHaveBeenCalled();
    });

    it('should not dispose non-mesh children', () => {
      const group = new THREE.Group();
      const nonMeshChild = new THREE.Object3D();
      group.add(nonMeshChild);

      expect(() => disposeLidarGroup(group)).not.toThrow();
    });
  });
});
