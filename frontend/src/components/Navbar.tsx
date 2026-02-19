import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-dark-950/90 backdrop-blur-md border-b border-dark-600/50" : "bg-transparent"
      } py-4`}>
      <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="RegIntel" className="w-9 h-9 rounded-lg" />
          <span className="text-lg font-semibold text-white tracking-tight">RegIntel</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors">Platform</a>
          <a href="#professions" className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors">Solutions</a>
          <Link to="/login" className="text-[15px] font-medium text-gray-400 hover:text-white transition-colors">Resources</Link>
          <Link
            to="/signup"
            className="px-5 py-2.5 border border-gray-600 text-white text-[15px] font-semibold rounded-lg hover:bg-white/5 hover:border-gray-400 transition-all"
          >
            Get started
          </Link>
        </div>

        <button className="md:hidden text-gray-400" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-dark-900 border-t border-dark-600 px-6 py-5 space-y-3">
          <a href="#features" className="block text-gray-300 font-medium text-base py-2">Platform</a>
          <a href="#professions" className="block text-gray-300 font-medium text-base py-2">Solutions</a>
          <Link to="/login" className="block text-gray-300 font-medium text-base py-2">Resources</Link>
          <Link to="/signup" className="block w-full py-2.5 border border-gray-600 text-white font-semibold rounded-lg text-center text-base">
            Get started
          </Link>
        </div>
      )}
    </nav>
  );
};