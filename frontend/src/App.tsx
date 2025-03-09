import { Routes, Route } from "react-router-dom";
import './App.css'

import ParamsPage from "./pages/Params"
import Paths from "./pages/Paths";
import StartPage from "./pages/StartPage"
import Reports from "./pages/Reports";
import Editor from "./pages/Editor.tsx";

function App() {
  return (<main>
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/params" element={<ParamsPage />} />
      <Route path="/paths" element={<Paths />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/editor" element={<Editor />}   />
    </Routes>
    </main>)
}

export default App
