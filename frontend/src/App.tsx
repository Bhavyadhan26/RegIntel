import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Home } from "@/pages/Home";
import { Signup } from "@/pages/Signup";
import { Login } from "@/pages/Login";
import { ProfessionSelection } from "@/pages/ProfessionSelection";
import { Dashboard } from "@/pages/Dashboard";
import { Alerts } from "@/pages/Alerts";
import Feedback from '@/pages/Feedback';
import Deadlines from "@/pages/Deadlines";
import Publications from "@/pages/Publications";

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
        <Route path="/publications" element={<Publications />} /> {/* <--- 2. Add the Route */}
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/deadlines" element={<Deadlines />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;