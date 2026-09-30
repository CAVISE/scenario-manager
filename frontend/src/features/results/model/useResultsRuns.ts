import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { useEditorStore } from '@/store';
import type { ResultResponse, ResultRun } from '../types/results';

export function useResultsRuns(preferredRunId?: string | null) {
  const runId = useEditorStore((state) => state.simulationSession.runId);
  const phase = useEditorStore((state) => state.simulationSession.phase);
  const [runs, setRuns] = useState<ResultRun[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [responses, setResponses] = useState<ResultResponse[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setRunsLoading(true);
    setRunsError(null);
    api
      .get('api/results', { signal: controller.signal })
      .json<ResultRun[]>()
      .then((items) => {
        if (controller.signal.aborted) return;
        setRuns(items);
        setSelected((current) => {
          const retained = current.filter((id) =>
            items.some((item) => item.run_id === id)
          );
          if (retained.length) return retained;
          const preferred =
            items.find((item) => item.run_id === preferredRunId) ??
            items.find((item) => item.run_id === runId) ??
            items[0];
          return preferred ? [preferred.run_id] : [];
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRuns([]);
        setSelected([]);
        setResponses([]);
        setRunsError('Could not load run history. Refresh to try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setRunsLoading(false);
      });
    return () => controller.abort();
  }, [preferredRunId, runId, phase, refresh]);

  useEffect(() => {
    const controller = new AbortController();
    setResponses([]);
    setFilesError(null);
    setFilesLoading(false);
    if (!selected.length) return () => controller.abort();
    setFilesLoading(true);
    Promise.all(
      selected.map((id) =>
        api
          .get(`api/results/${encodeURIComponent(id)}`, {
            signal: controller.signal,
          })
          .json<ResultResponse>()
      )
    )
      .then((items) => {
        if (!controller.signal.aborted) setResponses(items);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setFilesError('Could not load result files. Refresh to try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setFilesLoading(false);
      });
    return () => controller.abort();
  }, [selected, refresh]);

  const refreshResults = useCallback(() => {
    setRefresh((value) => value + 1);
  }, []);

  const toggleRun = useCallback((runId: string) => {
    setSelected((current) =>
      current.includes(runId)
        ? current.filter((id) => id !== runId)
        : [...current.slice(-1), runId]
    );
  }, []);

  return {
    runs,
    selected,
    responses,
    loading: runsLoading || filesLoading,
    runsError,
    filesError,
    refreshResults,
    toggleRun,
  };
}
