import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as THREE from 'three';
import { useBuildingLoader } from '../ui/useBuildingLoader';

const mockLoad = vi.fn();

vi.mock('three-stdlib', () => ({
  GLTFLoader: vi.fn().mockImplementation(function () {
    return {
      load: mockLoad,
    };
  }),
}));

describe('useBuildingLoader', () => {
  let mockScene: THREE.Group;

  beforeEach(() => {
    mockLoad.mockReset();
    mockScene = new THREE.Group();
    mockScene.rotation.x = 0;
    mockScene.scale.setScalar(1);
    mockScene.position.z = 0;
  });

  it('should load GLB model and apply transformations', async () => {
    mockLoad.mockImplementation(
      (url: string, onLoad: (gltf: { scene: THREE.Object3D }) => void) => {
        expect(url).toBe('/nyc_bronx_buildings.glb');
        onLoad({ scene: mockScene });
      }
    );

    const { result } = renderHook(() => useBuildingLoader());

    await waitFor(() => {
      expect(result.current.current).not.toBeNull();
    });

    expect(result.current.current).toBe(mockScene);
    expect(mockScene.rotation.x).toBe(Math.PI / 2);
    expect(mockScene.scale.x).toBe(0.5);
    expect(mockScene.scale.y).toBe(0.5);
    expect(mockScene.scale.z).toBe(0.5);
    expect(mockScene.position.z).toBe(-10000);
  });

  it('should create fallback mesh on load error', async () => {
    mockLoad.mockImplementation(
      (
        _url: string,
        _onLoad: (gltf: { scene: THREE.Object3D }) => void,
        _onProgress?: (event: ProgressEvent) => void,
        onError?: (error: unknown) => void
      ) => {
        if (onError) {
          onError(new Error('Failed to load'));
        }
      }
    );

    const { result } = renderHook(() => useBuildingLoader());

    await waitFor(() => {
      expect(result.current.current).not.toBeNull();
    });

    const fallbackMesh = result.current.current as THREE.Mesh;
    expect(fallbackMesh.isMesh).toBe(true);
    expect(fallbackMesh.geometry).toBeInstanceOf(THREE.BoxGeometry);
    expect(fallbackMesh.material).toBeInstanceOf(THREE.MeshBasicMaterial);
    expect(
      (fallbackMesh.material as THREE.MeshBasicMaterial).color.getHex()
    ).toBe(0x666666);

    const geometry = fallbackMesh.geometry as THREE.BoxGeometry;
    const positionAttribute = geometry.getAttribute('position');
    const zValues = positionAttribute.array as Float32Array;

    const minZ = Math.min(...Array.from(zValues).filter((_, i) => i % 3 === 2));
    const maxZ = Math.max(...Array.from(zValues).filter((_, i) => i % 3 === 2));

    expect(maxZ).toBe(16.5);
    expect(minZ).toBe(13.5);
  });

  it('should call load only once on mount', () => {
    const { rerender } = renderHook(() => useBuildingLoader());

    rerender();

    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('should return null before model is loaded', () => {
    mockLoad.mockImplementation(() => {});

    const { result } = renderHook(() => useBuildingLoader());

    expect(result.current.current).toBeNull();
  });

  it('should handle progress callback', async () => {
    const mockProgress = { loaded: 50, total: 100 };

    mockLoad.mockImplementation(
      (
        _url: string,
        onLoad: (gltf: { scene: THREE.Object3D }) => void,
        onProgress?: (event: ProgressEvent) => void
      ) => {
        if (onProgress) {
          onProgress(mockProgress as ProgressEvent);
        }
        onLoad({ scene: mockScene });
      }
    );

    const { result } = renderHook(() => useBuildingLoader());

    await waitFor(() => {
      expect(result.current.current).not.toBeNull();
    });

    expect(result.current.current).toBe(mockScene);
  });

  it('should correctly calculate final rotation', async () => {
    const customScene = new THREE.Group();
    customScene.rotation.x = Math.PI / 4;
    customScene.scale.setScalar(2);
    customScene.position.z = 100;

    mockLoad.mockImplementation(
      (_url: string, onLoad: (gltf: { scene: THREE.Object3D }) => void) => {
        onLoad({ scene: customScene });
      }
    );

    const { result } = renderHook(() => useBuildingLoader());

    await waitFor(() => {
      expect(result.current.current).not.toBeNull();
    });

    expect(result.current.current).toBe(customScene);
    expect(customScene.rotation.x).toBe(-Math.PI / 2 + Math.PI);
    expect(customScene.scale.x).toBe(0.5);
    expect(customScene.position.z).toBe(-10000);
  });

  it('should create fallback with correct geometry dimensions', async () => {
    mockLoad.mockImplementation(
      (
        _url: string,
        _onLoad: (gltf: { scene: THREE.Object3D }) => void,
        _onProgress?: (event: ProgressEvent) => void,
        onError?: (error: unknown) => void
      ) => {
        if (onError) {
          onError(new Error('Load error'));
        }
      }
    );

    const { result } = renderHook(() => useBuildingLoader());

    await waitFor(() => {
      expect(result.current.current).not.toBeNull();
    });

    const fallbackMesh = result.current.current as THREE.Mesh;
    const geometry = fallbackMesh.geometry as THREE.BoxGeometry;

    expect(geometry.parameters.width).toBe(3);
    expect(geometry.parameters.height).toBe(30);
    expect(geometry.parameters.depth).toBe(3);
  });
});
