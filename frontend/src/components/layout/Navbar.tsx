import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { LogIn } from "lucide-react";

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
            <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5">
                    <img src="/assets/logo1.png" alt="RegIntel Logo" className="h-[3.25rem] w-auto" />
                    <span className="text-lg font-bold text-text-main tracking-tight sm:text-xl">RegIntel</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-text-main hover:text-primary transition-colors uppercase">FEATURES</a>
                    <a href="#impact" className="text-sm font-medium text-text-main hover:text-primary transition-colors uppercase">IMPACT</a>
                    <a href="#about" className="text-sm font-medium text-text-main hover:text-primary transition-colors uppercase">ABOUT</a>
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Link to="/login">
                        <Button size="lg" className="gap-2">
                            <LogIn size={18} />
                            Login
                        </Button>
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
                    <a href="#features" className="block text-base font-medium text-text-main py-2 uppercase" onClick={() => setIsOpen(false)}>FEATURES</a>
                    <a href="#impact" className="block text-base font-medium text-text-main py-2 uppercase" onClick={() => setIsOpen(false)}>IMPACT</a>
                    <a href="#about" className="block text-base font-medium text-text-main py-2 uppercase" onClick={() => setIsOpen(false)}>ABOUT</a>
                    <div className="pt-4 border-t border-border space-y-3">
                        <Link to="/login" className="block w-full" onClick={() => setIsOpen(false)}>
                            <Button size="lg" className="w-full gap-2">
                                <LogIn size={18} />
                                Login
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};
