import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { handleLoad } from '@right-panel/components/ScenarioControlWidget/Handlers';
import { useAppToast } from '@/components/AppToast';
import { useEditorRefs, useHooks } from '@editor/context';

const MAX_SCENE_WAIT_ATTEMPTS = 20;
const SCENE_WAIT_INTERVAL_MS = 150;

export const EditorScenarioBootstrap = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenarioId = searchParams.get('scenario');
  const { sceneRef } = useEditorRefs();
  const { updateSceneGraph, loadFile, setStep } = useHooks();
  const loadedIdRef = useRef<string | null>(null);
  const toast = useAppToast();

  useEffect(() => {
    if (!scenarioId || loadedIdRef.current === scenarioId) return;

    let cancelled = false;

    const clearScenarioParam = () => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('scenario');
          return next;
        },
        { replace: true },
      );
    };

    const giveUp = () => {
      if (cancelled) return;
      toast.error(
        `Couldn't open scenario "${scenarioId}": the editor scene took too long to load. Try reloading the page.`,
      );
      clearScenarioParam();
    };

    const tryLoad = (attempts = 0) => {
      if (cancelled) return;
      if (!sceneRef.current) {
        if (attempts < MAX_SCENE_WAIT_ATTEMPTS) {
          setTimeout(() => tryLoad(attempts + 1), SCENE_WAIT_INTERVAL_MS);
        } else {
          giveUp();
        }
        return;
      }

      loadedIdRef.current = scenarioId;

      handleLoad({
        hasId: true,
        scenarioIdInput: scenarioId,
        setNotice: (message: string) => {
          if (message) toast.error(message);
        },
        updateSceneGraph,
        loadFile,
        setStep,
      }).finally(() => {
        if (cancelled) return;
        clearScenarioParam();
      });
    };

    tryLoad();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId]);

  return null;
};
