import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapSelection } from './useMapSelection';
import { useEditorStore } from '@/store';

const mocks = vi.hoisted(() => ({
  fetchXodrText: vi.fn(),
  setStoredXodrName: vi.fn(),
  clearLoadedSumoNetwork: vi.fn(),
  invalidatePreviewCache: vi.fn(),
}));

vi.mock(
  '@editor/hooks/useThreeScene/hooks/useOdrLoader/utils/xodrRepository',
  () => ({
    fetchXodrText: mocks.fetchXodrText,
    setStoredXodrName: mocks.setStoredXodrName,
  })
);
vi.mock('@editor/lib/mapLoadRequest', () => ({
  beginMapLoadRequest: () => () => true,
}));
vi.mock('@scenario-export', () => ({
  clearLoadedSumoNetwork: mocks.clearLoadedSumoNetwork,
}));
vi.mock(
  '@right-panel/components/ScenarioControlWidget/Handlers/utils/scenarioPreview',
  () => ({ invalidatePreviewCache: mocks.invalidatePreviewCache })
);

describe('useMapSelection', () => {
  const loadFile = vi.fn();
  const updateSimConfigCarla = vi.fn();
  const updateScenario = vi.fn();
  const setSceneExplicitlyCleared = vi.fn();
  const setMapLoading = vi.fn();
  const markScenarioClean = vi.fn();
  const toastSuccess = vi.fn();
  const setMapPickerOpen = vi.fn();
  const setMapPickerError = vi.fn();
  const setLoadingMap = vi.fn();
  const cancelMapLoad = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchXodrText.mockResolvedValue('<OpenDRIVE/>');
    loadFile.mockReturnValue(true);
  });

  it('creates a clean local draft only after the requested map loads', async () => {
    const store = useEditorStore.getState();
    store.clearHistory();
    store.clearDeletionHistory();
    store.pushHistoryEntry({
      label: 'Old map edit',
      undo: vi.fn(),
      redo: vi.fn(),
    });
    store.pushDeletionSnapshot({
      origin: 'single-delete',
      label: 'Old map deletion',
      entities: [],
    });
    const { result } = renderHook(() =>
      useMapSelection({
        loadFile,
        updateSimConfigCarla,
        updateScenario,
        setSceneExplicitlyCleared,
        setMapLoading,
        markScenarioClean,
        toastSuccess,
        setMapPickerOpen,
        setMapPickerError,
        setLoadingMap,
        cancelMapLoad,
      })
    );

    let mapLoaded = false;
    await act(async () => {
      mapLoaded = await result.current.handleSelectMap('Town05');
    });

    expect(loadFile).toHaveBeenCalledWith('<OpenDRIVE/>', true, 'Town05');
    expect(updateSimConfigCarla).toHaveBeenCalledWith({ map: 'Town05' });
    expect(updateScenario).toHaveBeenCalledWith({
      id: '',
      revision: undefined,
      name: '',
      description: '',
      file_: null,
    });
    expect(setSceneExplicitlyCleared).toHaveBeenCalledWith(false);
    expect(markScenarioClean).toHaveBeenCalledOnce();
    expect(setMapPickerOpen).toHaveBeenCalledWith(false);
    expect(setMapLoading).toHaveBeenNthCalledWith(1, true);
    expect(setMapLoading).toHaveBeenLastCalledWith(false);
    expect(cancelMapLoad).toHaveBeenCalledOnce();
    expect(mocks.invalidatePreviewCache).toHaveBeenCalledOnce();
    expect(toastSuccess).toHaveBeenCalledWith('Map Town05 loaded.');
    expect(mapLoaded).toBe(true);
    expect(useEditorStore.getState().historyStack).toEqual([]);
    expect(useEditorStore.getState().deletionHistory).toEqual([]);
  });

  it('keeps the current scenario when the map loader reports failure', async () => {
    loadFile.mockReturnValue(false);
    const { result } = renderHook(() =>
      useMapSelection({
        loadFile,
        updateSimConfigCarla,
        updateScenario,
        setSceneExplicitlyCleared,
        setMapLoading,
        markScenarioClean,
        toastSuccess,
        setMapPickerOpen,
        setMapPickerError,
        setLoadingMap,
        cancelMapLoad,
      })
    );

    let mapLoaded = true;
    await act(async () => {
      mapLoaded = await result.current.handleSelectMap('Town05');
    });

    expect(updateScenario).not.toHaveBeenCalled();
    expect(updateSimConfigCarla).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(setMapPickerError).toHaveBeenCalledWith(
      'Failed to load map Town05.'
    );
    expect(setMapPickerOpen).toHaveBeenNthCalledWith(1, false);
    expect(setMapPickerOpen).toHaveBeenLastCalledWith(true);
    expect(setMapLoading).toHaveBeenLastCalledWith(false);
    expect(mapLoaded).toBe(false);
  });

  it('cancels a pending scene build when the picker is reopened', () => {
    const { result } = renderHook(() =>
      useMapSelection({
        loadFile,
        updateSimConfigCarla,
        updateScenario,
        setSceneExplicitlyCleared,
        setMapLoading,
        markScenarioClean,
        toastSuccess,
        setMapPickerOpen,
        setMapPickerError,
        setLoadingMap,
        cancelMapLoad,
      })
    );

    act(() => result.current.invalidate());

    expect(cancelMapLoad).toHaveBeenCalledOnce();
    expect(setMapLoading).toHaveBeenCalledWith(false);
  });
});
