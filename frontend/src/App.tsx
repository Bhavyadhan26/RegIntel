import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { Home } from "@/pages/Home";
import { Signup } from "@/pages/Signup";
import { Login } from "@/pages/Login";
import { ProfessionSelection } from "@/pages/ProfessionSelection";
import { Dashboard } from "@/pages/Dashboard";
import { Alerts } from "@/pages/Alerts";
import Feedback from '@/pages/Feedback';
import Deadlines from "@/pages/Deadlines";
import Publications from "@/pages/Publications";
import { UserProfile } from "@/pages/Profile";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/select-profession"
            element={
              <ProtectedRoute>
                <ProfessionSelection />
              </ProtectedRoute>
            }
          />

          {/* DASHBOARD ROUTES */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/publications" element={<ProtectedRoute><Publications /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/deadlines" element={<ProtectedRoute><Deadlines /></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;