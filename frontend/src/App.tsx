import { Routes, Route } from "react-router-dom";
import StartPage from "./pages/StartPage"
import Editor from "./pages/Editor.tsx";
import { NotFoundPage } from "./pages/Editor/Sceletons/EditorNotFoundPage.tsx";
import { EditorRefsProvider } from "./pages/Editor/context/EditorRefsProvider.tsx";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/"       element={<StartPage />} />
        <Route path="/editor" 
          element=
                {<EditorRefsProvider>
                    <Editor />
                  </EditorRefsProvider>
                } />
        <Route path="*"       element={<NotFoundPage />} />
      </Routes>
    </main>
  );
}

export default App;