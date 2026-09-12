import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSimulationResults } from './TelemetryModal.hooks';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/api/client', () => ({ api: { get: mocks.get } }));
vi.mock('@/VARS', () => ({ API_URL: 'https://example.test/' }));

const status = { run_id: 'Town03 run', status: 'finished' };
const results = (name: string) => ({
  files: [{ filename: name, url: `/evaluation_outputs/run/${name}` }],
  run_id: 'Town03 run',
});
const respond = (data: unknown) =>
  mocks.get.mockReturnValueOnce({
    json: () => Promise.resolve(data),
  });

beforeEach(() => vi.clearAllMocks());

describe('simulation image loading', () => {
  it('shows plots and excludes downloadable logs, configuration and metadata', async () => {
    respond(status);
    respond({
      ...results('vehicle_velocity.png'),
      files: [
        ...results('vehicle_velocity.png').files,
        ...results('evaluation.txt').files,
        ...results('scenario.yaml').files,
        ...results('metrics.json').files,
      ],
    });
    const { result } = renderHook(() => useSimulationResults(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.images).toEqual({
      'vehicle_velocity.png': {
        default:
          'https://example.test/evaluation_outputs/run/vehicle_velocity.png',
      },
    });
    expect(result.current.isEmpty).toBe(false);
    expect(mocks.get).toHaveBeenCalledWith(
      'api/results/Town03%20run',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('does not request files for an active simulation', async () => {
    respond({ ...status, status: 'running' });
    const { result } = renderHook(() => useSimulationResults(true));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mocks.get).toHaveBeenCalledOnce();
  });

  it('ignores a previous request after the modal is closed and reopened', async () => {
    let finishOldRequest!: (value: unknown) => void;
    respond(status);
    mocks.get.mockReturnValueOnce({
      json: () =>
        new Promise((resolve) => {
          finishOldRequest = resolve;
        }),
    });
    const { result, rerender } = renderHook(
      ({ open }) => useSimulationResults(open),
      { initialProps: { open: true } }
    );
    await waitFor(() => expect(mocks.get).toHaveBeenCalledTimes(2));
    const oldSignal = mocks.get.mock.calls[1][1].signal as AbortSignal;
    rerender({ open: false });
    expect(oldSignal.aborted).toBe(true);
    respond(status);
    respond(results('new.png'));
    rerender({ open: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => finishOldRequest(results('old.png')));
    expect(Object.keys(result.current.images)).toEqual(['new.png']);
  });

  it('distinguishes request errors from a run with no plots', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mocks.get.mockReturnValueOnce({
      json: () => Promise.reject(new Error('offline')),
    });
    try {
      const { result } = renderHook(() => useSimulationResults(true));
      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toContain('Could not load');
      expect(result.current.images).toEqual({});
    } finally {
      consoleError.mockRestore();
    }
  });
});
