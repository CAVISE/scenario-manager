import { useEditorStore } from '@/store';
import { DEFAULT_SCENARIO } from '../constants/StartPage.constants';
import { useCallback } from 'react';

export const useStoreReset = () => {
  return useCallback(() => {
    const store = useEditorStore.getState();

    const clearEntities = <T extends { id: string }>(
      entities: T[],
      removeFn: (id: string) => void
    ) => {
      [...entities].forEach((entity) => removeFn(entity.id));
    };

    clearEntities(store.cars, store.removeCar);
    clearEntities(store.points, store.removePoint);
    clearEntities(store.buildings, store.removeBuilding);
    clearEntities(store.pedestrians, store.removePedestrian);
    clearEntities(store.lidars, store.removeLidar);

    store.removeAllRSUs();
    store.selectObjects([]);
    store.updateScenario(DEFAULT_SCENARIO);
    store.updateSimConfigCarla({ weather_preset: 'ClearNoon' });
  }, []);
};
