"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated DNA/Sequence Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-8"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-400">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </motion.div>

        {/* Loading Progress Text */}
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-white font-bold tracking-[0.2em] uppercase text-[10px]">Sequencing DNA</h2>
          <div className="w-32 h-[1px] bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="h-full w-full bg-zinc-800"
            />
          </div>
        </div>
      </div>

      {/* Decorative noise/dots */}
      <div className="fixed inset-0 dot-grid pointer-events-none opacity-20" />
    </div>
  );
}
