import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

let nanoidCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => `test-id-${++nanoidCounter}`),
}));

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get __raw() {
      return store;
    },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  nanoidCounter = 0;
  vi.resetModules();
});

describe('page reload simulation (fresh module instance)', () => {
  it('a car added before reload is present in localStorage under the persist key', async () => {
    const { useEditorStore } = await import('./useEditorStore');
    act(() => {
      useEditorStore.getState().addCar(1, 2, 3, 'sedan', 'red');
    });

    const raw = localStorageMock.__raw['editor-scenario-cache'];
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw);
    expect(parsed.state.cars).toHaveLength(1);
    expect(parsed.state.cars[0]).toMatchObject({
      x: 1,
      y: 2,
      z: 3,
      model: 'sedan',
    });
  });

  it('a car added before reload is restored after the store module is freshly re-imported', async () => {
    const { useEditorStore: storeBeforeReload } =
      await import('./useEditorStore');
    let carId: string;
    act(() => {
      carId = storeBeforeReload.getState().addCar(5, 6, 7, 'truck', 'blue');
    });
    expect(storeBeforeReload.getState().cars).toHaveLength(1);

    vi.resetModules();
    const { useEditorStore: storeAfterReload } =
      await import('./useEditorStore');

    const restoredCars = storeAfterReload.getState().cars;
    expect(restoredCars).toHaveLength(1);
    expect(restoredCars[0]).toMatchObject({
      id: carId!,
      x: 5,
      y: 6,
      z: 7,
      model: 'truck',
      color: 'blue',
    });
  });

  it('cars added synchronously right after clearing the store survive a reload, even if something else clears localStorage 100ms later (regression guard for the useOdrLoader setTimeout bug)', async () => {
    vi.useFakeTimers();
    const { useEditorStore } = await import('./useEditorStore');

    act(() => {
      useEditorStore.getState().addCar(0, 0, 0, 'sedan', 'old-car-color');
    });
    act(() => {
      const s = useEditorStore.getState();
      s.cars.forEach((c) => s.removeCar(c.id));
      s.addCar(9, 9, 9, 'suv', 'new-scenario-color');
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    vi.resetModules();
    const { useEditorStore: storeAfterReload } =
      await import('./useEditorStore');
    const restoredCars = storeAfterReload.getState().cars;
    expect(restoredCars).toHaveLength(1);
    expect(restoredCars[0]).toMatchObject({
      x: 9,
      y: 9,
      z: 9,
      model: 'suv',
      color: 'new-scenario-color',
    });

    vi.useRealTimers();
  });
});
