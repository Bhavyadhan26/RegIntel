import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { apiForgotPassword } from "@/lib/api";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      const anyErr = err as Record<string, unknown>;
      const msg =
        (anyErr?.detail as string) ||
        (anyErr?.email as string) ||
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
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-text-main">Forgot Password?</CardTitle>
            <CardDescription className="text-text-muted mt-2">
              Enter your registered email and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-text-main">Check your inbox</p>
                  <p className="mt-1 text-sm text-text-muted">
                    If an account is registered with <span className="font-medium text-text-main">{email}</span>, you'll
                    receive a password reset link shortly.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <ArrowLeft size={14} />
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {error && <p className="text-sm font-medium text-red-600">{error}</p>}

                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20"
                  isLoading={loading}
                >
                  Send Reset Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors"
                  >
                    <ArrowLeft size={14} />
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
