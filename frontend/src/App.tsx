import { Routes, Route } from "react-router-dom";
import './App.css'

import ParamsPage from "./pages/Params"
import Paths from "./pages/Paths";
import StartPage from "./pages/StartPage"

function App() {
  return (<main>
    <Routes>
      <Route path="/" element={<StartPage />} />
      <Route path="/params" element={<ParamsPage />} />
      <Route path="/paths" element={<Paths />} />
    </Routes>
    </main>)
}

export default App
