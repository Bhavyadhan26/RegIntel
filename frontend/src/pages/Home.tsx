import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export const Home = () => {
  return (
    <div className="font-sans bg-dark-950 min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
};