import { useEffect, useState, useRef } from "react";

// Add interface for props
interface SmileyProps {
  isEyesClosed?: boolean;
}

export const Smiley = ({ isEyesClosed = false }: SmileyProps) => {
  const [leftEyePos, setLeftEyePos] = useState({ x: 0, y: 0 });
  const [rightEyePos, setRightEyePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateEyePosition = (
    eyeX: number,
    eyeY: number,
    mouseX: number,
    mouseY: number
  ) => {
    if (!containerRef.current) return { x: 0, y: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const containerCenterX = rect.left + rect.width / 2;
    const containerCenterY = rect.top + rect.height / 2;

    const angle = Math.atan2(mouseY - (containerCenterY + eyeY), mouseX - (containerCenterX + eyeX));
    const radius = 6; 
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return { x, y };
  };

  useEffect(() => {
    // Only track mouse if eyes are OPEN
    if (isEyesClosed) return; 

    const handleMouseMove = (e: MouseEvent) => {
      const leftEyeOffset = { x: -14, y: -4 };
      const rightEyeOffset = { x: 14, y: -4 };

      setLeftEyePos(
        calculateEyePosition(leftEyeOffset.x, leftEyeOffset.y, e.clientX, e.clientY)
      );
      setRightEyePos(
        calculateEyePosition(rightEyeOffset.x, rightEyeOffset.y, e.clientX, e.clientY)
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isEyesClosed]); // Re-run effect when isEyesClosed changes

  return (
    <div 
      ref={containerRef}
      className="w-24 h-24 bg-gradient-to-b from-orange-300 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-lg shadow-orange-500/30 transition-all duration-300"
    >
      {/* Blush */}
      <div className="absolute top-11 left-4 w-3 h-2 bg-red-400/30 rounded-full blur-[2px]"></div>
      <div className="absolute top-11 right-4 w-3 h-2 bg-red-400/30 rounded-full blur-[2px]"></div>

      {/* Eyes Container */}
      <div className="absolute top-7 flex gap-3">
        {isEyesClosed ? (
          // --- CLOSED EYES STATE ---
          <>
             <div className="w-9 h-9 flex items-center justify-center">
               <div className="w-7 h-3 border-t-[3px] border-white/90 rounded-full translate-y-2"></div>
             </div>
             <div className="w-9 h-9 flex items-center justify-center">
               <div className="w-7 h-3 border-t-[3px] border-white/90 rounded-full translate-y-2"></div>
             </div>
          </>
        ) : (
          // --- OPEN EYES STATE ---
          <>
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center relative overflow-hidden shadow-inner transition-all duration-200">
              <div
                className="w-3.5 h-3.5 bg-orange-600 rounded-full absolute transition-transform duration-75 ease-out"
                style={{ transform: `translate(${leftEyePos.x}px, ${leftEyePos.y}px)` }}
              ></div>
            </div>
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center relative overflow-hidden shadow-inner transition-all duration-200">
              <div
                className="w-3.5 h-3.5 bg-orange-600 rounded-full absolute transition-transform duration-75 ease-out"
                style={{ transform: `translate(${rightEyePos.x}px, ${rightEyePos.y}px)` }}
              ></div>
            </div>
          </>
        )}
      </div>

      {/* Smile (Changes slightly when eyes closed) */}
      <div className={`absolute bottom-5 w-6 h-3 border-b-2 border-white/70 rounded-full transition-all duration-300 ${isEyesClosed ? "scale-x-75" : "scale-x-100"}`}></div>
    </div>
  );
};