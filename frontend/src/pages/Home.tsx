// src/pages/Home.tsx

import { Navbar } from "@/components/layout/Navbar"; // Double check this path
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

// Make sure 'export' is right before 'const'
export const Home = () => {
  return (
    <div className="font-sans min-h-screen text-text-main selection:bg-primary/20">
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <Features />
      </main>
      <Footer showCTA={true} />
    </div>
  );
};