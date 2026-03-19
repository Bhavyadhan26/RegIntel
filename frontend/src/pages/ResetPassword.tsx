import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { apiResetPassword } from "@/lib/api";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    if (!uid || !token) {
      setInvalidLink(true);
    }
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiResetPassword({ uid, token, new_password: newPassword, confirm_password: confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: unknown) {
      const anyErr = err as Record<string, unknown>;
      const msg =
        (anyErr?.detail as string) ||
        (anyErr?.non_field_errors as string) ||
        (anyErr?.confirm_password as string) ||
        "Something went wrong. Please try again.";
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
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {invalidLink ? (
                <AlertCircle className="h-8 w-8 text-red-500" />
              ) : (
                <KeyRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold text-text-main">
              {invalidLink ? "Invalid Link" : "Set New Password"}
            </CardTitle>
            <CardDescription className="text-text-muted mt-2">
              {invalidLink
                ? "This password reset link is invalid or missing. Please request a new one."
                : "Choose a strong password for your RegIntel account."}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {invalidLink ? (
              <div className="text-center">
                <Link
                  to="/forgot-password"
                  className="inline-block mt-2 text-sm font-semibold text-primary hover:underline"
                >
                  Request a new reset link →
                </Link>
              </div>
            ) : success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-text-main">Password reset successful!</p>
                  <p className="mt-1 text-sm text-text-muted">
                    Redirecting you to login…
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-text-main">Confirm Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20"
                  isLoading={loading}
                >
                  Reset Password
                </Button>

                <div className="text-center pt-1">
                  <Link
                    to="/login"
                    className="text-sm text-text-muted hover:text-text-main transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="pb-6 text-center text-[10px] text-gray-400 tracking-widest">
        © 2026 RegIntel Intelligence Systems. All rights reserved.
      </div>
    </div>
  );
};
