import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  scenarioKeys,
  useScenarioCreateMutation,
  useScenarioDetailQuery,
  useScenarioPatchMutation,
  useScenarioDeleteMutation,
  useScenariosListQuery,
} from './useScenarioQueries';

const listAllMock = vi.fn();
const getMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();
const removeMock = vi.fn();
const updateScenarioMock = vi.fn();

vi.mock('@/api/scenarios', () => ({
  scenariosApi: {
    listAll: (...args: unknown[]) => listAllMock(...args),
    get: (...args: unknown[]) => getMock(...args),
    create: (...args: unknown[]) => createMock(...args),
    update: (...args: unknown[]) => updateMock(...args),
    remove: (...args: unknown[]) => removeMock(...args),
  },
}));

vi.mock('@/store', () => ({
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
    removeMock.mockReset();
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
      description: 'Scenario one note',
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
      description: 'Scenario one note',
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

  it('useScenarioDeleteMutation removes cached scenario and invalidates the list on success', async () => {
    removeMock.mockResolvedValue({ status: 'success', message: 'deleted' });
    const queryClient = new QueryClient();
    const removeQueries = vi.spyOn(queryClient, 'removeQueries');
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useScenarioDeleteMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 'put-1', payload: {} as never });
    expect(removeQueries).toHaveBeenCalledWith({
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
  it('useScenarioDeleteMutation removes cache entry by mutation id', async () => {
    removeMock.mockResolvedValue({ status: 'success', message: 'deleted' });
    const queryClient = new QueryClient();
    const removeQueries = vi.spyOn(queryClient, 'removeQueries');
    const { result } = renderHook(() => useScenarioDeleteMutation(), {
      wrapper: makeWrapper(queryClient),
    });
    await result.current.mutateAsync({ id: 'put-x', payload: {} as never });
    expect(removeQueries).toHaveBeenCalledWith({
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
      description: 'Detailed notes',
      file_: '<OpenDRIVE></OpenDRIVE>',
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
      description: 'Detailed notes',
      file_: '<OpenDRIVE></OpenDRIVE>',
    });
  });
  it('covers lines 33-36: updates store with scenario data using scenario_name', async () => {
    getMock.mockResolvedValue({
      scenario_id: 'sc-2',
      scenario_name: 'Scenario Name Only',
      weather: 'Sunny',
      description: 'Description only',
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('sc-2'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 'sc-2',
      name: 'Scenario Name Only',
      weather: 'Sunny',
      description: 'Description only',
      file_: null,
    });
  });

  it('covers lines 33-36: updates store with scenario data using name_of_scenario', async () => {
    getMock.mockResolvedValue({
      scenario_id: 'sc-3',
      name_of_scenario: 'Name Of Scenario',
      weather: 'Rainy',
      description: 'Description from name_of_scenario',
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('sc-3'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 'sc-3',
      name: 'Name Of Scenario',
      weather: 'Rainy',
      description: 'Description from name_of_scenario',
      file_: null,
    });
  });

  it('covers lines 33-36: handles missing scenario_name and name_of_scenario', async () => {
    getMock.mockResolvedValue({
      scenario_id: 'sc-4',
      weather: 'Cloudy',
      description: 'Description only',
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('sc-4'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 'sc-4',
      name: '',
      weather: 'Cloudy',
      description: 'Description only',
      file_: null,
    });
  });

  it('covers weather and file_ update in patch mutation', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-5',
      payload: {
        name_of_scenario: 'Scenario 5',
        description: 'Description 5',
        weather: 'Snowy',
        file_: '<OpenDRIVE>updated</OpenDRIVE>',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-5',
      name: 'Scenario 5',
      description: 'Description 5',
      weather: 'Snowy',
      file_: '<OpenDRIVE>updated</OpenDRIVE>',
    });
  });

  it('covers weather update only in patch mutation', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-6',
      payload: {
        weather: 'Windy',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-6',
      weather: 'Windy',
    });
  });

  it('covers file_ update only in patch mutation', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-7',
      payload: {
        file_: '<OpenDRIVE>new file</OpenDRIVE>',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-7',
      file_: '<OpenDRIVE>new file</OpenDRIVE>',
    });
  });

  it('covers weather and file_ updates separately in patch mutation', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-8',
      payload: {
        weather: 'Foggy',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-8',
      weather: 'Foggy',
    });

    await result.current.mutateAsync({
      id: 's-8',
      payload: {
        file_: '<OpenDRIVE>updated again</OpenDRIVE>',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-8',
      file_: '<OpenDRIVE>updated again</OpenDRIVE>',
    });
  });
  it('covers line 33: updates store with scenario_id using nullish coalescing', async () => {
    getMock.mockResolvedValue({
      scenario_id: null,
      scenario_name: 'Test',
      weather: 'Clear',
      description: 'Desc',
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('test-id'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: '',
      name: 'Test',
      weather: 'Clear',
      description: 'Desc',
      file_: null,
    });
  });

  it('covers line 35: updates store with weather using nullish coalescing', async () => {
    getMock.mockResolvedValue({
      scenario_id: 's-5',
      scenario_name: 'Weather Test',
      weather: null,
      description: 'Desc',
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('s-5'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-5',
      name: 'Weather Test',
      weather: '',
      description: 'Desc',
      file_: null,
    });
  });

  it('covers line 36: updates store with description using nullish coalescing', async () => {
    getMock.mockResolvedValue({
      scenario_id: 's-6',
      scenario_name: 'Description Test',
      weather: 'Sunny',
      description: null,
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('s-6'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-6',
      name: 'Description Test',
      weather: 'Sunny',
      description: '',
      file_: null,
    });
  });

  it('covers lines 33, 35, 36: all fields null/undefined', async () => {
    getMock.mockResolvedValue({
      scenario_id: undefined,
      scenario_name: 'All Null Test',
      weather: undefined,
      description: undefined,
    });

    const queryClient = new QueryClient();
    const { result } = renderHook(() => useScenarioDetailQuery('s-7'), {
      wrapper: makeWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: '',
      name: 'All Null Test',
      weather: '',
      description: '',
      file_: null,
    });
  });

  it('covers weather update in patch mutation with undefined check', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-8',
      payload: {
        weather: 'Stormy',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-8',
      weather: 'Stormy',
    });
  });

  it('covers file_ update in patch mutation with undefined check', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-9',
      payload: {
        file_: '<OpenDRIVE>new file content</OpenDRIVE>',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-9',
      file_: '<OpenDRIVE>new file content</OpenDRIVE>',
    });
  });

  it('covers both weather and file_ updates together in patch', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-10',
      payload: {
        weather: 'Rainy',
        file_: '<OpenDRIVE>updated file</OpenDRIVE>',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-10',
      weather: 'Rainy',
      file_: '<OpenDRIVE>updated file</OpenDRIVE>',
    });
  });

  it('covers patch with name, description, weather and file_ all together', async () => {
    updateMock.mockResolvedValue({ status: 'success', message: 'updated' });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useScenarioPatchMutation(), {
      wrapper: makeWrapper(queryClient),
    });

    await result.current.mutateAsync({
      id: 's-11',
      payload: {
        name_of_scenario: 'Full Update',
        description: 'Full description',
        weather: 'Snowy',
        file_: '<OpenDRIVE>full file</OpenDRIVE>',
      },
    });
    expect(updateScenarioMock).toHaveBeenCalledWith({
      id: 's-11',
      name: 'Full Update',
      description: 'Full description',
      weather: 'Snowy',
      file_: '<OpenDRIVE>full file</OpenDRIVE>',
    });
  });
});
