import { useContext } from 'react';
import { EditorRefsContext } from './EditorRefsContext';

export const useEditorRefs = () => {
  const context = useContext(EditorRefsContext);
  if (!context) {
    throw new Error('useEditorRefs must be used within an EditorRefsProvider');
  }
  return context;
};