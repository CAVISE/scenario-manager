import { createContext, useContext } from 'react';

export type PropertiesMode = 'basic' | 'advanced';

export const PropertiesModeContext = createContext<PropertiesMode>('basic');

export function usePropertiesMode(): PropertiesMode {
  return useContext(PropertiesModeContext);
}
