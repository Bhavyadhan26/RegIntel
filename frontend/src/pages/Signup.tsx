import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { apiRegister } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Smiley } from "@/components/Smiley";

export const Signup = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFieldFocused, setIsPasswordFieldFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const passwordRules = {
    length: password.length >= 8,
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    uppercase: /[A-Z]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const passwordRuleItems = [
    { key: "length", label: "Must be 8 characters long", valid: passwordRules.length },
    { key: "digit", label: "Must contain at least one digit", valid: passwordRules.digit },
    { key: "special", label: "Must contain at least one special character", valid: passwordRules.special },
    { key: "uppercase", label: "Must contain one uppercase letter", valid: passwordRules.uppercase },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrors({ password: "Password does not meet all required rules" });
      return;
    }
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
          <img src="/assets/logo1.png" alt="RegIntel Logo" className="h-10 w-auto" />
          <span className="text-xl font-bold text-text-main">RegIntel</span>
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white">
          <CardHeader className="text-center pb-8">
            <Smiley isEyesClosed={isPasswordFieldFocused} />
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
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    onFocus={() => setIsPasswordFieldFocused(true)}
                    onBlur={() => setIsPasswordFieldFocused(false)}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((p) => ({ ...p, password: "" }));
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
                {isPasswordFieldFocused && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                    <ul className="space-y-2">
                      {passwordRuleItems.map((item) => (
                        <li key={item.key} className="flex items-center gap-2">
                          {item.valid ? (
                            <Check size={14} className="text-emerald-600" />
                          ) : (
                            <X size={14} className="text-red-500" />
                          )}
                          <span className={item.valid ? "text-emerald-700" : "text-text-muted"}>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-main">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder={isPasswordValid ? "Confirm your password" : "Complete password rules first"}
                    value={confirmPassword}
                    disabled={!isPasswordValid}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    onFocus={() => setIsPasswordFieldFocused(true)}
                    onBlur={() => setIsPasswordFieldFocused(false)}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirm_password) setErrors((p) => ({ ...p, confirm_password: "" }));
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

      <div className="pb-6 text-center text-[10px] text-gray-400 tracking-widest">
        © 2026 RegIntel Intelligence Systems. All rights reserved.
      </div>
    </div>
  );
};
