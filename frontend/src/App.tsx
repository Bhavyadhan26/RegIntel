import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Signup } from "@/pages/Signup";
import { Login } from "@/pages/Login";
import { ProfessionSelection } from "@/pages/ProfessionSelection";
import { Dashboard } from "@/pages/Dashboard"; // <--- Import
import { Alerts } from "@/pages/Alerts";       // <--- Import
import { Deadlines } from "@/pages/Deadlines"; // <--- Import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/select-profession" element={<ProfessionSelection />} />
        
        {/* DASHBOARD ROUTES */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/deadlines" element={<Deadlines />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;