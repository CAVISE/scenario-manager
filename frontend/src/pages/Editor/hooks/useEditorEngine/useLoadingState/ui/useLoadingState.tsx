import { useState, useRef, useCallback, useEffect } from 'react';
import { LOADING_STEPS } from '../../../../types/editorTypes';

export function useLoadingState() {
  const isDoneRef = useRef(false);
  const [loadingText, setLoadingText] = useState<string | null>(
    LOADING_STEPS.init.text,
  );
  const [loadingProgress, setLoadingProgress] = useState<number>(
    LOADING_STEPS.init.pct,
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStep = useCallback((step: keyof typeof LOADING_STEPS) => {
    if (isDoneRef.current) return;

    const delay = step === 'done' ? 1000 : 0;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      if (step === 'done') {
        timerRef.current = setTimeout(() => {
          isDoneRef.current = true;
          setLoadingProgress(100);
          setTimeout(() => {
            setLoadingText(null);
          }, 400);
        }, 300);
        return;
      }
    }, delay);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { loadingText, loadingProgress, setStep };
}
