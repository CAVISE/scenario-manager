import { Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage/ui/StartPage.tsx';
import { NotFoundPage } from './features/editor-runtime/Skeletons/EditorNotFoundPage';
import { HooksProvider } from './features/editor-runtime/context';
import { EditorRefsProvider } from './features/editor-runtime/context';
import { lazy, Suspense } from 'react';
import { AppLoader } from './features/editor-runtime/Skeletons/EditorLoader.tsx';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import ScenariosPage from './pages/Workspace/ScenariosPage';
import SettingsPage from './pages/Workspace/SettingsPage';
import RunsPage from './pages/Workspace/RunsPage';
import { AuthGate } from './features/auth';
const Editor = lazy(() => import('./pages/Editor.tsx'));
function App() {
  return (
    <AuthGate>
      <main>
        <Routes>
          <Route element={<WorkspaceLayout />}>
            <Route path="/" element={<StartPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/runs" element={<RunsPage />} />
          </Route>
          <Route
            path="/editor"
            element={
              <Suspense fallback={<AppLoader />}>
                <EditorRefsProvider>
                  <HooksProvider>
                    <Editor />
                  </HooksProvider>
                </EditorRefsProvider>
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </AuthGate>
  );
}

export default App;
