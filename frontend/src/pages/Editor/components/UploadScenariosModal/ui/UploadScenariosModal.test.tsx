import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UploadScenariosModal from './UploadScenariosModal';

const useScenariosListQueryMock = vi.fn();
const handleLoadMock = vi.fn();

vi.mock('../../../hooks/useApiHooks/useScenarioQueries', () => ({
  useScenariosListQuery: (...args: unknown[]) => useScenariosListQueryMock(...args),
}));

vi.mock(
  '../../../../components/RightPanel/components/ScenarioControlWidget/Handlers',
  () => ({
    handleLoad: (...args: unknown[]) => handleLoadMock(...args),
  }),
);

vi.mock('../../../context', () => ({
  useEditorRefs: () => ({
    sceneRef: { current: { children: [], add: vi.fn() } },
    loadRSURef: { current: vi.fn() },
  }),
  useHooks: () => ({
    buildingModelRef: { current: null },
    updateSceneGraph: vi.fn(),
  }),
}));

describe('UploadScenariosModal', () => {
  beforeEach(() => {
    useScenariosListQueryMock.mockReset();
    handleLoadMock.mockReset();
  });

  it('loads selected scenario onto scene', async () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [
        {
          scenario_id: 'scenario-1',
          name: 'Scenario 1',
          preview: null,
          annotation: 'test scenario',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    handleLoadMock.mockResolvedValue(undefined);

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Scenario 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Load onto scene' }));

    await waitFor(() => {
      expect(handleLoadMock).toHaveBeenCalledTimes(1);
    });
    expect(handleLoadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hasId: true,
        scenarioIdInput: 'scenario-1',
      }),
    );
  });

  it('shows retry action when list query fails', async () => {
    const refetch = vi.fn();
    useScenariosListQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('failed to load'),
      refetch,
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(refetch).toHaveBeenCalledTimes(1);
    });
  });
});
