import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UploadScenariosModal from './UploadScenariosModal';
import '@testing-library/jest-dom';
const useScenariosListQueryMock = vi.fn();
const handleLoadMock = vi.fn();

vi.mock('../../../hooks/useApiHooks/useScenarioQueries', () => ({
  useScenariosListQuery: (...args: unknown[]) =>
    useScenariosListQueryMock(...args),
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
    loadFile: vi.fn(),
    setStep: vi.fn(),
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

  it('renders img with data: URI preview directly', () => {
    const dataUri = 'data:image/png;base64,abc123';
    useScenariosListQueryMock.mockReturnValue({
      data: [
        { scenario_id: 's1', name: 'S1', preview: dataUri, annotation: null },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    const img = screen.getByAltText('S1') as HTMLImageElement;
    expect(img.src).toBe(dataUri);
  });

  it('renders img with http:// preview directly', () => {
    const url = 'http://example.com/thumb.png';
    useScenariosListQueryMock.mockReturnValue({
      data: [{ scenario_id: 's2', name: 'S2', preview: url, annotation: null }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    const img = screen.getByAltText('S2') as HTMLImageElement;
    expect(img.src).toBe(url);
  });

  it('renders img with https:// preview directly', () => {
    const url = 'https://example.com/thumb.png';
    useScenariosListQueryMock.mockReturnValue({
      data: [{ scenario_id: 's3', name: 'S3', preview: url, annotation: null }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    const img = screen.getByAltText('S3') as HTMLImageElement;
    expect(img.src).toBe(url);
  });
  it('shows loading spinner when isLoading is true', () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows preview image in detail view when scenario has preview', () => {
    const url = 'https://example.com/preview.png';
    useScenariosListQueryMock.mockReturnValue({
      data: [
        {
          scenario_id: 's-thumb',
          name: 'With Thumb',
          preview: url,
          annotation: null,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('With Thumb'));

    expect(screen.getByAltText('With Thumb')).toBeInTheDocument();
  });
  it('clears notice when alert close button is clicked', async () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [
        {
          scenario_id: 'sc-1',
          name: 'Scenario 1',
          preview: null,
          annotation: null,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    handleLoadMock.mockImplementation(
      async ({ setNotice }: { setNotice: (v: string) => void }) => {
        setNotice('The script has been uploaded.');
      },
    );

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Scenario 1'));
    fireEvent.click(screen.getByRole('button', { name: 'Load onto scene' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Close'));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
  it('renders img with absolute-path preview directly', () => {
    const path = '/static/previews/thumb.png';
    useScenariosListQueryMock.mockReturnValue({
      data: [
        { scenario_id: 's4', name: 'S4', preview: path, annotation: null },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    const img = screen.getByAltText('S4') as HTMLImageElement;
    expect(img.src).toContain(path);
  });

  it('wraps plain base64 string in data URI', () => {
    const raw = 'iVBORw0KGgo=';
    useScenariosListQueryMock.mockReturnValue({
      data: [{ scenario_id: 's5', name: 'S5', preview: raw, annotation: null }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    const img = screen.getByAltText('S5') as HTMLImageElement;
    expect(img.src).toBe(`data:image/png;base64,${raw}`);
  });

  it('renders "No preview" placeholder when preview is null', () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [
        { scenario_id: 's6', name: 'S6', preview: null, annotation: null },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    expect(screen.getByText('No preview')).toBeInTheDocument();
  });

  it('calls onClose and resets state when close button clicked from list view', () => {
    const onClose = vi.fn();
    useScenariosListQueryMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows "No preview" box in detail view when selected scenario has no preview', () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [
        { scenario_id: 's7', name: 'S7', preview: null, annotation: null },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('S7'));

    expect(screen.getByText('No preview')).toBeInTheDocument();
    expect(screen.getByTestId('ArrowBackIcon')).toBeTruthy();
  });
  it('does not call handleLoad when selectedScenario has no scenario_id', async () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [
        {
          scenario_id: '',
          name: 'No ID Scenario',
          preview: null,
          annotation: null,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('No ID Scenario'));
    fireEvent.click(screen.getByRole('button', { name: 'Load onto scene' }));

    await waitFor(() => {
      expect(handleLoadMock).not.toHaveBeenCalled();
    });
  });

  it('goes back to list when back button is clicked', () => {
    useScenariosListQueryMock.mockReturnValue({
      data: [
        {
          scenario_id: 's-back',
          name: 'Back Scenario',
          preview: null,
          annotation: null,
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<UploadScenariosModal open onClose={vi.fn()} />);

    fireEvent.click(screen.getByText('Back Scenario'));
    expect(screen.getByTestId('ArrowBackIcon')).toBeTruthy();

    fireEvent.click(screen.getByTestId('ArrowBackIcon').closest('button')!);

    expect(screen.getByText('Load Scenario')).toBeInTheDocument();
  });
});
