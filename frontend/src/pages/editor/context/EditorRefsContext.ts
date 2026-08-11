import { createContext, useContext } from 'react';
import type { EditorRefs } from './EditorRefs.types';

export const EditorRefsContext = createContext<EditorRefs | null>(null);

export const useEditorRefs = () => {
  const ctx = useContext(EditorRefsContext);
  if (!ctx)
    throw new Error('useEditorRefs must be used inside EditorRefsProvider');
  return ctx;
};
