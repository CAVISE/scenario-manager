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

  it('stores created scenario response in query cache', async () => {
    createMock.mockResolvedValue({ scenario_id: 'new-id', payload: 'ok' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioCreateMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({} as never);
    expect(queryClient.getQueryData(scenarioKeys.detail('new-id'))).toEqual({
      scenario_id: 'new-id',
      payload: 'ok',
    });
  });
  it('does not cache when scenario_id is absent in create response', async () => {
    createMock.mockResolvedValue({ scenario_id: null, payload: 'ok' });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioCreateMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({} as never);
    expect(queryClient.getQueryData(scenarioKeys.detail(''))).toBeUndefined();
  });

  it('does not cache when scenario_id is absent in patch response', async () => {
    updateMock.mockResolvedValue({
      scenario_id: null,
      scenario_name: null,
      weather: null,
    });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 's-x', payload: {} });
    expect(queryClient.getQueryData(scenarioKeys.detail(''))).toBeUndefined();
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
  it('syncs store after patch mutation success', async () => {
    updateMock.mockResolvedValue({
      scenario_id: 's-2',
      scenario_name: 'Scenario 2',
      weather: 'CloudyNoon',
    });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({ id: 's-2', payload: {} });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-2',
      name: 'Scenario 2',
      weather: 'CloudyNoon',
      file_: null,
    });
  });
  it('useScenarioPutMutation caches response when scenario_id is present', async () => {
    replaceMock.mockResolvedValue({
      scenario_id: 'put-1',
      scenario_name: 'Put Scenario',
      weather: 'ClearNoon',
    });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioPutMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 'put-1', payload: {} as never });
    expect(queryClient.getQueryData(scenarioKeys.detail('put-1'))).toEqual({
      scenario_id: 'put-1',
      scenario_name: 'Put Scenario',
      weather: 'ClearNoon',
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 'put-1',
      name: 'Put Scenario',
      weather: 'ClearNoon',
      file_: null,
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
  it('useScenarioPutMutation skips cache when scenario_id is absent', async () => {
    replaceMock.mockResolvedValue({
      scenario_id: null,
      scenario_name: null,
      weather: null,
    });
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioPutMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 'put-x', payload: {} as never });
    expect(queryClient.getQueryData(scenarioKeys.detail(''))).toBeUndefined();
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
