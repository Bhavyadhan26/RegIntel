import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
          </div>
          <span className="text-xl font-bold text-text-main">RegIntel</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
              <Lock size={20} />
            </div>
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

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="remember" className="rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="remember" className="text-sm text-text-muted">Remember this device for 30 days</label>
              </div>

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

      {/* Footer Links */}
      <div className="py-6 text-center space-x-6 text-xs text-text-muted">
        <a href="#" className="hover:text-text-main">Privacy Policy</a>
        <a href="#" className="hover:text-text-main">Terms of Service</a>
        <a href="#" className="hover:text-text-main">Contact Admin</a>
      </div>
      <div className="pb-6 text-center text-[10px] text-gray-400 uppercase tracking-widest">
        © 2024 RegIntel Security Systems. All Rights Reserved.
      </div>
    </div>
  );
};
