import { createContext, useContext } from 'react';
import { hooksContextTypes } from '../types/hooksContextTypes';

export const HooksContext = createContext<hooksContextTypes | null>(null);

export const useHooks = () => {
  const ctx = useContext(HooksContext);
  if (!ctx) {
    throw new Error('useHooks must be used inside HooksProvider');
  }
  return ctx;
};
