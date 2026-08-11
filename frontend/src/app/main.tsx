import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../api/queryClient';
import { AppToastProvider } from '../shared/ui/AppToast';
import { AppThemeProvider } from '../shared/styles/AppThemeProvider';
import './main.scss';

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
  </StrictMode>,
);
