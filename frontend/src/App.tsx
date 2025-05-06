import { Route, Routes } from "react-router-dom"
import Home from "./components/home"
import Register from "./components/register"

function App() {

  return (
   <Routes >
      <Route path="/" element={<Home />} />
      <Route path="/register/:label" element={<Register />} />
   </Routes>
  )
}

export default App
