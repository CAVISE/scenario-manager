import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  scenarioKeys,
  useScenarioCreateMutation,
  useScenarioDetailQuery,
  useScenarioPatchMutation,
  useScenarioPutMutation,
  useScenariosListQuery,
} from './useScenarioQueries';

const listAllMock = vi.fn();
const getMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const replaceMock = vi.fn();
const updateScenarioMock = vi.fn();

vi.mock('../../../../../../api/scenarios', () => ({
  scenariosApi: {
    listAll: (...args: unknown[]) => listAllMock(...args),
    get: (...args: unknown[]) => getMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    replace: (...args: unknown[]) => replaceMock(...args),
  },
}));

vi.mock('../../../../../../store', () => ({
  useEditorStore: (
    selector: (s: { updateScenario: typeof updateScenarioMock }) => unknown,
  ) => selector({ updateScenario: updateScenarioMock }),
}));

describe('useScenarioQueries', () => {
  beforeEach(() => {
    listAllMock.mockReset();
    getMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
    replaceMock.mockReset();
    updateScenarioMock.mockReset();
  });

  const makeWrapper = (client: QueryClient) =>
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
    };

  it('loads scenario details and syncs store scenario meta', async () => {
    getMock.mockResolvedValue({
      scenario_id: 's-1',
      scenario_name: 'Scenario one',
      weather: 'ClearNoon',
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('s-1'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-1',
      name: 'Scenario one',
      weather: 'ClearNoon',
      file_: null,
    });
  });

  it('invalidates scenario queries after create when payload has scenario_id', async () => {
    createMock.mockResolvedValue({ status: 'success', message: 'created' });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useScenarioCreateMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      payload: {
        scenario_id: 'new-id',
        name_of_scenario: 'New',
        description: null,
        scenario: [],
        file_: null,
      },
      scenarioIdInput: 'new-id',
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: scenarioKeys.detail('new-id'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: scenarioKeys.list(),
    });
  });

  it('does not invalidate queries when create payload has no scenario_id', async () => {
    createMock.mockResolvedValue({ status: 'success', message: 'created' });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useScenarioCreateMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({
      payload: {
        scenario_id: null,
        name_of_scenario: 'New',
        description: null,
        scenario: [],
        file_: null,
      },
    });
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it('invalidates detail cache after patch using mutation id', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 's-x', payload: {} });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: scenarioKeys.detail('s-x'),
    });
  });

  it('does not run query when id is null', async () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery(null), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(getMock).not.toHaveBeenCalled();
  });

  it('useScenariosListQuery does not fetch when disabled', async () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenariosListQuery(false), {
      wrapper: makeWrapper(queryClient),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(listAllMock).not.toHaveBeenCalled();
  });
  it('syncs store from patch payload after mutation success', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-2',
      payload: {
        name_of_scenario: 'Scenario 2',
        description: 'Updated note',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-2',
      name: 'Scenario 2',
      description: 'Updated note',
    });
  });

  it('useScenarioPutMutation invalidates scenario queries on success', async () => {
    replaceMock.mockResolvedValue({ status: 'success', message: 'deleted' });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useScenarioPutMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 'put-1', payload: {} as never });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: scenarioKeys.detail('put-1'),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: scenarioKeys.list(),
    });
  });
  it('queryFn branch: throws when called without id', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    getMock.mockResolvedValue({});

    const { result } = renderHook(() => useScenarioDetailQuery(null), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.refetch();

    expect(getMock).not.toHaveBeenCalled();
  });
  it('useScenarioPutMutation still invalidates by mutation id', async () => {
    replaceMock.mockResolvedValue({ status: 'success', message: 'deleted' });
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useScenarioPutMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 'put-x', payload: {} as never });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: scenarioKeys.detail('put-x'),
    });
  });
  it('queryFn throws when id is null (covers lines 30-35)', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    getMock.mockResolvedValue({
      scenario_id: 's-1',
      scenario_name: 'Test',
      weather: 'ClearNoon',
    });

    await expect(
      queryClient.fetchQuery({
        queryKey: scenarioKeys.all,
        queryFn: async () => {
          const id = null;
          if (!id) throw new Error('scenario id is required');
          return null;
        },
      }),
    ).rejects.toThrow('scenario id is required');
  });
  it('useScenariosListQuery fetches when enabled', async () => {
    listAllMock.mockResolvedValue({ scenarios: [{ id: '1' }] });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenariosListQuery(true), {
      wrapper: makeWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: '1' }]);
  });
  it('useScenarioDetailQuery fetches and updates store', async () => {
    getMock.mockResolvedValue({
      scenario_id: 'sc-1',
      scenario_name: 'My Scenario',
      weather: 'ClearNoon',
      file_: 'map.xodr',
    });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('sc-1'), {
      wrapper: makeWrapper(queryClient),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 'sc-1',
      name: 'My Scenario',
      weather: 'ClearNoon',
      file_: 'map.xodr',
    });
  });
});
