import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import { LogoutOverlay } from "@/components/LogoutOverlay";
import { Home } from "@/pages/Home";
import { Signup } from "@/pages/Signup";
import { Login } from "@/pages/Login";
import { ForgotPassword } from "@/pages/ForgotPassword";
import { ResetPassword } from "@/pages/ResetPassword";
import { ProfessionSelection } from "@/pages/ProfessionSelection";
import { Dashboard } from "@/pages/Dashboard";
import { Alerts } from "@/pages/Alerts";
import Feedback from '@/pages/Feedback';
import Deadlines from "@/pages/Deadlines";
import Publications from "@/pages/Publications";
import { UserProfile } from "@/pages/Profile";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";

function App() {
  return (
    <AuthProvider>
      <LogoutOverlay />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
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
          
          {/* ADMIN ROUTES */}
          <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;