import { createContext } from 'react';
import { ThreeSceneRefs } from './ThreeSceneTypes';

export const ThreeSceneContext = createContext<ThreeSceneRefs | null>(null);