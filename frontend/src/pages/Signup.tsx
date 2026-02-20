import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate signup
    setTimeout(() => {
      setLoading(false);
      navigate("/select-profession"); // Go to step 2
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
              <UserPlus size={20} />
            </div>
            <CardTitle className="text-2xl font-bold text-text-main">Create your account</CardTitle>
            <CardDescription className="text-text-muted mt-2">
              Start your regulatory intelligence journey.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Full Name</label>
                <Input type="text" placeholder="John Doe" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Email Address</label>
                <Input type="email" placeholder="name@company.com" required />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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

              <Button type="submit" className="w-full h-11 text-base bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20" isLoading={loading}>
                Create Account →
              </Button>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-gray-100">
              <p className="text-sm text-text-muted">
                Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Sign In</Link>
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
