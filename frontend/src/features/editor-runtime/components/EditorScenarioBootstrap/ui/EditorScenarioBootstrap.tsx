import { useEffect, useLayoutEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { handleLoad } from '@right-panel/components/ScenarioControlWidget/Handlers';
import { useAppToast } from '@/shared/ui/AppToast';
import { useHooks } from '@editor/context';

export const EditorScenarioBootstrap = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenarioId = searchParams.get('scenario');
  const { updateSceneGraph, loadFile, setStep, runtimeReady } = useHooks();
  const toast = useAppToast();

  const loadedIdRef = useRef<string | null>(null);
  const aliveRef = useRef(true);
  const callbacksRef = useRef({ updateSceneGraph, loadFile, setStep, toast });
  callbacksRef.current = { updateSceneGraph, loadFile, setStep, toast };

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);
  useLayoutEffect(() => {
    if (!scenarioId || loadedIdRef.current === scenarioId) return;
    if (!runtimeReady) return;
    loadedIdRef.current = scenarioId;
    const { updateSceneGraph, loadFile, setStep } = callbacksRef.current;

    void handleLoad({
      hasId: true,
      scenarioIdInput: scenarioId,
      setNotice: (message: string) => {
        if (aliveRef.current && message)
          callbacksRef.current.toast.error(message);
      },
      updateSceneGraph,
      loadFile,
      setStep,
      initializeMapWhenMissing: true,
    }).finally(() => {
      if (!aliveRef.current) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (next.get('scenario') === scenarioId) next.delete('scenario');
          return next;
        },
        { replace: true }
      );
    });
  }, [scenarioId, runtimeReady, setSearchParams]);

  return null;
};
