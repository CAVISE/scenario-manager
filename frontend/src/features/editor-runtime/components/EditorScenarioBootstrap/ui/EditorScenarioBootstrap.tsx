import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { handleLoad } from '@right-panel/components/ScenarioControlWidget/Handlers';
import { useAppToast } from '@/shared/ui/AppToast';
import { useHooks } from '@editor/context';

export const EditorScenarioBootstrap = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenarioId = searchParams.get('scenario');
  const { updateSceneGraph, loadFile, setStep, loadingText } = useHooks();
  const loadedIdRef = useRef<string | null>(null);
  const toast = useAppToast();
  const [runtimeReady, setRuntimeReady] = useState(false);
  const callbacksRef = useRef({ updateSceneGraph, loadFile, setStep, toast });
  callbacksRef.current = { updateSceneGraph, loadFile, setStep, toast };

  useEffect(() => {
    // A Three.js scene alone is not enough: WASM and the initial map must
    // finish loading first. Latch readiness so the scenario's own loading
    // steps do not cancel its bootstrap effect.
    if (loadingText === null) setRuntimeReady(true);
  }, [loadingText]);

  useEffect(() => {
    if (!runtimeReady || !scenarioId || loadedIdRef.current === scenarioId) {
      return;
    }

    let cancelled = false;
    loadedIdRef.current = scenarioId;
    const { updateSceneGraph, loadFile, setStep } = callbacksRef.current;

    void handleLoad({
      hasId: true,
      scenarioIdInput: scenarioId,
      setNotice: (message: string) => {
        if (!cancelled && message) callbacksRef.current.toast.error(message);
      },
      updateSceneGraph,
      loadFile,
      setStep,
    }).finally(() => {
      if (cancelled) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (next.get('scenario') === scenarioId) next.delete('scenario');
          return next;
        },
        { replace: true }
      );
    });

    return () => {
      cancelled = true;
    };
  }, [scenarioId, setSearchParams, runtimeReady]);

  return null;
};
