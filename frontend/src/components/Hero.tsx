import { Button } from "@/components/ui/Button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

export const Hero = () => {
  return (
    // Changed: Used standard padding options to avoid too much spacing
    <section className="relative flex items-center overflow-hidden bg-background px-4 py-14 sm:px-6 md:py-20 lg:px-12 lg:py-24">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">

        {/* Text Content */}
        <div className="flex flex-col justify-center">
          <FadeIn direction="up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-6 w-fit">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Next-Gen Compliance
          </div>

          <h1 className="mb-6 text-4xl font-bold text-text-main leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            The platform that makes{" "}
            <span className="text-primary block">regulatory data</span>{" "}
            work for you
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-text-muted sm:text-xl">
            Transforming complex compliance into actionable intelligence with high-end,
            real-time analytics and predictive reporting.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 mt-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="h-14 px-10 text-lg shadow-xl shadow-primary/20 shrink-0">
                Get Started
              </Button>
            </Link>
            <div className="flex flex-col justify-center gap-3 text-sm text-text-muted font-medium">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100/80 text-green-700">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Unlock intelligent compliance instantly.</span>
              </div>
            </div>
          </div>
          </FadeIn>
        </div>

        {/* Hero Image */}
        <div className="relative hidden lg:block h-[450px] xl:h-[550px] w-full">
          <FadeIn direction="left" delay={0.2} fullWidth className="h-full w-full">
          <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-2xl bg-white flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="RegIntel Dashboard Preview"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Decor */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px]" />
          </FadeIn>
        </div>
      </div>
    </section>
  );
};