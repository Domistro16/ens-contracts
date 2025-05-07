import { Route, Routes } from "react-router-dom"
import Home from "./components/home"
import Register from "./components/register"
import Resolve from "./components/resolve"

function App() {

  return (
   <Routes >
      <Route path="/" element={<Home />} />
      <Route path="/register/:label" element={<Register />} />
      <Route path="/resolve/:label" element={<Resolve />} />
   </Routes>
  )
}

export default App
