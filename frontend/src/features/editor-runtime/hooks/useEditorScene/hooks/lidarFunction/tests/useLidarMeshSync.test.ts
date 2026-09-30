import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';
import { useLidarMeshSync } from '../ui/useLidarMeshSync';
import { createLidarMesh, disposeLidarGroup } from '../utils/LidarUtils';
import { Lidar } from '@/store/types/useEditorStoreTypes';

const updateSceneGraphMock = vi.fn();
const carMeshesRefMock = { current: [] as THREE.Group[] };
const transformControlsRefMock = {
  current: {
    attach: vi.fn(),
    detach: vi.fn(),
    object: null as THREE.Object3D | null,
    mode: 'translate',
  },
};

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

vi.mock('@editor/context', () => ({
  useEditorRefs: () => ({
    carMeshesRef: carMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
  useHooks: () => ({
    updateSceneGraph: updateSceneGraphMock,
  }),
}));

vi.mock('../utils/LidarUtils', () => ({
  createLidarMesh: vi.fn((lidar: Lidar) => {
    const group = new THREE.Group();
    group.userData = { type: 'lidar', id: lidar.id };
    group.position.set(lidar.x, lidar.y, lidar.z);
    group.rotation.z = lidar.rotation;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(lidar.range * 0.1, lidar.range * 0.3, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    cone.userData = { type: 'lidar-cone' };
    group.add(cone);

    return group;
  }),
  disposeLidarGroup: vi.fn(),
}));

let storeState: {
  lidars: {
    id: string;
    carId: string;
    x: number;
    y: number;
    z: number;
    range: number;
    rotation: number;
  }[];
  cars: {
    id: string;
    x: number;
    y: number;
    z: number;
    scale: number;
  }[];
};

describe('useLidarMeshSync', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    carMeshesRefMock.current = [];
    storeState = { lidars: [], cars: [] };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    (createLidarMesh as ReturnType<typeof vi.fn>).mockClear();
    (disposeLidarGroup as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should create lidar meshes for cars', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
        {
          id: 'lidar-2',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 2,
          range: 50,
          rotation: Math.PI / 2,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(createLidarMesh).toHaveBeenCalledTimes(2);
    expect(carGroup.children).toHaveLength(2);
    expect(updateSceneGraphMock).toHaveBeenCalled();
  });

  it('should not create lidar if car wrapper not found', () => {
    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'non-existent',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(createLidarMesh).not.toHaveBeenCalled();
  });

  it('should update existing lidar position and rotation', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);
    lidarGroup.rotation.z = 0;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(cone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 5,
          y: 10,
          z: 15,
          range: 100,
          rotation: Math.PI,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(lidarGroup.position.x).toBe(5);
    expect(lidarGroup.position.y).toBe(10);
    expect(lidarGroup.position.z).toBe(15);
    expect(lidarGroup.rotation.z).toBe(Math.PI);
  });

  it('should not update lidar position if attached to transform controls', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);
    lidarGroup.rotation.z = 0;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(cone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];
    transformControlsRefMock.current.object = lidarGroup;

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 5,
          y: 10,
          z: 15,
          range: 100,
          rotation: Math.PI,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(lidarGroup.position.x).toBe(0);
    expect(lidarGroup.position.y).toBe(0);
    expect(lidarGroup.position.z).toBe(1);
    expect(lidarGroup.rotation.z).toBe(0);
  });

  it('should remove lidar mesh when lidar is deleted', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(cone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(disposeLidarGroup).toHaveBeenCalled();
    expect(carGroup.children).toHaveLength(0);
  });

  it('should update cone geometry when range changes', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);

    const oldCone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(oldCone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 200,
          rotation: 0,
        },
      ],
    };

    const disposeSpy = vi.spyOn(oldCone.geometry, 'dispose');

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(disposeSpy).toHaveBeenCalled();

    const newCone = lidarGroup.children[0] as THREE.Mesh;
    const coneGeometry = newCone.geometry as THREE.ConeGeometry;
    expect(newCone.geometry).toBeInstanceOf(THREE.ConeGeometry);
    expect(coneGeometry.parameters.radius).toBe(20);
    expect(coneGeometry.parameters.height).toBe(60);
  });

  it('should scale lidar relative to car scale', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(2);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 2 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(createLidarMesh).toHaveBeenCalled();

    const createdGroup = (createLidarMesh as ReturnType<typeof vi.fn>).mock
      .results[0].value as THREE.Group;
    expect(createdGroup.scale.x).toBe(0.5);
  });

  it('should handle multiple lidars on same car', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
        {
          id: 'lidar-2',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 2,
          range: 50,
          rotation: Math.PI / 2,
        },
        {
          id: 'lidar-3',
          carId: 'car-1',
          x: 1,
          y: 1,
          z: 3,
          range: 75,
          rotation: Math.PI,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(carGroup.children).toHaveLength(3);
    expect(createLidarMesh).toHaveBeenCalledTimes(3);
  });
});

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

vi.mock('@editor/context', () => ({
  useEditorRefs: () => ({
    carMeshesRef: carMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
  useHooks: () => ({
    updateSceneGraph: updateSceneGraphMock,
  }),
}));

vi.mock('../utils/LidarUtils', () => ({
  createLidarMesh: vi.fn((lidar: Lidar) => {
    const group = new THREE.Group();
    group.userData = { type: 'lidar', id: lidar.id };
    group.position.set(lidar.x, lidar.y, lidar.z);
    group.rotation.z = lidar.rotation;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(lidar.range * 0.1, lidar.range * 0.3, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    cone.userData = { type: 'lidar-cone' };
    group.add(cone);

    return group;
  }),
  disposeLidarGroup: vi.fn(),
}));

describe('useLidarMeshSync - additional coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    carMeshesRefMock.current = [];
    storeState = { lidars: [], cars: [] };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    (createLidarMesh as ReturnType<typeof vi.fn>).mockClear();
    (disposeLidarGroup as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should handle child without userData.type lidar', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const nonLidarChild = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    nonLidarChild.userData = { type: 'other', id: 'other-1' };
    carGroup.add(nonLidarChild);

    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(createLidarMesh).toHaveBeenCalledTimes(1);
    expect(carGroup.children).toHaveLength(2);
  });

  it('should handle car with scale 0 by using 1 as parentScale', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(0);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 0 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const createdGroup = (createLidarMesh as ReturnType<typeof vi.fn>).mock
      .results[0].value as THREE.Group;
    expect(createdGroup.scale.x).toBe(1);
  });

  it('should update existing lidar with cone when range changes and cone exists', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);

    const oldCone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(oldCone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 300,
          rotation: 0,
        },
      ],
    };

    const disposeSpy = vi.spyOn(oldCone.geometry, 'dispose');

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(disposeSpy).toHaveBeenCalled();

    const newCone = lidarGroup.children[0] as THREE.Mesh;
    const coneGeometry = newCone.geometry as THREE.ConeGeometry;
    expect(coneGeometry.parameters.radius).toBe(30);
    expect(coneGeometry.parameters.height).toBe(90);
  });

  it('should not update cone when no cone geometry exists', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);

    const nonConeChild = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(nonConeChild);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 200,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(lidarGroup.children).toHaveLength(1);
    expect(lidarGroup.children[0]).toBe(nonConeChild);
  });

  it('should use parentScale 1 when wrapper scale is undefined', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const createdGroup = (createLidarMesh as ReturnType<typeof vi.fn>).mock
      .results[0].value as THREE.Group;
    expect(createdGroup.scale.x).toBe(1);
  });

  it('should remove existing lidar group when lidar is deleted', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(1);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-to-delete' };
    lidarGroup.position.set(0, 0, 1);

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(cone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 1 }],
      lidars: [],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(disposeLidarGroup).toHaveBeenCalledWith(lidarGroup);
    expect(carGroup.children).toHaveLength(0);
  });
});

vi.mock('@/store', () => ({
  useEditorStore: Object.assign(
    (selector: (s: typeof storeState) => unknown) => selector(storeState),
    { getState: () => storeState }
  ),
}));

vi.mock('@editor/context', () => ({
  useEditorRefs: () => ({
    carMeshesRef: carMeshesRefMock,
    transformControlsRef: transformControlsRefMock,
  }),
  useHooks: () => ({
    updateSceneGraph: updateSceneGraphMock,
  }),
}));

vi.mock('../utils/LidarUtils', () => ({
  createLidarMesh: vi.fn((lidar: Lidar) => {
    const group = new THREE.Group();
    group.userData = { type: 'lidar', id: lidar.id };
    group.position.set(lidar.x, lidar.y, lidar.z);
    group.rotation.z = lidar.rotation;

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(lidar.range * 0.1, lidar.range * 0.3, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    cone.userData = { type: 'lidar-cone' };
    group.add(cone);

    return group;
  }),
  disposeLidarGroup: vi.fn(),
}));

describe('useLidarMeshSync - line 52 coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    carMeshesRefMock.current = [];
    storeState = { lidars: [], cars: [] };
    updateSceneGraphMock.mockClear();
    transformControlsRefMock.current.object = null;
    (createLidarMesh as ReturnType<typeof vi.fn>).mockClear();
    (disposeLidarGroup as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should use parentScale 1 when wrapper.scale.x is 0 in existing lidar', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(0);

    const lidarGroup = new THREE.Group();
    lidarGroup.userData = { type: 'lidar', id: 'lidar-1' };
    lidarGroup.position.set(0, 0, 1);
    lidarGroup.scale.setScalar(0.5);

    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(10, 30, 32, 1, true),
      new THREE.MeshBasicMaterial()
    );
    lidarGroup.add(cone);

    carGroup.add(lidarGroup);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 0 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(lidarGroup.scale.x).toBe(1);
    expect(lidarGroup.scale.y).toBe(1);
    expect(lidarGroup.scale.z).toBe(1);
  });

  it('should use parentScale 1 when wrapper.scale.x is 0 for new lidar', () => {
    const carGroup = new THREE.Group();
    carGroup.userData = { type: 'car', id: 'car-1' };
    carGroup.scale.setScalar(0);
    carMeshesRefMock.current = [carGroup];

    storeState = {
      cars: [{ id: 'car-1', x: 0, y: 0, z: 0, scale: 0 }],
      lidars: [
        {
          id: 'lidar-1',
          carId: 'car-1',
          x: 0,
          y: 0,
          z: 1,
          range: 100,
          rotation: 0,
        },
      ],
    };

    renderHook(() => useLidarMeshSync());

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const createdGroup = (createLidarMesh as ReturnType<typeof vi.fn>).mock
      .results[0].value as THREE.Group;
    expect(createdGroup.scale.x).toBe(1);
    expect(createdGroup.scale.y).toBe(1);
    expect(createdGroup.scale.z).toBe(1);
  });
});
