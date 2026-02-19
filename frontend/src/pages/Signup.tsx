import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Smiley } from "@/components/Smiley";

export const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  return (
    <div className="min-h-screen flex bg-dark-950">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-950" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-accent-purple/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-accent-amber/5 rounded-full blur-[60px]" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <img src="/logo.png" alt="RegIntel" className="w-9 h-9 rounded-lg" />
          <span className="text-base font-semibold text-white">RegIntel</span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-3xl font-normal text-white leading-tight mb-4">
            Your compliance journey<br />starts here.
          </h2>
          <p className="text-[15px] font-medium text-gray-400 leading-relaxed max-w-sm">
            Get personalized regulatory feeds, real-time alerts, and deadline tracking tailored to your profession.
          </p>
        </div>

        <p className="text-gray-600 text-xs relative z-10">© 2024 RegIntel</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-10 bg-dark-900 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px]"
        >
          <div className="text-center mb-7">
            <Smiley isEyesClosed={isTypingPassword} />
            <h2 className="text-2xl font-semibold text-white mb-1">Create your account</h2>
            <p className="text-sm text-gray-500">Start your regulatory intelligence journey</p>
          </div>

          <form className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 text-base text-white placeholder:text-gray-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 text-base text-white placeholder:text-gray-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  onFocus={() => setIsTypingPassword(true)}
                  onBlur={() => setIsTypingPassword(false)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 text-base text-white placeholder:text-gray-600 pr-12 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  onFocus={() => setIsTypingPassword(true)}
                  onBlur={() => setIsTypingPassword(false)}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple/50 text-base text-white placeholder:text-gray-600 pr-12 transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/select-profession")}
              className="w-full py-3 bg-accent-purple text-white font-semibold text-base rounded-lg hover:bg-accent-purple/90 active:scale-[0.98] transition-all mt-1"
            >
              Create Account
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-600">
            By signing up, you agree to our <a href="#" className="text-accent-purple font-medium hover:underline">Terms</a> and <a href="#" className="text-accent-purple font-medium hover:underline">Privacy Policy</a>
          </p>
          <div className="mt-5 pt-5 border-t border-dark-600 text-center text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-accent-purple font-semibold hover:underline">Sign in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};