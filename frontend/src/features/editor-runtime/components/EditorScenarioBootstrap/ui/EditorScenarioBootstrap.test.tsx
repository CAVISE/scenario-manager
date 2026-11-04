import { StrictMode, useState } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { useLoadingState } from '@editor/hooks/useEditorEngine/useLoadingState';
import { useHooks } from '@editor/context';
import { handleLoad } from '@right-panel/components/ScenarioControlWidget/Handlers';
import { EditorScenarioBootstrap } from './EditorScenarioBootstrap';

vi.mock('@editor/context', () => ({
  useHooks: vi.fn(),

  useEditorRefs: () => ({ sceneRef: { current: {} } }),
}));
vi.mock('@right-panel/components/ScenarioControlWidget/Handlers', () => ({
  handleLoad: vi.fn(),
}));
vi.mock('@/shared/ui/AppToast', () => ({
  useAppToast: () => ({ error: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it('loads the saved scenario directly when WASM is ready, without waiting for the initial map', async () => {
  vi.useFakeTimers();
  let loading: ReturnType<typeof useLoadingState>;
  let markRuntimeReady!: () => void;
  let resolveRequest!: () => void;
  const request = new Promise<void>((resolve) => {
    resolveRequest = resolve;
  });
  const loadFile = vi.fn();
  vi.mocked(handleLoad).mockImplementation(async (options) => {
    options.setStep?.('map');
    await request;
    options.loadFile('<OpenDRIVE />', true);
    options.setStep?.('done');
    return true;
  });

  function Harness() {
    loading = useLoadingState();
    const [runtimeReady, setRuntimeReady] = useState(false);
    markRuntimeReady = () => setRuntimeReady(true);

    vi.mocked(useHooks).mockReturnValue({
      ...loading,
      runtimeReady,
      loadFile: (...args) => loadFile(...args),
      updateSceneGraph: () => {},
    } as ReturnType<typeof useHooks>);
    const location = useLocation();
    return (
      <>
        <output aria-label="URL">{location.search}</output>
        <output aria-label="Loading">{loading.loadingText ?? 'ready'}</output>
        <EditorScenarioBootstrap />
      </>
    );
  }

  render(
    <StrictMode>
      <MemoryRouter initialEntries={['/editor?scenario=saved&keep=yes']}>
        <Harness />
      </MemoryRouter>
    </StrictMode>
  );

  await act(() => vi.advanceTimersByTimeAsync(5000));
  expect(handleLoad).not.toHaveBeenCalled();
  expect(screen.getByLabelText('URL').textContent).toContain('scenario=saved');

  act(() => markRuntimeReady());
  expect(handleLoad).toHaveBeenCalledTimes(1);
  expect(loadFile).not.toHaveBeenCalled();

  await act(async () => resolveRequest());
  await act(() => vi.advanceTimersByTimeAsync(450));
  expect(loadFile).toHaveBeenCalledTimes(1);
  expect(handleLoad).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Loading').textContent).toBe('ready');
  expect(screen.getByLabelText('URL').textContent).toBe('?keep=yes');
});
