import { useEffect, useRef } from "react";

interface SmileyProps {
  isEyesClosed?: boolean;
}

export const Smiley = ({ isEyesClosed = false }: SmileyProps) => {
  const leftPupilRef = useRef<HTMLDivElement>(null);
  const rightPupilRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEyesClosed) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!faceRef.current) return;
      const rect = faceRef.current.getBoundingClientRect();
      const faceCenterX = rect.left + rect.width / 2;
      const faceCenterY = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - faceCenterY, e.clientX - faceCenterX);
      const distance = 3;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      [leftPupilRef, rightPupilRef].forEach((ref) => {
        if (ref.current) ref.current.style.transform = `translate(${x}px, ${y}px)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isEyesClosed]);

  return (
    <div ref={faceRef} className="w-20 h-20 mx-auto mb-5 relative bg-white border-2 border-primary/30 rounded-full flex items-center justify-center shadow-lg shadow-primary/10 overflow-hidden">
      {/* Face glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-transparent" />

      {/* Eyes */}
      <div className="flex gap-3.5 relative z-10 -mt-1">
        <div className="w-4 h-5 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
          {isEyesClosed ? (
            <div className="w-3.5 h-px bg-primary/60 rounded-full" />
          ) : (
            <div ref={leftPupilRef} className="w-2 h-2 bg-primary rounded-full transition-transform duration-75" />
          )}
        </div>
        <div className="w-4 h-5 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden">
          {isEyesClosed ? (
            <div className="w-3.5 h-px bg-primary/60 rounded-full" />
          ) : (
            <div ref={rightPupilRef} className="w-2 h-2 bg-primary rounded-full transition-transform duration-75" />
          )}
        </div>
      </div>

      {/* Smile */}
      <div className={`absolute bottom-[22px] left-1/2 -translate-x-1/2 w-5 h-2.5 border-b-2 border-primary/50 rounded-b-full transition-all duration-300 ${isEyesClosed ? 'scale-x-75 -translate-y-1' : ''}`} />

      {/* Hands covering eyes */}
      <div className={`absolute top-4 left-3 w-6 h-7 bg-white border-2 border-primary/30 rounded-full transition-all duration-300 z-20 ${isEyesClosed ? 'translate-y-0 rotate-[20deg]' : 'translate-y-16 -rotate-12'}`} />
      <div className={`absolute top-4 right-3 w-6 h-7 bg-white border-2 border-primary/30 rounded-full transition-all duration-300 z-20 ${isEyesClosed ? 'translate-y-0 -rotate-[20deg]' : 'translate-y-16 rotate-12'}`} />
    </div>
  );
};