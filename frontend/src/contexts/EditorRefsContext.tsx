import { createContext } from 'react';
import { EditorRefs } from '../pages/Editor/hooks/useEditorLogic';

export const EditorRefsContext = createContext<EditorRefs | null>(null);