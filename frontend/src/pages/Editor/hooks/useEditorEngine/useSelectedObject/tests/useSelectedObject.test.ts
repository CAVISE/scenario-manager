import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditorStore } from '@/store';
import { useSelectedObject } from '../ui/useSelectedObject';

describe('useSelectedObject', () => {
  beforeEach(() => {
    useEditorStore.setState({
      cars: [],
      RSUs: [],
      lidars: [],
      points: [],
      buildings: [],
      pedestrians: [],
      selectedIds: [],
      selectedObjects: [],
    });
  });

  describe('correctness', () => {
    it('returns null for every entity and hasSelection=false when nothing is selected', () => {
      const { result } = renderHook(() => useSelectedObject());

      expect(result.current.car).toBeNull();
      expect(result.current.rsu).toBeNull();
      expect(result.current.building).toBeNull();
      expect(result.current.lidar).toBeNull();
      expect(result.current.pedestrian).toBeNull();
      expect(result.current.point).toBeNull();
      expect(result.current.hasSelection).toBe(false);
    });

    it('resolves the selected car by selectedIds', () => {
      act(() => {
        const carId = useEditorStore
          .getState()
          .addCar(1, 2, 3, 'model', 'ff0000');
        useEditorStore.getState().selectObjects([{ type: 'car', id: carId }]);
      });

      const { result } = renderHook(() => useSelectedObject());

      expect(result.current.isCar).toBe(true);
      expect(result.current.car?.x).toBe(1);
      expect(result.current.hasSelection).toBe(true);
    });

    it('resolves the selected building via selectedIds', () => {
      act(() => {
        const buildingId = useEditorStore.getState().addBuilding(5, 6, 7);
        useEditorStore
          .getState()
          .selectObjects([{ type: 'building', id: buildingId }]);
      });

      const { result } = renderHook(() => useSelectedObject());

      expect(result.current.isBuilding).toBe(true);
      expect(result.current.building?.x).toBe(5);
    });

    it('resolves the selected building via selectedObjects when selectedIds is empty', () => {
      let buildingId = '';
      act(() => {
        buildingId = useEditorStore.getState().addBuilding(8, 9, 10);
        useEditorStore.setState({
          selectedIds: [],
          selectedObjects: [{ type: 'building', id: buildingId }],
        });
      });

      const { result } = renderHook(() => useSelectedObject());

      expect(result.current.building?.id).toBe(buildingId);
      expect(result.current.isBuilding).toBe(true);
    });

    it('resolves the selected route point via selectedObjects', () => {
      act(() => {
        const carId = useEditorStore
          .getState()
          .addCar(0, 0, 0, 'model', '00ff00');
        const pointId = useEditorStore.getState().addPoint(carId, 11, 12, 13);
        useEditorStore
          .getState()
          .selectObjects([{ type: 'point', id: pointId }]);
      });

      const { result } = renderHook(() => useSelectedObject());

      expect(result.current.point?.x).toBe(11);
      expect(result.current.isCircle).toBe(true);
    });

    it('computes carLidars for the selected car only', () => {
      let carAId = '';
      act(() => {
        carAId = useEditorStore.getState().addCar(0, 0, 0, 'model', 'fff');
        const carBId = useEditorStore
          .getState()
          .addCar(0, 0, 0, 'model', 'fff');
        useEditorStore.getState().addLidar(carAId, 1, 1, 1);
        useEditorStore.getState().addLidar(carBId, 2, 2, 2);
        useEditorStore.getState().selectObjects([{ type: 'car', id: carAId }]);
      });

      const { result } = renderHook(() => useSelectedObject());

      expect(result.current.carLidars).toHaveLength(1);
      expect(result.current.carLidars[0].carId).toBe(carAId);
    });
  });

  describe('re-render optimization', () => {
    it('does not re-render when an unrelated car is updated', () => {
      let selectedCarId = '';
      let otherCarId = '';
      act(() => {
        selectedCarId = useEditorStore
          .getState()
          .addCar(0, 0, 0, 'model', 'fff');
        otherCarId = useEditorStore.getState().addCar(0, 0, 0, 'model', 'fff');
        useEditorStore
          .getState()
          .selectObjects([{ type: 'car', id: selectedCarId }]);
      });

      const renderSpy = vi.fn();
      const { result } = renderHook(() => {
        const value = useSelectedObject();
        renderSpy();
        return value;
      });

      const rendersAfterMount = renderSpy.mock.calls.length;
      const carRefBeforeUpdate = result.current.car;

      act(() => {
        useEditorStore.getState().updateCar(otherCarId, { x: 999 });
      });

      expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
      expect(result.current.car).toBe(carRefBeforeUpdate);
    });

    it('re-renders when the selected car itself is updated', () => {
      let selectedCarId = '';
      act(() => {
        selectedCarId = useEditorStore
          .getState()
          .addCar(0, 0, 0, 'model', 'fff');
        useEditorStore
          .getState()
          .selectObjects([{ type: 'car', id: selectedCarId }]);
      });

      const renderSpy = vi.fn();
      const { result } = renderHook(() => {
        const value = useSelectedObject();
        renderSpy();
        return value;
      });

      const rendersAfterMount = renderSpy.mock.calls.length;

      act(() => {
        useEditorStore.getState().updateCar(selectedCarId, { x: 42 });
      });

      expect(renderSpy.mock.calls.length).toBeGreaterThan(rendersAfterMount);
      expect(result.current.car?.x).toBe(42);
    });

    it('does not re-render when an unrelated building is updated while a car is selected', () => {
      let selectedCarId = '';
      act(() => {
        selectedCarId = useEditorStore
          .getState()
          .addCar(0, 0, 0, 'model', 'fff');
        useEditorStore.getState().addBuilding(0, 0, 0);
        useEditorStore
          .getState()
          .selectObjects([{ type: 'car', id: selectedCarId }]);
      });

      const renderSpy = vi.fn();
      renderHook(() => {
        useSelectedObject();
        renderSpy();
      });

      const rendersAfterMount = renderSpy.mock.calls.length;
      const buildingId = useEditorStore.getState().buildings[0].id;

      act(() => {
        useEditorStore.getState().updateBuilding(buildingId, { x: 500 });
      });

      expect(renderSpy.mock.calls.length).toBe(rendersAfterMount);
    });
  });
});
