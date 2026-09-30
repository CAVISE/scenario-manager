import { createContext, useContext } from 'react';
import type { PropertiesMode } from '../types/PanelTypes';

export type { PropertiesMode } from '../types/PanelTypes';

export const PropertiesModeContext = createContext<PropertiesMode>('basic');

export function usePropertiesMode(): PropertiesMode {
  return useContext(PropertiesModeContext);
}
