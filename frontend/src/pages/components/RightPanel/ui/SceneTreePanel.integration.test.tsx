import '@testing-library/jest-dom/vitest';
import { useState } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEditorStore } from '@/store';
import type { EditorTab } from '@editor/components/EditorNavigation/types/EditorNavigationTypes';
import RightPanel from './SceneTreePanel';

const mocks = vi.hoisted(() => ({
  socketMount: vi.fn(),
  socketUnmount: vi.fn(),
  save: vi.fn(),
  run: vi.fn(),
  remove: vi.fn(),
  get: vi.fn(),
  toastSuccess: vi.fn(),
}));
vi.mock('@/api/client', () => ({ api: { get: mocks.get } }));
vi.mock('../components/CarProperties', () => ({ default: () => null }));
vi.mock('../components/LidarProperties', () => ({ default: () => null }));
vi.mock('../components/RSUProperties', () => ({ default: () => null }));
vi.mock('../components/BuildingProperties', () => ({ default: () => null }));
vi.mock('../components/RoutePointProperties', () => ({ default: () => null }));
vi.mock('../components/PedestrianProperties', () => ({ default: () => null }));
vi.mock('../components/SceneTreePanel', () => ({ default: () => null }));
vi.mock('@editor/components/SimConfigModal', () => ({ default: () => null }));
vi.mock('@editor/hooks/useEditorEngine/useSelectedObject', () => ({
  useSelectedObject: () => ({ hasSelection: false }),
}));
vi.mock('@editor/hooks/useApiHooks/useSimulationMutation', () => ({
  useStopSimulationMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('@/components/AppToast', () => ({
  useNoticeWithToast: (setNotice: (value: string) => void) => setNotice,
  useAppToast: () => ({ success: mocks.toastSuccess }),
}));
vi.mock('@editor/hooks/useApiHooks/useSimulationSocket', async () => {
  const { useEffect } = await import('react');
  return {
    useSimulationSocket: () => {
      useEffect(() => {
        mocks.socketMount();
        return mocks.socketUnmount;
      }, []);
      return { connected: true, state: null };
    },
  };
});

function Workspace({
  readOnly = false,
  initialTab = 'edit',
}: {
  readOnly?: boolean;
  initialTab?: EditorTab;
}) {
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  return (
    <RightPanel
      activeTab={activeTab}
      onTabChange={setActiveTab}
      readOnly={readOnly}
      showSceneGraph={false}
      controls={{
        isBusy: false,
        operation: null,
        notice: '',
        save: mocks.save,
        run: mocks.run,
        remove: mocks.remove,
      }}
    />
  );
}

describe('scenario context integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorStore.setState(useEditorStore.getInitialState(), true);
    useEditorStore.getState().updateScenario({ id: '', name: 'City center' });
    useEditorStore.setState({ selectedIds: ['car-1', 'car-2'] });
  });
  afterEach(cleanup);

  it('applies mixed common properties without changing the selection and cancels invalid input', () => {
    const first = useEditorStore
      .getState()
      .addCar(0, 0, 0, 'car', '00ff00', 40);
    const second = useEditorStore
      .getState()
      .addCar(1, 2, 0, 'car', '00ff00', 60);
    useEditorStore.getState().selectObjects([
      { id: first, type: 'car' },
      { id: second, type: 'car' },
    ]);
    render(<Workspace />);
    const speed = screen.getByLabelText('Speed (km/h)');
    expect(speed).toHaveAttribute('placeholder', 'Mixed');
    fireEvent.change(speed, { target: { value: '80' } });
    fireEvent.blur(speed);
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      80, 80,
    ]);
    expect(useEditorStore.getState().selectedIds).toEqual([first, second]);
    const updated = screen.getByLabelText('Speed (km/h)');
    fireEvent.change(updated, { target: { value: '-5' } });
    fireEvent.blur(updated);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid number');
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      80, 80,
    ]);
    act(() => useEditorStore.getState().undo());
    expect(useEditorStore.getState().cars.map((car) => car.speed)).toEqual([
      40, 60,
    ]);
  });

  it('opens scenario controls, edits metadata, and keeps selection and status monitoring across tabs', () => {
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Context' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Crossroad' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'RSU coverage test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save scenario' }));
    expect(mocks.save).toHaveBeenCalledOnce();
    expect(useEditorStore.getState().Scenario).toMatchObject({
      name: 'Crossroad',
      description: 'RSU coverage test',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open simulation' }));
    const run = screen.getByRole('button', { name: 'Run simulation' });
    expect(run).toBeEnabled();
    fireEvent.click(run);
    expect(mocks.run).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Scenario context/ }));
    expect(screen.getByLabelText('Name')).toHaveValue('Crossroad');
    expect(useEditorStore.getState().selectedIds).toEqual(['car-1', 'car-2']);
    expect(mocks.socketMount).toHaveBeenCalledOnce();
    expect(mocks.socketUnmount).not.toHaveBeenCalled();
  });

  it('disables writes while leaving workspace navigation accessible during a run', () => {
    useEditorStore.getState().updateScenario({ id: 'saved-id' });
    useEditorStore
      .getState()
      .updateSimulationSession({ phase: 'running', status: 'running' });
    render(<Workspace readOnly />);
    fireEvent.click(screen.getByRole('button', { name: 'Context' }));
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Description')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Save scenario' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Simulation parameters/ })
    ).toBeDisabled();
    fireEvent.click(screen.getByText('Advanced', { selector: 'summary' }));
    expect(
      screen.getByRole('button', { name: 'Delete scenario…' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'View results' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Open simulation' }));
    expect(screen.getByRole('button', { name: 'Stop' })).toBeEnabled();
  });

  it('reports the object count after group deletion', () => {
    const first = useEditorStore.getState().addCar(0, 0, 0, 'car', '00ff00');
    const second = useEditorStore.getState().addCar(1, 0, 0, 'car', '00ff00');
    useEditorStore.getState().selectObjects([
      { id: first, type: 'car' },
      { id: second, type: 'car' },
    ]);
    render(<Workspace />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete 2 objects' }));
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      '2 objects deleted. Use Undo to restore.'
    );
    expect(useEditorStore.getState().cars).toHaveLength(0);
  });

  it('clears stale result links when deselecting a run and recovers from a file request failure', async () => {
    mocks.get.mockImplementation((url: string) => ({
      json: () =>
        url === 'api/results'
          ? Promise.resolve(
              ['run-a', 'run-b'].map((run_id) => ({
                run_id,
                files_count: 1,
                modified_at: 1,
              }))
            )
          : url.endsWith('run-b')
            ? Promise.reject(new Error('unavailable'))
            : Promise.resolve({
                run_id: 'run-a',
                files: [
                  {
                    filename: 'plot.png',
                    url: '/evaluation_outputs/run-a/plot.png',
                  },
                ],
              }),
    }));
    render(<Workspace initialTab="results" />);
    expect(
      await screen.findByRole('link', { name: 'plot.png' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No completed run selected')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /run-a/ }));
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'plot.png' })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByText('No completed run selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /run-b/ }));
    expect(
      await screen.findByText(/Could not load result files/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /run-b/ }));
    fireEvent.click(screen.getByRole('button', { name: /run-a/ }));
    expect(
      await screen.findByRole('link', { name: 'plot.png' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Could not load result files/)
    ).not.toBeInTheDocument();
  });

  it('shows progress, explains a stopped run, and opens its results', async () => {
    mocks.get.mockReturnValue({ json: () => Promise.resolve([]) });
    useEditorStore.getState().updateSimulationSession({
      phase: 'running',
      status: 'running',
      tick: 420,
      maxTicks: 1000,
    });
    render(<Workspace initialTab="simulation" />);
    expect(
      screen.getByRole('progressbar', { name: 'Simulation progress' })
    ).toHaveAttribute('value', '420');
    act(() =>
      useEditorStore.getState().updateSimulationSession({ status: 'stopping' })
    );
    expect(screen.getByRole('button', { name: 'Stopping…' })).toBeDisabled();
    act(() =>
      useEditorStore.getState().updateSimulationSession({
        phase: 'finished',
        status: 'finished',
        partial: true,
      })
    );
    expect(
      screen.getByRole('heading', { name: 'Run stopped' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Results include the steps completed before stopping.')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View results' }));
    expect(
      await screen.findByRole('heading', { name: 'Explore results' })
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Refresh results' })
      ).toBeEnabled()
    );
  });

  it('allows retrying failed run history without leaving Results', async () => {
    mocks.get.mockReturnValueOnce({
      json: () => Promise.reject(new Error('offline')),
    });
    render(<Workspace initialTab="results" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not load run history'
    );
    mocks.get.mockReturnValue({ json: () => Promise.resolve([]) });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh results' }));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('button', { name: 'Set up a scenario' })
    ).toBeInTheDocument();
  });

  it('refreshes run history when the running simulation finishes with the same run ID', async () => {
    useEditorStore.getState().updateSimulationSession({
      phase: 'running',
      status: 'running',
      runId: 'new-run',
    });
    mocks.get.mockImplementation((url: string) => ({
      json: () =>
        Promise.resolve(
          url === 'api/results'
            ? useEditorStore.getState().simulationSession.phase === 'finished'
              ? [{ run_id: 'new-run', files_count: 1, modified_at: 1 }]
              : []
            : {
                run_id: 'new-run',
                files: [
                  {
                    filename: 'new.png',
                    url: '/evaluation_outputs/new-run/new.png',
                  },
                ],
              }
        ),
    }));
    render(<Workspace initialTab="results" />);
    await waitFor(() =>
      expect(
        screen.queryByText('Loading result files...')
      ).not.toBeInTheDocument()
    );
    act(() =>
      useEditorStore
        .getState()
        .updateSimulationSession({ phase: 'finished', status: 'finished' })
    );
    expect(
      await screen.findByRole('link', { name: 'new.png' })
    ).toBeInTheDocument();
  });
});
