import { createContext, useContext } from 'react';
import type { EditorRefs } from '../types/EditorRefsTypes';

export const EditorRefsContext = createContext<EditorRefs | null>(null);

export const useEditorRefs = () => {
  const ctx = useContext(EditorRefsContext);
  if (!ctx)
    throw new Error('useEditorRefs must be used inside EditorRefsProvider');
  return ctx;
};
