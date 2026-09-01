import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';
import { useBuildingMeshSync } from '../ui/useBuildingMeshSync';

const buildingModelRefMock = { current: null as THREE.Object3D | null };
const updateSceneGraphMock = vi.fn();

let storeState: {
  buildings: {
    id: string;
    x: number;
    y: number;
    z: number;
    scale?: number;
    rotation?: number;
  }[];
};

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

vi.mock('@editor/context', () => ({
  useHooks: () => ({
    updateSceneGraph: updateSceneGraphMock,
    buildingModelRef: buildingModelRefMock,
  }),
  useEditorRefs: () => ({
    sceneRef: sceneRefMock,
    buildingMeshesRef: buildingMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
}));

vi.mock('@right-panel/components/SceneTreePanel/funcs/sceneUtils', () => ({
  disposeMesh: vi.fn(),
}));

const sceneRefMock = { current: new THREE.Scene() };
const buildingMeshesRefMock = { current: [] as THREE.Object3D[] };
const transformControlsRefMock = {
  current: {
    attach: vi.fn(),
    detach: vi.fn(),
    object: null as THREE.Object3D | null,
  },
};

import { disposeMesh } from '@right-panel/components/SceneTreePanel/funcs/sceneUtils';

describe('useBuildingMeshSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    buildingModelRefMock.current = null;
    buildingMeshesRefMock.current = [];
    sceneRefMock.current = new THREE.Scene();
    storeState = { buildings: [] };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    transformControlsRefMock.current.detach.mockClear();
    (disposeMesh as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should not create meshes while model is not loaded', () => {
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    renderHook(() => useBuildingMeshSync());

    expect(buildingMeshesRefMock.current).toHaveLength(0);
  });

  it('should sync buildings when model is loaded', () => {
    buildingModelRefMock.current = new THREE.Group();
    storeState = {
      buildings: [
        { id: 'b1', x: 0, y: 0, z: 0, scale: 0.5, rotation: 0 },
        { id: 'b2', x: 10, y: 5, z: -5, scale: 1, rotation: Math.PI / 2 },
      ],
    };

    renderHook(() => useBuildingMeshSync());

    expect(buildingMeshesRefMock.current).toHaveLength(2);

    const ids = buildingMeshesRefMock.current.map((m) => m.userData.id);
    expect(ids).toEqual(['b1', 'b2']);

    expect(buildingMeshesRefMock.current[0].position.x).toBe(0);
    expect(buildingMeshesRefMock.current[0].position.y).toBe(0);
    expect(buildingMeshesRefMock.current[0].position.z).toBe(0);
    expect(buildingMeshesRefMock.current[0].scale.x).toBe(0.5);
    expect(buildingMeshesRefMock.current[0].rotation.y).toBe(0);

    expect(buildingMeshesRefMock.current[1].position.x).toBe(10);
    expect(buildingMeshesRefMock.current[1].position.y).toBe(5);
    expect(buildingMeshesRefMock.current[1].position.z).toBe(-5);
    expect(buildingMeshesRefMock.current[1].scale.x).toBe(1);
    expect(buildingMeshesRefMock.current[1].rotation.y).toBe(Math.PI / 2);

    expect(updateSceneGraphMock).toHaveBeenCalled();
  });

  it('should use default scale of 0.5 when not provided', () => {
    buildingModelRefMock.current = new THREE.Group();
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    renderHook(() => useBuildingMeshSync());

    expect(buildingMeshesRefMock.current).toHaveLength(1);
    expect(buildingMeshesRefMock.current[0].scale.x).toBe(0.5);
    expect(buildingMeshesRefMock.current[0].scale.y).toBe(0.5);
    expect(buildingMeshesRefMock.current[0].scale.z).toBe(0.5);
  });

  it('should remove buildings that no longer exist in store', () => {
    buildingModelRefMock.current = new THREE.Group();
    storeState = {
      buildings: [
        { id: 'b1', x: 0, y: 0, z: 0 },
        { id: 'b2', x: 10, y: 0, z: 0 },
      ],
    };

    const { rerender } = renderHook(() => useBuildingMeshSync());
    expect(buildingMeshesRefMock.current).toHaveLength(2);

    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    act(() => {
      rerender();
    });

    expect(buildingMeshesRefMock.current).toHaveLength(1);
    expect(buildingMeshesRefMock.current[0].userData.id).toBe('b1');
    expect(disposeMesh).toHaveBeenCalled();
  });

  it('should update existing building positions', () => {
    buildingModelRefMock.current = new THREE.Group();
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    const { rerender } = renderHook(() => useBuildingMeshSync());
    const mesh = buildingMeshesRefMock.current[0];

    storeState = {
      buildings: [
        { id: 'b1', x: 15, y: 20, z: 25, rotation: Math.PI, scale: 2 },
      ],
    };

    act(() => {
      rerender();
    });

    expect(buildingMeshesRefMock.current).toHaveLength(1);
    expect(mesh.position.x).toBe(15);
    expect(mesh.position.y).toBe(20);
    expect(mesh.position.z).toBe(25);
    expect(mesh.rotation.y).toBe(Math.PI);
    expect(mesh.scale.x).toBe(2);
  });

  it('should not update building position if attached to transform controls', () => {
    buildingModelRefMock.current = new THREE.Group();
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    const { rerender } = renderHook(() => useBuildingMeshSync());
    const mesh = buildingMeshesRefMock.current[0];
    transformControlsRefMock.current.object = mesh;

    storeState = {
      buildings: [{ id: 'b1', x: 50, y: 50, z: 50 }],
    };

    act(() => {
      rerender();
    });

    expect(mesh.position.x).toBe(0);
    expect(mesh.position.y).toBe(0);
    expect(mesh.position.z).toBe(0);
  });

  it('should detach transform controls when building is removed', () => {
    buildingModelRefMock.current = new THREE.Group();
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    const { rerender } = renderHook(() => useBuildingMeshSync());
    const mesh = buildingMeshesRefMock.current[0];
    transformControlsRefMock.current.object = mesh;

    storeState = { buildings: [] };

    act(() => {
      rerender();
    });

    expect(transformControlsRefMock.current.detach).toHaveBeenCalled();
  });

  it('should retry sync while model is loading', () => {
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    renderHook(() => useBuildingMeshSync());

    expect(buildingMeshesRefMock.current).toHaveLength(0);

    buildingModelRefMock.current = new THREE.Group();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(buildingMeshesRefMock.current).toHaveLength(1);
  });

  it('should stop retrying after 20 attempts', () => {
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    renderHook(() => useBuildingMeshSync());

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(buildingMeshesRefMock.current).toHaveLength(0);
  });

  it('should add meshes to scene', () => {
    buildingModelRefMock.current = new THREE.Group();
    const scene = sceneRefMock.current;
    const addSpy = vi.spyOn(scene, 'add');

    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    renderHook(() => useBuildingMeshSync());

    expect(addSpy).toHaveBeenCalled();
  });

  it('should return early when cancelled during retry', () => {
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    const { unmount } = renderHook(() => useBuildingMeshSync());

    expect(buildingMeshesRefMock.current).toHaveLength(0);

    unmount();

    buildingModelRefMock.current = new THREE.Group();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(buildingMeshesRefMock.current).toHaveLength(0);
    expect(updateSceneGraphMock).not.toHaveBeenCalled();
  });

  it('should not sync after unmount even if model becomes available', () => {
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    const { unmount } = renderHook(() => useBuildingMeshSync());

    unmount();

    buildingModelRefMock.current = new THREE.Group();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(buildingMeshesRefMock.current).toHaveLength(0);
    expect(updateSceneGraphMock).not.toHaveBeenCalled();
  });

  it('should cancel pending retry when unmounted during timeout', () => {
    storeState = {
      buildings: [{ id: 'b1', x: 0, y: 0, z: 0 }],
    };

    const { unmount } = renderHook(() => useBuildingMeshSync());

    act(() => {
      vi.advanceTimersByTime(50);
    });

    unmount();

    buildingModelRefMock.current = new THREE.Group();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(buildingMeshesRefMock.current).toHaveLength(0);
    expect(updateSceneGraphMock).not.toHaveBeenCalled();
  });
});
