"use client";

import Image from "next/image";

interface AIAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  isSpeaking?: boolean;
  isListening?: boolean;
}

export default function AIAvatar({
  size = "md",
  isSpeaking = false,
  isListening = false,
}: AIAvatarProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Glow effect when active */}
      {(isSpeaking || isListening) && (
        <div className={`absolute inset-0 -m-2 rounded-full blur-xl animate-pulse ${isSpeaking ? 'bg-gradient-to-r from-blue-400/40 via-cyan-500/40 to-teal-500/40' : 'bg-gradient-to-r from-purple-400/30 via-pink-500/30 to-red-500/30'}`} />
      )}

      {/* Professional HR Avatar */}
      <div className={`w-full h-full rounded-full overflow-hidden border-4 drop-shadow-2xl relative z-10 transition-all duration-300 ${isSpeaking ? 'border-cyan-400 scale-[1.02]' : isListening ? 'border-purple-400 scale-[0.98]' : 'border-slate-600'}`}>
        <Image 
          src="/hr-avatar.png" 
          alt="Professional HR Interviewer"
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority
        />
      </div>

      {/* Status badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/90 backdrop-blur-sm border rounded-full text-[10px] font-bold tracking-widest uppercase whitespace-nowrap shadow-lg z-20">
        {isSpeaking ? (
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Speaking</span>
        ) : isListening ? (
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" /> Listening</span>
        ) : (
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Ready</span>
        )}
      </div>
    </div>
  );
}
