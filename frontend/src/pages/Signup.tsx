import { useState } from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { apiRegister } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const Signup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrors({ confirm_password: "Passwords do not match" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await apiRegister({ full_name: fullName, email, password, confirm_password: confirmPassword });
      await refreshUser();
      navigate("/select-profession", { replace: true });
    } catch (err: unknown) {
      const data = err as Record<string, string | string[]>;
      const flat: Record<string, string> = {};
      for (const key in data) {
        const val = data[key];
        flat[key] = Array.isArray(val) ? val[0] : String(val);
      }
      setErrors(flat);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Header */}
      <div className="p-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/WEBLOGO.png" alt="RegIntel Logo" className="h-10 w-auto" />
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
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                {errors.full_name && <p className="text-xs text-red-600">{errors.full_name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Email Address</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                    }}
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
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirm_password) setErrors((p) => ({ ...p, confirm_password: '' }));
                    }}
                    required
                  />
                </div>
                {errors.confirm_password && <p className="text-xs text-red-600">{errors.confirm_password}</p>}
              </div>

              {errors.non_field_errors && (
                <p className="text-sm font-medium text-red-600">{errors.non_field_errors}</p>
              )}

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
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-6 text-center text-xs text-text-muted">
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
