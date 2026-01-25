import { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // <--- 1. IMPORT THIS
import { motion } from "framer-motion";
import { Smiley } from "@/components/Smiley";

export const Signup = () => {
  // <--- 2. DEFINE THE HOOK HERE
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-200/20 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-300/20 rounded-full blur-3xl -z-10"></div>

      {/* Back Button */}
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>
      </div>

      {/* Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex items-center gap-3 mb-10"
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-orange-500/20">
          R
        </div>
        <span className="text-3xl font-extrabold text-gray-900 tracking-tight">RegIntel</span>
      </motion.div>

      {/* Signup Card */}
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[440px] p-8 sm:p-12 border border-white/40"
      >
        
        {/* Header with Interactive Smiley */}
        <div className="text-center mb-8">
          <Smiley isEyesClosed={isTypingPassword} />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Create Your Account</h2>
          <p className="text-gray-500 text-sm leading-relaxed">Start your regulatory intelligence journey today.</p>
        </div>

        <form className="space-y-5">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                onFocus={() => setIsTypingPassword(true)}
                onBlur={() => setIsTypingPassword(false)}
                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                onFocus={() => setIsTypingPassword(true)}
                onBlur={() => setIsTypingPassword(false)}
                className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-gray-900 placeholder:text-gray-400 pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Create Account Button */}
          {/* <--- 3. UPDATED BUTTON USING NAVIGATE */}
          <button 
            type="button" 
            onClick={() => navigate("/select-profession")}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 mt-4 text-lg"
          >
            Create Account
          </button>

        </form>

        <div className="mt-10 text-center text-sm text-gray-600">
          By signing up, you agree to our <a href="#" className="text-orange-600 font-medium hover:underline">Terms of Service</a> and <a href="#" className="text-orange-600 font-medium hover:underline">Privacy Policy</a>
          <div className="mt-6 pt-6 border-t border-gray-100">
            Already have an account? <Link to="/login" className="text-orange-600 font-bold hover:underline ml-1">Sign in</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};