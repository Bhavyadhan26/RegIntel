import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
            } py-4`}>
            <div className="max-w-7xl mx-auto px-6 h-12 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        {/* Logo Icon */}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                    </div>
                    <span className="text-xl font-bold text-text-main tracking-tight">RegIntel</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#value-proposition" className="text-sm font-medium text-text-main hover:text-primary transition-colors uppercase">VALUE PROPOSITION</a>
                    <a href="#impact" className="text-sm font-medium text-text-main hover:text-primary transition-colors uppercase">IMPACT</a>
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login">
                        <Button>Login</Button>
                    </Link>
                </div>

                {/* Mobile Menu Toggle */}
                <button className="md:hidden text-text-main" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-border shadow-lg p-6 space-y-4 animate-in slide-in-from-top-2">
                    <a href="#value-proposition" className="block text-base font-medium text-text-main py-2 uppercase" onClick={() => setIsOpen(false)}>VALUE PROPOSITION</a>
                    <a href="#impact" className="block text-base font-medium text-text-main py-2 uppercase" onClick={() => setIsOpen(false)}>IMPACT</a>
                    <div className="pt-4 border-t border-border space-y-3">
                        <Link to="/login" className="block w-full" onClick={() => setIsOpen(false)}>
                            <Button className="w-full">Login</Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};
