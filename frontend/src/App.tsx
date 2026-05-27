import { Routes, Route } from 'react-router-dom';
import StartPage from './pages/StartPage';
import { NotFoundPage } from './pages/Editor/Skeletons/EditorNotFoundPage';
import { HooksProvider } from './pages/Editor/context';
import { EditorRefsProvider } from './pages/Editor/context';
import { lazy, Suspense } from 'react';
import { AppLoader } from './pages/Editor/Skeletons/EditorLoader.tsx';
const Editor = lazy(() => import('./pages/Editor.tsx'));
function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<StartPage />} />
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
