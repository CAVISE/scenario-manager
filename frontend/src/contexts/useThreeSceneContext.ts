import { useContext } from 'react';
import { ThreeSceneContext } from './ThreeSceneContext';


export const useThreeSceneContext = () => {
  const context = useContext(ThreeSceneContext);
  if (!context) {
    throw new Error('useThreeSceneContext must be used within a ThreeSceneProvider');
  }
  return context;
};