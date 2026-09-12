import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '@/store';
import { useScenarioControls } from './useScenarioControls';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  patch: vi.fn(),
  remove: vi.fn(),
  run: vi.fn(),
  mutation: { isPending: false },
}));

vi.mock('../Handlers', () => ({
  handleCreate: mocks.create,
  handlePatch: mocks.patch,
  handleDelete: mocks.remove,
  handleRunSimulation: mocks.run,
}));
vi.mock('@editor/context', () => ({
  useEditorRefs: () => ({
    odrMapRef: { current: { x_offs: 100, y_offs: 200 } },
  }),
}));
vi.mock('@editor/hooks/useApiHooks/useScenarioQueries', () => ({
  useScenarioCreateMutation: () => mocks.mutation,
  useScenarioPatchMutation: () => mocks.mutation,
  useScenarioDeleteMutation: () => mocks.mutation,
}));
vi.mock('@editor/hooks/useApiHooks/useSimulationMutation', () => ({
  useStartSimulationMutation: () => mocks.mutation,
}));
vi.mock('@/components/AppToast', () => ({
  useNoticeWithToast: (setNotice: (value: string) => void) => setNotice,
}));
vi.mock('@/api/errors', () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) =>
    Promise.resolve(fallback),
}));

describe('scenario run workflow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.mutation.isPending = false;
    useEditorStore.setState(useEditorStore.getInitialState(), true);
    useEditorStore.getState().updateScenario({ id: '', name: 'City center' });
    mocks.create.mockImplementation(async () => {
      useEditorStore.getState().updateScenario({ id: 'saved-id' });
      return true;
    });
    mocks.patch.mockResolvedValue(true);
    mocks.run.mockResolvedValue(undefined);
  });

  it('saves a local draft before running with its server ID and map offsets', async () => {
    const { result } = renderHook(() => useScenarioControls());
    await act(() => result.current.run());
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.patch).not.toHaveBeenCalled();
    expect(mocks.run).toHaveBeenCalledWith(
      expect.any(Function),
      'saved-id',
      mocks.mutation,
      { x: 100, y: -200 }
    );
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.run.mock.invocationCallOrder[0]
    );
  });

  it('saves changes to an existing scenario and cancels the run if saving fails', async () => {
    useEditorStore.getState().updateScenario({ id: 'existing-id' });
    mocks.patch.mockResolvedValue(false);
    const { result } = renderHook(() => useScenarioControls());
    await act(() => result.current.run());
    expect(mocks.patch).toHaveBeenCalledWith(
      expect.any(Function),
      'existing-id',
      true,
      mocks.mutation
    );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
    expect(result.current.isBusy).toBe(false);
  });

  it('blocks duplicate actions throughout asynchronous saving', async () => {
    let finishSave!: (saved: boolean) => void;
    mocks.create.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishSave = resolve;
      })
    );
    const { result } = renderHook(() => useScenarioControls());
    let run!: Promise<void>;
    act(() => {
      run = result.current.run();
    });
    expect(result.current.isBusy).toBe(true);
    await act(async () => {
      await result.current.run();
      await result.current.save();
      await result.current.remove();
    });
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.remove).not.toHaveBeenCalled();
    await act(async () => {
      finishSave(true);
      await run;
    });
    expect(mocks.run).toHaveBeenCalledOnce();
  });

  it('reports preparation failures and allows retrying', async () => {
    mocks.run.mockRejectedValueOnce(new Error('Map unavailable'));
    const { result } = renderHook(() => useScenarioControls());
    await act(() => result.current.run());
    expect(result.current.notice).toBe('Failed to run scenario.');
    expect(result.current.isBusy).toBe(false);
    await act(() => result.current.run());
    expect(mocks.run).toHaveBeenCalledTimes(2);
  });

  it('prevents scene writes and another run while simulation is running', async () => {
    useEditorStore.getState().updateSimulationSession({ phase: 'running' });
    const { result } = renderHook(() => useScenarioControls());
    await act(async () => {
      await result.current.save();
      await result.current.remove();
      await result.current.run();
    });
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });
});
