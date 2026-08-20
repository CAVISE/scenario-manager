import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
import {
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast,
} from 'three-mesh-bvh';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './api/queryClient';
import { AppToastProvider } from './components/AppToast';
import { AppThemeProvider } from './theme/AppThemeProvider';
import './main.scss';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <AppToastProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </AppToastProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
