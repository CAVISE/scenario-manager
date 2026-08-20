import { LOADING_STEPS } from '@editor/types/editorTypes';
import { useState, useRef, useCallback, useEffect } from 'react';

export function useLoadingState() {
  const isDoneRef = useRef(false);
  const [loadingText, setLoadingText] = useState<string | null>(
    LOADING_STEPS.init.text
  );
  const [loadingProgress, setLoadingProgress] = useState<number>(
    LOADING_STEPS.init.pct
  );

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const setStep = useCallback(
    (step: keyof typeof LOADING_STEPS) => {
      console.log('[setStep] called with:', step);
      clearTimers();

      if (step === 'done') {
        setLoadingProgress(LOADING_STEPS.done.pct);
        const t = setTimeout(() => {
          setLoadingText(null);
          isDoneRef.current = true;
        }, 450);
        timersRef.current.push(t);
        return;
      }

      isDoneRef.current = false;
      const cfg = LOADING_STEPS[step];
      setLoadingText(cfg.text);
      setLoadingProgress(cfg.pct);
    },
    [clearTimers]
  );

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return { loadingText, loadingProgress, setStep };
}
