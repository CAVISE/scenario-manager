import * as THREE from 'three';
import type { ToastApi } from '../../../../shared/ui/AppToast/toast.types';

export interface SharedMouseContext {
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
  setMouse: (e: MouseEvent) => void;
  insideEditorCanvas: (e: MouseEvent) => boolean;
}

export interface UseKeyDownHandlerProps {
  toast: ToastApi;
}
