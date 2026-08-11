import { Routes, Route } from 'react-router-dom';
import StartPage from '../pages/StartPage';
import { NotFoundPage } from '../pages/editor/skeletons/EditorNotFoundPage';
import { HooksProvider } from '../pages/editor/context';
import { EditorRefsProvider } from '../pages/editor/context';
import { lazy, Suspense } from 'react';
import { AppLoader } from '../pages/editor/skeletons/EditorLoader';
const Editor = lazy(() => import('../pages/editor/Editor'));
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
