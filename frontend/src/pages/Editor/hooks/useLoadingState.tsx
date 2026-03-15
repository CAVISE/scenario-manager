import { useState } from 'react';
import { LOADING_STEPS } from '../types/editorTypes';

export function useLoadingState() {
  const [loadingText,     setLoadingText]     = useState<string | null>(LOADING_STEPS.init.text);
  const [loadingProgress, setLoadingProgress] = useState<number>(LOADING_STEPS.init.pct);

  const setStep = (step: keyof typeof LOADING_STEPS) => {
    const delay = step === 'done' ? 1000 : 0
    setTimeout(() => {
      setLoadingText(LOADING_STEPS[step].text);
      setLoadingProgress(LOADING_STEPS[step].pct);
    }, delay);
  };

  return { loadingText, loadingProgress, setStep };
}
