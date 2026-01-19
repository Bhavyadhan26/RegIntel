import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import Solutions from "../components/landing/Solutions";
import TrustSection from "../components/landing/TrustSection";
import Footer from "../components/landing/Footer";
export default function Home() {
  return (
    <div>
      {/* HERO (its own background) */}
      <Hero />

      {/* GLOBAL BACKGROUND FROM HERE DOWN */}
      <div
        className="min-h-screen w-full bg-cover bg-no-repeat bg-top bg-fixed"
        style={{ backgroundImage: "url('/hero-second.jpg')" }}
      >
        <div className="relative">
  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
  {/* content goes inside */}
</div>

        <Features />
        <Solutions />
        <TrustSection />
        <Footer />
     
      </div>
    </div>
  );
}
