import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  scenarioKeys,
  useScenarioCreateMutation,
  useScenarioDetailQuery,
  useScenarioPatchMutation,
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
  useEditorStore: (selector: (s: { updateScenario: typeof updateScenarioMock }) => unknown) =>
    selector({ updateScenario: updateScenarioMock }),
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
      return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
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
    });
  });
});
