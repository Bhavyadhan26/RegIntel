import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { apiLogin } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Smiley } from "@/components/Smiley";

export const Login = () => {
  const DASHBOARD_INFO_MODAL_KEY = "dashboard_info_modal_pending";
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      setUser(data.user);
      sessionStorage.setItem(DASHBOARD_INFO_MODAL_KEY, "1");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { detail?: string })?.detail ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/assets/logo1.png" alt="RegIntel Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold text-text-main">RegIntel</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
          <CardHeader className="text-center pb-8">
            <Smiley isEyesClosed={isPasswordFocused} />
            <CardTitle className="text-2xl font-bold text-text-main">Welcome to RegIntel</CardTitle>
            <CardDescription className="text-text-muted mt-2">
              Please enter your credentials to access the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-text-main">Password</label>
                  <a href="#" className="text-xs font-medium text-text-muted hover:text-text-main">Forgot?</a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full h-11 text-base bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20" isLoading={loading}>
                Sign In →
              </Button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-sm text-text-muted">
                Don't have an account? <Link to="/signup" className="font-semibold text-primary hover:underline">Request Access</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="pb-6 text-center text-[10px] text-gray-400 tracking-widest">
        © 2026 RegIntel Intelligence Systems. All rights reserved.
      </div>
    </div>
  );
};
