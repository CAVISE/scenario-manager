import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { useSyncExternalStore } from 'react';

const {
  mockStoreState,
  mockSubscribe,
  mockUpdateSceneGraph,
  mockRefs,
  mockLoad,
} = vi.hoisted(() => ({
  mockStoreState: {
    pedestrians: [] as Array<{
      id: string;
      x: number;
      y: number;
      z?: number;
    }>,
  },

  mockSubscribe: vi.fn(),

  mockUpdateSceneGraph: vi.fn(),

  mockRefs: {
    sceneRef: {
      current: null as THREE.Scene | null,
    },

    pedestrianMeshesRef: {
      current: [] as THREE.Mesh[],
    },

    pedestrianObjsRef: {
      current: [] as THREE.Mesh[],
    },

    transformControlsRef: {
      current: null as {
        object?: THREE.Object3D;
      } | null,
    },
  },

  mockLoad: vi.fn(),
}));

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (state: typeof mockStoreState) => unknown) =>
      useSyncExternalStore(mockSubscribe, () => selector(mockStoreState)),
    {
      getState: vi.fn(() => mockStoreState),
      subscribe: mockSubscribe,
    }
  ),
}));

vi.mock('@editor/context', () => ({
  useHooks: () => ({
    updateSceneGraph: mockUpdateSceneGraph,
  }),

  useEditorRefs: () => mockRefs,
}));

vi.mock('three-stdlib', async () => {
  const actual =
    await vi.importActual<typeof import('three-stdlib')>('three-stdlib');

  class MockGLTFLoader {
    load = mockLoad;
  }

  return {
    ...actual,
    GLTFLoader: MockGLTFLoader,
  };
});

import { usePedestrianMeshSync } from '../ui/usePedestrianMeshSync';

function createPedestrianModel(): THREE.Object3D {
  const model = new THREE.Group();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshBasicMaterial()
  );

  model.add(mesh);

  return model;
}

function setPedestrians(
  pedestrians: Array<{
    id: string;
    x: number;
    y: number;
    z?: number;
  }>
): void {
  mockStoreState.pedestrians = pedestrians;
}

function getScenePedestrians(scene: THREE.Scene): THREE.Object3D[] {
  return scene.children.filter((child) => child.userData.type === 'pedestrian');
}

describe('usePedestrianMeshSync', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    vi.clearAllMocks();

    scene = new THREE.Scene();

    mockRefs.sceneRef.current = scene;
    mockRefs.pedestrianMeshesRef.current = [];
    mockRefs.pedestrianObjsRef.current = [];
    mockRefs.transformControlsRef.current = null;

    mockStoreState.pedestrians = [];

    mockLoad.mockImplementation(
      (_url: string, onLoad: (gltf: { scene: THREE.Object3D }) => void) => {
        onLoad({
          scene: createPedestrianModel(),
        });
      }
    );
  });

  describe('initial synchronization', () => {
    it('loads the pedestrian model and creates a pedestrian from the store', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 10,
          y: 20,
          z: 5,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockLoad).toHaveBeenCalledTimes(1);
      });

      expect(mockLoad).toHaveBeenCalledWith(
        '/man_in_suit.glb',
        expect.any(Function),
        undefined,
        expect.any(Function)
      );

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.userData.type).toBe('pedestrian');
      expect(pedestrian.userData.id).toBe('ped-1');

      expect(pedestrian.position.x).toBe(10);
      expect(pedestrian.position.y).toBe(20);
    });

    it('creates multiple pedestrians', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
        {
          id: 'ped-2',
          x: 10,
          y: 20,
          z: 30,
        },
        {
          id: 'ped-3',
          x: -5,
          y: -10,
          z: 0,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(3);
      });

      const pedestrians = getScenePedestrians(scene);

      expect(pedestrians.map((pedestrian) => pedestrian.userData.id)).toEqual([
        'ped-1',
        'ped-2',
        'ped-3',
      ]);
    });

    it('calls updateSceneGraph after synchronization', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });
    });
  });

  describe('duplicate prevention', () => {
    it('does not create a duplicate for an existing pedestrian', async () => {
      const existingPedestrian = new THREE.Mesh();

      existingPedestrian.userData = {
        type: 'pedestrian',
        id: 'ped-1',
      };

      scene.add(existingPedestrian);

      mockRefs.pedestrianMeshesRef.current = [existingPedestrian];

      mockRefs.pedestrianObjsRef.current = [existingPedestrian];

      setPedestrians([
        {
          id: 'ped-1',
          x: 10,
          y: 20,
          z: 30,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(getScenePedestrians(scene)).toHaveLength(1);

      expect(mockRefs.pedestrianMeshesRef.current).toHaveLength(1);

      expect(mockRefs.pedestrianObjsRef.current).toHaveLength(1);
    });
  });

  describe('removing pedestrians', () => {
    it('removes a pedestrian that no longer exists in the store', async () => {
      const pedestrian = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      pedestrian.userData = {
        type: 'pedestrian',
        id: 'ped-1',
      };

      scene.add(pedestrian);

      mockRefs.pedestrianMeshesRef.current = [pedestrian];

      mockRefs.pedestrianObjsRef.current = [pedestrian];

      setPedestrians([]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockRefs.pedestrianMeshesRef.current).toHaveLength(0);
      });

      expect(scene.children).not.toContain(pedestrian);

      expect(mockRefs.pedestrianObjsRef.current).toHaveLength(0);
    });

    it('keeps pedestrians that still exist in the store', async () => {
      const pedestrian = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      pedestrian.userData = {
        type: 'pedestrian',
        id: 'ped-1',
      };

      scene.add(pedestrian);

      mockRefs.pedestrianMeshesRef.current = [pedestrian];

      mockRefs.pedestrianObjsRef.current = [pedestrian];

      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(scene.children).toContain(pedestrian);

      expect(mockRefs.pedestrianMeshesRef.current).toContain(pedestrian);
    });
  });

  describe('TransformControls', () => {
    it('does not remove a pedestrian attached to TransformControls', async () => {
      const pedestrian = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      pedestrian.userData = {
        type: 'pedestrian',
        id: 'ped-1',
      };

      scene.add(pedestrian);

      mockRefs.pedestrianMeshesRef.current = [pedestrian];

      mockRefs.pedestrianObjsRef.current = [pedestrian];

      mockRefs.transformControlsRef.current = {
        object: pedestrian,
      };

      setPedestrians([]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(scene.children).toContain(pedestrian);

      expect(mockRefs.pedestrianMeshesRef.current).toContain(pedestrian);
    });

    it('keeps a parent pedestrian when a child is attached to TransformControls', async () => {
      const pedestrian = new THREE.Group();

      const child = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial()
      );

      pedestrian.userData = {
        type: 'pedestrian',
        id: 'ped-1',
      };

      child.userData = {
        type: 'pedestrian',
        id: 'ped-1',
      };

      pedestrian.add(child);
      scene.add(pedestrian);

      mockRefs.pedestrianMeshesRef.current = [
        pedestrian as unknown as THREE.Mesh,
      ];

      mockRefs.pedestrianObjsRef.current = [
        pedestrian as unknown as THREE.Mesh,
      ];

      mockRefs.transformControlsRef.current = {
        object: child,
      };

      setPedestrians([]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(scene.children).toContain(pedestrian);

      expect(mockRefs.pedestrianMeshesRef.current).toContain(
        pedestrian as unknown as THREE.Mesh
      );
    });
  });

  describe('model configuration', () => {
    it('applies scale 0.03 to the pedestrian', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.scale.x).toBeCloseTo(0.03);
      expect(pedestrian.scale.y).toBeCloseTo(0.03);
      expect(pedestrian.scale.z).toBeCloseTo(0.03);
    });

    it('rotates the pedestrian around X axis', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.rotation.x).toBeCloseTo(Math.PI / 2);
    });

    it('stores pedestrian metadata on model and children', async () => {
      setPedestrians([
        {
          id: 'ped-42',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.userData.type).toBe('pedestrian');

      expect(pedestrian.userData.id).toBe('ped-42');

      pedestrian.traverse((child) => {
        expect(child.userData.type).toBe('pedestrian');

        expect(child.userData.id).toBe('ped-42');
      });
    });

    it('adds the pedestrian to both refs', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockRefs.pedestrianMeshesRef.current).toHaveLength(1);
      });

      expect(mockRefs.pedestrianObjsRef.current).toHaveLength(1);

      expect(mockRefs.pedestrianMeshesRef.current[0]).toBe(
        mockRefs.pedestrianObjsRef.current[0]
      );
    });
  });

  describe('store subscription', () => {
    it('subscribes to the Zustand store', () => {
      renderHook(() => usePedestrianMeshSync());

      expect(mockSubscribe).toHaveBeenCalledTimes(1);

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('synchronizes pedestrians after a store change', async () => {
      setPedestrians([]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      const subscriber = mockSubscribe.mock.calls[0][0] as () => void;

      setPedestrians([
        {
          id: 'ped-new',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      act(() => {
        subscriber();
      });

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.userData.id).toBe('ped-new');

      expect(pedestrian.position.x).toBe(100);

      expect(pedestrian.position.y).toBe(200);
    });

    it('unsubscribes when the hook is unmounted', () => {
      const unsubscribe = vi.fn();

      mockSubscribe.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => usePedestrianMeshSync());

      unmount();

      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('scene initialization', () => {
    it('does not synchronize when scene is unavailable', () => {
      mockRefs.sceneRef.current = null;

      setPedestrians([
        {
          id: 'ped-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      expect(mockLoad).not.toHaveBeenCalled();

      expect(mockUpdateSceneGraph).not.toHaveBeenCalled();
    });
  });

  describe('position handling', () => {
    it('uses zero as z when pedestrian z is undefined', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: 10,
          y: 20,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.position.z).toBeCloseTo(
        pedestrian.userData.offsetZ + 0.05
      );
    });

    it('preserves x and y coordinates from the store', async () => {
      setPedestrians([
        {
          id: 'ped-1',
          x: -123.5,
          y: 456.75,
          z: 10,
        },
      ]);

      renderHook(() => usePedestrianMeshSync());

      await waitFor(() => {
        expect(getScenePedestrians(scene)).toHaveLength(1);
      });

      const pedestrian = getScenePedestrians(scene)[0];

      expect(pedestrian.position.x).toBe(-123.5);

      expect(pedestrian.position.y).toBe(456.75);
    });
  });
});
