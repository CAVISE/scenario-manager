import { Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage/ui/StartPage.tsx';
import { NotFoundPage } from './pages/Editor/Skeletons/EditorNotFoundPage';
import { HooksProvider } from './pages/Editor/context';
import { EditorRefsProvider } from './pages/Editor/context';
import { lazy, Suspense } from 'react';
import { AppLoader } from './pages/Editor/Skeletons/EditorLoader.tsx';
import WorkspaceLayout from './pages/Workspace/WorkspaceLayout';
import ScenariosPage from './pages/Workspace/ScenariosPage';
import SettingsPage from './pages/Workspace/SettingsPage';
const Editor = lazy(() => import('./pages/Editor.tsx'));
function App() {
  return (
    <main>
      <Routes>
        <Route element={<WorkspaceLayout />}>
          <Route path="/" element={<StartPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
  );
}

export default App;
