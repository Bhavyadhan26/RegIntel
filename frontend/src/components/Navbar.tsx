import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom"; // Import Link for navigation

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-slate-900/95 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        
        {/* --- LOGO --- */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
            R
          </div>
          <span className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? "text-white" : "text-white"}`}>
            RegIntel
          </span>
        </Link>

        {/* --- DESKTOP MENU --- */}
        <div className="hidden md:flex items-center gap-8">
          {/* Login Button -> Goes to Login Page */}
          <Link 
            to="/login" 
            className={`font-medium transition-colors hover:text-blue-400 ${scrolled ? "text-blue-100" : "text-blue-100"}`}
          >
            Login
          </Link>

          {/* Get Started Button -> Goes to Signup Page */}
          <Link 
            to="/signup" 
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-full shadow-md shadow-blue-600/20 hover:shadow-lg hover:scale-105 transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* --- MOBILE TOGGLE --- */}
        <button className="text-white md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* --- MOBILE MENU --- */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 shadow-xl">
          <Link to="/login" className="text-blue-100 font-medium py-2 text-center hover:text-white">
            Login
          </Link>
          <Link to="/signup" className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg text-center hover:bg-blue-500">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
};