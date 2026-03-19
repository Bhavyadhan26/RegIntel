import { Target, Shield, Users, Linkedin, Github } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

const teamMembers = [
  {
    name: "Bhavya Dhanuka",
    role: "Founder & Lead Backend Engineer",
    image: "/team/bhavya.jpeg",
    initials: "BD",
    gradient: "from-emerald-400 to-teal-500",
    linkedin: "https://www.linkedin.com/in/bhavya-dhanuka26-/",
    github: "https://github.com/Bhavyadhan26/",
  },
  {
    name: "Dinu Devees George",
    role: "Co-Founder & Lead Frontend Engineer",
    image: "/team/dinu.png",
    initials: "DG",
    gradient: "from-blue-400 to-indigo-500",
    linkedin: "https://www.linkedin.com/in/dinu-devees-george",
    github: "https://github.com/D1778",
  },
  {
    name: "Sharon Mathew",
    role: "Lead Frontend Engineer & Designer",
    image: "/team/sharon.png",
    initials: "SM",
    gradient: "from-purple-400 to-pink-500",
    linkedin: "https://www.linkedin.com/in/sharon-mathew-837a23240/",
    github: "https://github.com/sharonmattheww",
  },
];

export const About = () => {
  return (
    <section id="about" className="border-t border-border/40 bg-slate-50 py-20 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 blur-3xl opacity-20 pointer-events-none">
        <div className="w-[40rem] h-[40rem] rounded-full bg-gradient-to-br from-primary/80 to-emerald-200/50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn direction="up">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <span className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold uppercase tracking-widest text-primary">
              About Us
            </span>
            <h2 className="mb-8 text-4xl font-extrabold tracking-tight text-text-main md:text-5xl lg:text-6xl">
              Pioneering Regulatory Intelligence
            </h2>
            <p className="text-xl leading-relaxed text-text-muted">
              RegIntel was founded on a simple premise: regulatory compliance shouldn't be a barrier to innovation. We're on a mission to empower organizations with clarity, speed, and actionable insights in an increasingly complex regulatory landscape.
            </p>
          </div>
        </FadeIn>

        {/* Mission & Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {[{
            icon: Target,
            title: "Our Mission",
            desc: "To transform fragmented regulatory data into unified, strategic intelligence that enables seamless global compliance and fearless business growth.",
            color: "text-emerald-600",
            bg: "bg-emerald-100",
            gradientEnd: "to-emerald-50/50"
          }, {
            icon: Shield,
            title: "Trust & Security",
            desc: "We uphold the highest standards of data integrity and platform security, ensuring your most sensitive compliance workflows remain protected.",
            color: "text-blue-600",
            bg: "bg-blue-100",
            gradientEnd: "to-blue-50/50"
          }, {
            icon: Users,
            title: "Expert Team",
            desc: "Driven by the vision of Excellence and Service, we developed RegIntel to bridge the gap between complex regulatory publications and modern professional workflows.",
            color: "text-purple-600",
            bg: "bg-purple-100",
            gradientEnd: "to-purple-50/50"
          }].map((item, idx) => (
            <FadeIn key={idx} delay={idx * 0.15}>
              <div className="group bg-white/70 backdrop-blur-sm rounded-3xl p-10 shadow-sm border border-border/60 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 h-full relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 ${item.gradientEnd} rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-150`} />
                <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-8 transition-transform duration-500 group-hover:rotate-6`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-text-main mb-4">{item.title}</h3>
                <p className="text-text-muted leading-relaxed text-lg">
                  {item.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Leadership Team Section */}
        <FadeIn direction="up">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-text-main md:text-4xl">
              Meet Our Leadership
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              The visionaries and innovators building the future of regulatory compliance workflow automation.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {teamMembers.map((member, idx) => (
            <FadeIn key={idx} delay={idx * 0.15}>
              <div className="group flex flex-col items-center bg-white rounded-[2rem] p-10 shadow-sm hover:shadow-2xl border border-border/50 hover:border-primary/20 transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                {/* Decorative background circle */}
                <div className="absolute top-0 inset-x-0 h-32 bg-slate-50 mix-blend-multiply group-hover:bg-primary/5 transition-colors duration-500" />
                
                {/* Avatar / Initials */}
                <div className="relative mb-8 mt-4">
                  <div className={`w-40 h-40 rounded-full bg-gradient-to-tr ${member.gradient} p-1 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-4 border-white/40 overflow-hidden">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-extrabold text-slate-700 tracking-tight">
                          {member.initials}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center relative z-10 w-full">
                  <h3 className="text-2xl font-bold text-text-main mb-2">
                    {member.name}
                  </h3>
                  <p className="text-primary font-medium mb-6 uppercase tracking-wider text-sm">
                    {member.role}
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-100 w-full">
                    {member.linkedin && (
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#0077b5] hover:text-white transition-colors duration-300">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {member.github && (
                      <a href={member.github} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-[#333] hover:text-white transition-colors duration-300">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
