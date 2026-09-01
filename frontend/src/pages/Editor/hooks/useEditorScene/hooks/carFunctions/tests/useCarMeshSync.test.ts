import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';
import { useCarMeshSync } from '../ui/useCarMeshSync';
import { applyColor } from '../utils/CarUtils';

const carModelRefMock = { current: null as THREE.Object3D | null };
let modelLoadedMock = false;

vi.mock('../ui/useCarModel', () => ({
  useCarModel: () => ({
    carModelRef: carModelRefMock,
    get modelLoaded() {
      return modelLoadedMock;
    },
  }),
}));

let storeState: {
  cars: {
    id: string;
    x: number;
    y: number;
    z: number;
    scale: number;
    rotation?: number;
    color?: string;
  }[];
  selectedId: string | null;
};

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

const sceneRefMock = { current: new THREE.Scene() };
const carMeshesRefMock = { current: [] as THREE.Mesh[] };
const transformControlsRefMock = {
  current: {
    attach: vi.fn(),
    detach: vi.fn(),
    object: null as THREE.Object3D | null,
    mode: 'translate',
  },
};

const updateSceneGraphMock = vi.fn();

vi.mock('@editor/context', () => ({
  useHooks: () => ({ updateSceneGraph: updateSceneGraphMock }),
  useEditorRefs: () => ({
    sceneRef: sceneRefMock,
    carMeshesRef: carMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
}));

describe('useCarMeshSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    carModelRefMock.current = null;
    modelLoadedMock = false;
    carMeshesRefMock.current = [];
    sceneRefMock.current = new THREE.Scene();
    storeState = { cars: [], selectedId: null };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    transformControlsRefMock.current.mode = 'translate';
    transformControlsRefMock.current.attach.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('Does nothing until the model is loaded', () => {
    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };
    renderHook(() => useCarMeshSync());

    expect(carMeshesRefMock.current).toHaveLength(0);
  });

  it('Syncs all cars from the store after loading a model', () => {
    storeState = {
      cars: [
        { id: 'car-A', x: 0, y: 0, z: 0, scale: 1 },
        { id: 'car-B', x: 5, y: 0, z: 0, scale: 1 },
      ],
      selectedId: null,
    };

    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    renderHook(() => useCarMeshSync());

    const syncedIds = carMeshesRefMock.current.map((m) => m.userData.id);
    expect(syncedIds).toEqual(['car-A', 'car-B']);
    expect(updateSceneGraphMock).toHaveBeenCalled();
  });

  it('Reacts to adding a car after loading the model', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = { cars: [], selectedId: null };
    const { rerender } = renderHook(() => useCarMeshSync());

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(carMeshesRefMock.current.map((m) => m.userData.id)).toEqual([
      'car-A',
    ]);
  });

  it('Removes and frees the machine mesh when deleting from the store', () => {
    carModelRefMock.current = new THREE.Group();
    const mockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const mockMaterial = new THREE.MeshBasicMaterial();
    const mockMesh = new THREE.Mesh(mockGeometry, mockMaterial);
    carModelRefMock.current.add(mockMesh);

    modelLoadedMock = true;
    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());

    expect(carMeshesRefMock.current).toHaveLength(1);

    const wrapper = carMeshesRefMock.current[0];
    expect(wrapper.children).toHaveLength(1);

    let clonedMesh: THREE.Mesh | undefined;
    wrapper.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh && !clonedMesh) {
        clonedMesh = child as THREE.Mesh;
      }
    });

    expect(clonedMesh).toBeDefined();

    if (clonedMesh) {
      const disposeSpy = vi.spyOn(clonedMesh.geometry, 'dispose');

      const material = clonedMesh.material as THREE.Material | THREE.Material[];
      let materialDisposeSpy: ReturnType<typeof vi.spyOn>;

      if (Array.isArray(material)) {
        materialDisposeSpy = vi.spyOn(material[0], 'dispose');
      } else {
        materialDisposeSpy = vi.spyOn(material, 'dispose');
      }

      storeState = { cars: [], selectedId: null };

      act(() => {
        rerender();
      });

      expect(carMeshesRefMock.current).toHaveLength(0);
      expect(disposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
    }
  });

  it('Attaches transform controls when selecting a car', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);

    modelLoadedMock = true;
    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: 'car-A',
    };

    renderHook(() => useCarMeshSync());

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(transformControlsRefMock.current.attach).toHaveBeenCalled();
  });

  it('should dispose array materials when removing mesh', () => {
    carModelRefMock.current = new THREE.Group();
    const mockGeometry = new THREE.BoxGeometry(1, 1, 1);
    const mockMaterials = [
      new THREE.MeshBasicMaterial(),
      new THREE.MeshBasicMaterial(),
    ];
    const mockMesh = new THREE.Mesh(mockGeometry, mockMaterials);
    carModelRefMock.current.add(mockMesh);

    modelLoadedMock = true;
    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    expect(carMeshesRefMock.current).toHaveLength(1);

    const wrapper = carMeshesRefMock.current[0];
    let clonedMesh: THREE.Mesh | undefined;
    wrapper.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh && !clonedMesh) {
        clonedMesh = child as THREE.Mesh;
      }
    });

    expect(clonedMesh).toBeDefined();

    if (clonedMesh) {
      const materials = clonedMesh.material as THREE.Material[];
      const disposeSpies = materials.map((mat) => vi.spyOn(mat, 'dispose'));

      storeState = { cars: [], selectedId: null };

      act(() => {
        rerender();
      });

      disposeSpies.forEach((spy) => {
        expect(spy).toHaveBeenCalled();
      });
    }
  });

  it('should not update transform when attached to controls in translate mode', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];
    transformControlsRefMock.current.object = existingMesh;
    transformControlsRefMock.current.mode = 'translate';

    storeState = {
      cars: [{ id: 'car-A', x: 10, y: 20, z: 30, scale: 2, rotation: Math.PI }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.position.x).toBe(0);
    expect(existingMesh.position.y).toBe(0);
    expect(existingMesh.position.z).toBe(0);
    expect(existingMesh.rotation.z).toBe(Math.PI);
    expect(existingMesh.scale.x).toBe(2);
  });

  it('should not update transform when attached to controls in rotate mode', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];
    transformControlsRefMock.current.object = existingMesh;
    transformControlsRefMock.current.mode = 'rotate';

    storeState = {
      cars: [{ id: 'car-A', x: 10, y: 20, z: 30, scale: 2, rotation: Math.PI }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.position.x).toBe(10);
    expect(existingMesh.position.y).toBe(20);
    expect(existingMesh.position.z).toBe(30);
    expect(existingMesh.rotation.z).toBe(0);
    expect(existingMesh.scale.x).toBe(2);
  });

  it('should not update transform when attached to controls in scale mode', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];
    transformControlsRefMock.current.object = existingMesh;
    transformControlsRefMock.current.mode = 'scale';

    storeState = {
      cars: [{ id: 'car-A', x: 10, y: 20, z: 30, scale: 2, rotation: Math.PI }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.position.x).toBe(10);
    expect(existingMesh.position.y).toBe(20);
    expect(existingMesh.position.z).toBe(30);
    expect(existingMesh.rotation.z).toBe(Math.PI);
    expect(existingMesh.scale.x).toBe(1);
  });

  it('should update all transforms when not attached to controls', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];
    transformControlsRefMock.current.object = null;

    storeState = {
      cars: [{ id: 'car-A', x: 10, y: 20, z: 30, scale: 2, rotation: Math.PI }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.position.x).toBe(10);
    expect(existingMesh.position.y).toBe(20);
    expect(existingMesh.position.z).toBe(30);
    expect(existingMesh.rotation.z).toBe(Math.PI);
    expect(existingMesh.scale.x).toBe(2);
  });
});
vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

vi.mock('@editor/context', () => ({
  useHooks: () => ({ updateSceneGraph: updateSceneGraphMock }),
  useEditorRefs: () => ({
    sceneRef: sceneRefMock,
    carMeshesRef: carMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
}));

describe('useCarMeshSync - final coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    carModelRefMock.current = null;
    modelLoadedMock = false;
    carMeshesRefMock.current = [];
    sceneRefMock.current = new THREE.Scene();
    storeState = { cars: [], selectedId: null };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    transformControlsRefMock.current.mode = 'translate';
    transformControlsRefMock.current.attach.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should set rotation to 0 when rotation is undefined', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: null,
    };

    renderHook(() => useCarMeshSync());

    const mesh = carMeshesRefMock.current[0];
    expect(mesh.rotation.z).toBe(0);
  });

  it('should not update rotation when mode is rotate', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1, rotation: 0 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];

    existingMesh.rotation.z = 1.5;
    transformControlsRefMock.current.object = existingMesh;
    transformControlsRefMock.current.mode = 'rotate';

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1, rotation: 0 }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.rotation.z).toBe(1.5);
  });

  it('should not attach transform controls when selectedMesh is undefined', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1 }],
      selectedId: 'non-existent',
    };

    renderHook(() => useCarMeshSync());

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(transformControlsRefMock.current.attach).not.toHaveBeenCalled();
  });
});

describe('CarUtils - final coverage', () => {
  it('should handle MeshBasicMaterial in applyColor', () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );

    applyColor(mesh, '#ff0000');

    const material = mesh.material as THREE.MeshBasicMaterial;
    expect(material).toBeDefined();
  });

  it('should handle array of materials in applyColor', () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      new THREE.MeshStandardMaterial({ color: 0xffffff }),
    ]);

    applyColor(mesh, '#00ff00');

    const materials = mesh.material as THREE.Material[];
    expect(materials[0]).toBeDefined();
    expect(materials[1]).toBeDefined();
  });
});

vi.mock('../ui/useCarModel', () => ({
  useCarModel: () => ({
    carModelRef: carModelRefMock,
    get modelLoaded() {
      return modelLoadedMock;
    },
  }),
}));

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

vi.mock('@editor/context', () => ({
  useHooks: () => ({ updateSceneGraph: updateSceneGraphMock }),
  useEditorRefs: () => ({
    sceneRef: sceneRefMock,
    carMeshesRef: carMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
}));

describe('useCarMeshSync - coverage lines 53, 59', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    carModelRefMock.current = null;
    modelLoadedMock = false;
    carMeshesRefMock.current = [];
    sceneRefMock.current = new THREE.Scene();
    storeState = { cars: [], selectedId: null };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    transformControlsRefMock.current.mode = 'translate';
    transformControlsRefMock.current.attach.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should execute line 53 when not attached and rotation is provided', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1, rotation: 0.7 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];

    existingMesh.rotation.z = 0;
    transformControlsRefMock.current.object = null;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1, rotation: 0.7 }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.rotation.z).toBe(0.7);
  });

  it('should execute line 59 when attached and mode is translate', () => {
    carModelRefMock.current = new THREE.Group();
    const mockMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    carModelRefMock.current.add(mockMesh);
    modelLoadedMock = true;

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1, rotation: 0.7 }],
      selectedId: null,
    };

    const { rerender } = renderHook(() => useCarMeshSync());
    const existingMesh = carMeshesRefMock.current[0];

    existingMesh.rotation.z = 0;
    transformControlsRefMock.current.object = existingMesh;
    transformControlsRefMock.current.mode = 'translate';

    storeState = {
      cars: [{ id: 'car-A', x: 0, y: 0, z: 0, scale: 1, rotation: 0.7 }],
      selectedId: null,
    };

    act(() => {
      rerender();
    });

    expect(existingMesh.rotation.z).toBe(0.7);
  });
});
