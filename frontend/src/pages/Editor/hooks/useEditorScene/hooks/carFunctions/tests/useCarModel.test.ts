import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as THREE from 'three';
import { useCarModel } from '../ui/useCarModel';

const mockLoad = vi.fn();

vi.mock('three-stdlib', () => ({
  OBJLoader: vi.fn().mockImplementation(function () {
    return {
      load: mockLoad,
    };
  }),
}));

describe('useCarModel', () => {
  let mockObj: THREE.Group;

  beforeEach(() => {
    mockLoad.mockReset();
    mockObj = new THREE.Group();
  });

  it('should load model and set rotation.x to PI/2', async () => {
    mockLoad.mockImplementation(
      (url: string, onLoad: (obj: THREE.Object3D) => void) => {
        expect(url).toBe('/Car.obj');
        onLoad(mockObj);
      }
    );

    const { result } = renderHook(() => useCarModel());

    await waitFor(() => {
      expect(result.current.modelLoaded).toBe(true);
    });

    expect(result.current.carModelRef.current).toBe(mockObj);
    expect(mockObj.rotation.x).toBe(Math.PI / 2);
  });

  it('should call load only once on mount', () => {
    const { rerender } = renderHook(() => useCarModel());

    rerender();

    expect(mockLoad).toHaveBeenCalledTimes(1);
  });

  it('should handle load error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mockError = new Error('Failed to load');

    mockLoad.mockImplementation(
      (
        _url: string,
        _onLoad: (obj: THREE.Object3D) => void,
        _onProgress?: (event: ProgressEvent) => void,
        onError?: (error: unknown) => void
      ) => {
        if (onError) {
          onError(mockError);
        }
      }
    );

    renderHook(() => useCarModel());

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'OBJ load error:',
        mockError
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle progress callback', async () => {
    const mockProgress = { loaded: 100, total: 200 };

    mockLoad.mockImplementation(
      (
        _url: string,
        onLoad: (obj: THREE.Object3D) => void,
        onProgress?: (event: ProgressEvent) => void
      ) => {
        if (onProgress) {
          onProgress(mockProgress as ProgressEvent);
        }
        onLoad(mockObj);
      }
    );

    const { result } = renderHook(() => useCarModel());

    await waitFor(() => {
      expect(result.current.modelLoaded).toBe(true);
    });

    expect(result.current.carModelRef.current).toBe(mockObj);
  });

  it('should return null for carModelRef before load', () => {
    mockLoad.mockImplementation(() => {});

    const { result } = renderHook(() => useCarModel());

    expect(result.current.carModelRef.current).toBeNull();
    expect(result.current.modelLoaded).toBe(false);
  });

  it('should work with different model types', async () => {
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );

    mockLoad.mockImplementation(
      (_url: string, onLoad: (obj: THREE.Object3D) => void) => {
        onLoad(mockMesh);
      }
    );

    const { result } = renderHook(() => useCarModel());

    await waitFor(() => {
      expect(result.current.modelLoaded).toBe(true);
    });

    expect(result.current.carModelRef.current).toBe(mockMesh);
    expect(mockMesh.rotation.x).toBe(Math.PI / 2);
  });
});
