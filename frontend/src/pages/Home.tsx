import { Navbar } from "@/components/layout/Navbar"; // Updated import path
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export const Home = () => {
  return (
    <div className="font-sans bg-white min-h-screen text-text-main">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};
