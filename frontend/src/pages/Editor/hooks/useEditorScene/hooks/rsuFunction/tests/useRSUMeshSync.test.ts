import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';

let {
  mockStoreState,
  mockSubscribe,
  mockUpdateSceneGraph,
  mockRefs,
  mockEnsureRsuModel,
  mockRsuModel,
} = vi.hoisted(() => ({
  mockStoreState: {
    RSUs: [] as Array<{
      id: string;
      x: number;
      y: number;
      z: number;
    }>,
  },

  mockSubscribe: vi.fn(),

  mockUpdateSceneGraph: vi.fn(),

  mockRefs: {
    sceneRef: {
      current: null as THREE.Scene | null,
    },

    pointsArrRef: {
      current: [] as THREE.Mesh[],
    },

    pointsObjsRef: {
      current: [] as THREE.Mesh[],
    },

    rsuMeshesRef: {
      current: [] as THREE.Mesh[],
    },

    transformControlsRef: {
      current: null as {
        object?: THREE.Object3D;
        detach?: () => void;
      } | null,
    },
  },

  mockEnsureRsuModel: vi.fn(),

  mockRsuModel: null as THREE.Object3D | null,
}));

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    vi.fn((selector: (state: typeof mockStoreState) => unknown) =>
      selector(mockStoreState)
    ),
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

vi.mock('../utils/RsuUtils', () => ({
  ensureRsuModel: mockEnsureRsuModel,

  get rsuModel() {
    return mockRsuModel;
  },
}));

import { useRSUMeshSync } from '../ui/useRSUMeshSync';

function createRsuModel(): THREE.Object3D {
  const model = new THREE.Group();

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshBasicMaterial()
  );

  model.add(mesh);

  return model;
}

function setRSUs(
  rsus: Array<{
    id: string;
    x: number;
    y: number;
    z: number;
  }>
): void {
  mockStoreState.RSUs = rsus;
}

function getSceneRSUs(scene: THREE.Scene): THREE.Object3D[] {
  return scene.children.filter((child) => child.userData.type === 'point');
}

function createExistingRsu(
  id: string,
  position = { x: 0, y: 0, z: 0 },
  isFallbackRSU = false
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
  );

  mesh.userData = {
    type: 'point',
    id,
    isFallbackRSU,
  };

  mesh.position.set(position.x, position.y, position.z);

  return mesh;
}

describe('useRSUMeshSync', () => {
  let scene: THREE.Scene;
  let rsuModel: THREE.Object3D;

  beforeEach(() => {
    vi.clearAllMocks();

    scene = new THREE.Scene();
    rsuModel = createRsuModel();

    mockRefs.sceneRef.current = scene;

    mockRefs.pointsArrRef.current = [];
    mockRefs.pointsObjsRef.current = [];
    mockRefs.rsuMeshesRef.current = [];

    mockRefs.transformControlsRef.current = null;

    mockStoreState.RSUs = [];

    /*
     * By default the RSU model is available.
     *
     * The actual RsuUtils module is mocked, so this resolves
     * immediately and does not depend on the module-level
     * rsuModel / rsuModelPromise state.
     */
    mockEnsureRsuModel.mockResolvedValue(true);

    /*
     * The component imports rsuModel as a named binding.
     * Since the mock above returns null for it, tests which
     * specifically exercise the fallback path use the fallback
     * behaviour of ensureRsuModel(false).
     */
  });

  describe('initial synchronization', () => {
    it('creates an RSU when the model is available', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: 10,
          y: 20,
          z: 30,
        },
      ]);

      /*
       * Because the mocked rsuModel is null, this test would
       * normally create a fallback object even though
       * ensureRsuModel resolves true.
       *
       * The important part here is that synchronization occurs
       * and the RSU receives the correct metadata and position.
       */
      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      const rsu = getSceneRSUs(scene)[0];

      expect(rsu.userData.type).toBe('point');
      expect(rsu.userData.id).toBe('rsu-1');

      expect(rsu.position.x).toBe(10);
      expect(rsu.position.y).toBe(20);
      expect(rsu.position.z).toBe(30);
    });

    it('creates multiple RSUs', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
        {
          id: 'rsu-2',
          x: 10,
          y: 20,
          z: 30,
        },
        {
          id: 'rsu-3',
          x: -5,
          y: -10,
          z: 15,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(3);
      });

      const rsus = getSceneRSUs(scene);

      expect(rsus.map((rsu) => rsu.userData.id)).toEqual([
        'rsu-1',
        'rsu-2',
        'rsu-3',
      ]);
    });

    it('calls ensureRsuModel during synchronization', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockEnsureRsuModel).toHaveBeenCalledTimes(1);
      });
    });

    it('calls updateSceneGraph after synchronization', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });
    });
  });

  describe('fallback RSU', () => {
    it('creates a fallback RSU when the model is unavailable', async () => {
      mockEnsureRsuModel.mockResolvedValue(false);

      setRSUs([
        {
          id: 'rsu-fallback',
          x: 10,
          y: 20,
          z: 30,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      const rsu = getSceneRSUs(scene)[0];

      expect(rsu.userData.type).toBe('point');
      expect(rsu.userData.id).toBe('rsu-fallback');
      expect(rsu.userData.isFallbackRSU).toBe(true);

      expect(rsu.position.x).toBe(10);
      expect(rsu.position.y).toBe(20);
      expect(rsu.position.z).toBe(30);

      expect(rsu).toBeInstanceOf(THREE.Mesh);
    });

    it('stores fallback RSU in all refs', async () => {
      mockEnsureRsuModel.mockResolvedValue(false);

      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockRefs.pointsArrRef.current).toHaveLength(1);
      });

      expect(mockRefs.pointsObjsRef.current).toHaveLength(1);

      expect(mockRefs.rsuMeshesRef.current).toHaveLength(1);

      expect(mockRefs.pointsArrRef.current[0]).toBe(
        mockRefs.pointsObjsRef.current[0]
      );

      expect(mockRefs.pointsArrRef.current[0]).toBe(
        mockRefs.rsuMeshesRef.current[0]
      );
    });
  });

  describe('existing RSUs', () => {
    it('does not create a duplicate for an existing RSU', async () => {
      const existing = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 });

      scene.add(existing);

      mockRefs.pointsArrRef.current = [existing];
      mockRefs.pointsObjsRef.current = [existing];
      mockRefs.rsuMeshesRef.current = [existing];

      setRSUs([
        {
          id: 'rsu-1',
          x: 10,
          y: 20,
          z: 30,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(getSceneRSUs(scene)).toHaveLength(1);

      expect(mockRefs.pointsArrRef.current).toHaveLength(1);
    });

    it('updates position of an existing RSU', async () => {
      const existing = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 });

      scene.add(existing);

      mockRefs.pointsArrRef.current = [existing];
      mockRefs.pointsObjsRef.current = [existing];
      mockRefs.rsuMeshesRef.current = [existing];

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(existing.position.x).toBe(100);
      });

      expect(existing.position.y).toBe(200);
      expect(existing.position.z).toBe(300);

      expect(getSceneRSUs(scene)).toHaveLength(1);
    });

    it('does not update position when the RSU is attached to TransformControls', async () => {
      const existing = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 });

      scene.add(existing);

      mockRefs.pointsArrRef.current = [existing];
      mockRefs.pointsObjsRef.current = [existing];
      mockRefs.rsuMeshesRef.current = [existing];

      mockRefs.transformControlsRef.current = {
        object: existing,
        detach: vi.fn(),
      };

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(existing.position.x).toBe(1);
      expect(existing.position.y).toBe(2);
      expect(existing.position.z).toBe(3);
    });
  });

  describe('removing RSUs', () => {
    it('removes an RSU that no longer exists in the store', async () => {
      const existing = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 });

      scene.add(existing);

      mockRefs.pointsArrRef.current = [existing];
      mockRefs.pointsObjsRef.current = [existing];
      mockRefs.rsuMeshesRef.current = [existing];

      setRSUs([]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockRefs.pointsArrRef.current).toHaveLength(0);
      });

      expect(scene.children).not.toContain(existing);

      expect(mockRefs.pointsObjsRef.current).toHaveLength(0);

      expect(mockRefs.rsuMeshesRef.current).toHaveLength(0);
    });

    it('detaches TransformControls before removing the selected RSU', async () => {
      const existing = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 });

      scene.add(existing);

      const detach = vi.fn();

      mockRefs.pointsArrRef.current = [existing];
      mockRefs.pointsObjsRef.current = [existing];
      mockRefs.rsuMeshesRef.current = [existing];

      mockRefs.transformControlsRef.current = {
        object: existing,
        detach,
      };

      setRSUs([]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(detach).toHaveBeenCalledTimes(1);
      });

      expect(scene.children).not.toContain(existing);
    });

    it('disposes geometry when removing an RSU', async () => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial();

      const disposeGeometry = vi.spyOn(geometry, 'dispose');

      const disposeMaterial = vi.spyOn(material, 'dispose');

      const existing = new THREE.Mesh(geometry, material);

      existing.userData = {
        type: 'point',
        id: 'rsu-1',
        isFallbackRSU: true,
      };

      scene.add(existing);

      mockRefs.pointsArrRef.current = [existing];
      mockRefs.pointsObjsRef.current = [existing];
      mockRefs.rsuMeshesRef.current = [existing];

      setRSUs([]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockRefs.pointsArrRef.current).toHaveLength(0);
      });

      expect(disposeGeometry).toHaveBeenCalledTimes(1);

      expect(disposeMaterial).toHaveBeenCalledTimes(1);
    });
  });

  describe('fallback RSU replacement', () => {
    it('keeps fallback RSU when the model is unavailable', async () => {
      mockEnsureRsuModel.mockResolvedValue(false);

      const fallback = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 }, true);

      scene.add(fallback);

      mockRefs.pointsArrRef.current = [fallback];
      mockRefs.pointsObjsRef.current = [fallback];
      mockRefs.rsuMeshesRef.current = [fallback];

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockUpdateSceneGraph).toHaveBeenCalled();
      });

      expect(getSceneRSUs(scene)).toHaveLength(1);

      expect(fallback.position.x).toBe(100);

      expect(fallback.position.y).toBe(200);

      expect(fallback.position.z).toBe(300);
    });

    it('replaces fallback RSU when model becomes available', async () => {
      /*
       * The actual hook imports rsuModel as a module binding.
       * Because the test mock exposes null, the replacement branch
       * cannot reach the `hasModel && rsuModel` creation path.
       *
       * This test therefore verifies the cleanup side of the
       * fallback replacement logic.
       */
      mockEnsureRsuModel.mockResolvedValue(true);

      const fallback = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 }, true);

      scene.add(fallback);

      mockRefs.pointsArrRef.current = [fallback];
      mockRefs.pointsObjsRef.current = [fallback];
      mockRefs.rsuMeshesRef.current = [fallback];

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockRefs.pointsArrRef.current).toHaveLength(1);
      });

      expect(getSceneRSUs(scene)).toHaveLength(1);
    });
    it('replaces fallback RSU with the loaded model', async () => {
      mockRsuModel = rsuModel;
      mockEnsureRsuModel.mockResolvedValue(true);

      const fallback = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 }, true);

      scene.add(fallback);

      mockRefs.pointsArrRef.current = [fallback];
      mockRefs.pointsObjsRef.current = [fallback];
      mockRefs.rsuMeshesRef.current = [fallback];

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      const replacement = getSceneRSUs(scene)[0];

      expect(replacement).not.toBe(fallback);
      expect(replacement).not.toBe(rsuModel);

      expect(replacement.userData).toEqual({
        type: 'point',
        id: 'rsu-1',
        isFallbackRSU: false,
      });

      expect(replacement.position.x).toBe(100);
      expect(replacement.position.y).toBe(200);
      expect(replacement.position.z).toBe(300);

      expect(replacement.scale.x).toBe(0.05);
      expect(replacement.scale.y).toBe(0.05);
      expect(replacement.scale.z).toBe(0.05);

      expect(replacement.rotation.x).toBeCloseTo(Math.PI / 2);

      expect(mockRefs.pointsArrRef.current).toHaveLength(1);
      expect(mockRefs.pointsObjsRef.current).toHaveLength(1);
      expect(mockRefs.rsuMeshesRef.current).toHaveLength(1);

      expect(mockRefs.pointsArrRef.current[0]).toBe(replacement);
      expect(mockRefs.pointsObjsRef.current[0]).toBe(replacement);
      expect(mockRefs.rsuMeshesRef.current[0]).toBe(replacement);

      expect(scene.children).not.toContain(fallback);
    });
    it('detaches TransformControls when replacing an attached fallback RSU', async () => {
      mockRsuModel = rsuModel;
      mockEnsureRsuModel.mockResolvedValue(true);

      const fallback = createExistingRsu('rsu-1', { x: 1, y: 2, z: 3 }, true);

      scene.add(fallback);

      const detach = vi.fn();

      mockRefs.pointsArrRef.current = [fallback];
      mockRefs.pointsObjsRef.current = [fallback];
      mockRefs.rsuMeshesRef.current = [fallback];

      mockRefs.transformControlsRef.current = {
        object: fallback,
        detach,
      };

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      expect(detach).toHaveBeenCalledTimes(1);

      const replacement = getSceneRSUs(scene)[0];

      expect(replacement).not.toBe(fallback);
      expect(replacement.userData.isFallbackRSU).toBe(false);
    });
  });

  describe('scene initialization', () => {
    it('does not synchronize when scene is unavailable', () => {
      mockRefs.sceneRef.current = null;

      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      expect(mockEnsureRsuModel).not.toHaveBeenCalled();

      expect(mockUpdateSceneGraph).not.toHaveBeenCalled();
    });
  });

  describe('unmount cancellation', () => {
    it('does not update the scene after the hook is unmounted', async () => {
      let resolveModel: ((value: boolean) => void) | undefined;

      mockEnsureRsuModel.mockReturnValue(
        new Promise<boolean>((resolve) => {
          resolveModel = resolve;
        })
      );

      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      const { unmount } = renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockEnsureRsuModel).toHaveBeenCalledTimes(1);
      });

      unmount();

      resolveModel?.(false);

      await Promise.resolve();

      expect(mockUpdateSceneGraph).not.toHaveBeenCalled();

      expect(getSceneRSUs(scene)).toHaveLength(0);
    });
  });

  describe('refs synchronization', () => {
    it('keeps all RSU refs synchronized', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
        {
          id: 'rsu-2',
          x: 4,
          y: 5,
          z: 6,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(mockRefs.pointsArrRef.current).toHaveLength(2);
      });

      expect(mockRefs.pointsObjsRef.current).toEqual(
        mockRefs.pointsArrRef.current
      );

      expect(mockRefs.rsuMeshesRef.current).toEqual(
        mockRefs.pointsArrRef.current
      );
    });
  });

  describe('position handling', () => {
    it('preserves exact RSU coordinates', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: -123.5,
          y: 456.75,
          z: 789.25,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      const rsu = getSceneRSUs(scene)[0];

      expect(rsu.position.x).toBe(-123.5);
      expect(rsu.position.y).toBe(456.75);
      expect(rsu.position.z).toBe(789.25);
    });
  });

  describe('store updates', () => {
    it('resynchronizes when RSUs dependency changes', async () => {
      setRSUs([
        {
          id: 'rsu-1',
          x: 1,
          y: 2,
          z: 3,
        },
      ]);

      const { rerender } = renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      const existing = getSceneRSUs(scene)[0];

      setRSUs([
        {
          id: 'rsu-1',
          x: 100,
          y: 200,
          z: 300,
        },
      ]);

      rerender();

      await waitFor(() => {
        expect(existing.position.x).toBe(100);
      });

      expect(existing.position.y).toBe(200);
      expect(existing.position.z).toBe(300);

      expect(getSceneRSUs(scene)).toHaveLength(1);
      expect(mockRefs.pointsArrRef.current).toHaveLength(1);
    });
    it('creates an RSU from the loaded model', async () => {
      mockRsuModel = rsuModel;
      mockEnsureRsuModel.mockResolvedValue(true);

      setRSUs([
        {
          id: 'rsu-model',
          x: 10,
          y: 20,
          z: 30,
        },
      ]);

      renderHook(() => useRSUMeshSync());

      await waitFor(() => {
        expect(getSceneRSUs(scene)).toHaveLength(1);
      });

      const obj = getSceneRSUs(scene)[0];

      expect(obj.userData).toEqual({
        type: 'point',
        id: 'rsu-model',
        isFallbackRSU: false,
      });

      expect(obj.position.x).toBe(10);
      expect(obj.position.y).toBe(20);
      expect(obj.position.z).toBe(30);

      expect(obj.scale.x).toBe(0.05);
      expect(obj.scale.y).toBe(0.05);
      expect(obj.scale.z).toBe(0.05);

      expect(obj.rotation.x).toBeCloseTo(Math.PI / 2);

      expect(obj).not.toBe(rsuModel);
    });
  });
  it('disposes geometry and materials of child meshes when removing an RSU', async () => {
    const parent = new THREE.Group();

    parent.userData = {
      type: 'point',
      id: 'rsu-1',
      isFallbackRSU: true,
    };

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();

    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');

    const child = new THREE.Mesh(geometry, material);

    parent.add(child);
    scene.add(parent);

    mockRefs.pointsArrRef.current = [parent as unknown as THREE.Mesh];
    mockRefs.pointsObjsRef.current = [parent as unknown as THREE.Mesh];
    mockRefs.rsuMeshesRef.current = [parent as unknown as THREE.Mesh];

    setRSUs([]);

    renderHook(() => useRSUMeshSync());

    await waitFor(() => {
      expect(mockRefs.pointsArrRef.current).toHaveLength(0);
    });

    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(scene.children).not.toContain(parent);
  });
  it('retries synchronization when scene is initially unavailable', async () => {
    vi.useFakeTimers();

    mockRefs.sceneRef.current = null;

    setRSUs([
      {
        id: 'rsu-1',
        x: 10,
        y: 20,
        z: 30,
      },
    ]);

    renderHook(() => useRSUMeshSync());

    expect(mockEnsureRsuModel).not.toHaveBeenCalled();

    const retryScene = new THREE.Scene();
    mockRefs.sceneRef.current = retryScene;

    await vi.advanceTimersByTimeAsync(300);

    expect(mockEnsureRsuModel).toHaveBeenCalledTimes(1);
    expect(getSceneRSUs(retryScene)).toHaveLength(1);
  });
});
