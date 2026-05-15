"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export const DynamicBackground = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; char: string }[]>([]);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Generate particles only on client to avoid hydration mismatch
  useEffect(() => {
    setParticles(
      [...Array(25)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 12 + 6,
        duration: Math.random() * 15 + 15,
        char: ["{ }", "DNA", "01", "=>", "[]", "//", "< >", "SEQ", "AST"][Math.floor(Math.random() * 9)]
      }))
    );
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* ─── Dot Grid ─── */}
      <div className="absolute inset-0 dot-grid opacity-[0.05]" />

      {/* ─── High-Contrast Scanlines ─── */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-10" />

      {/* ─── Floating Code Particles ─── */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 0 }}
          animate={{ 
            y: [`${p.y}%`, `${p.y - 12}%`, `${p.y}%`],
            opacity: [0, 0.15, 0],
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute text-zinc-500 font-mono font-medium select-none whitespace-nowrap"
          style={{ fontSize: `${p.size}px`, filter: "blur(1px)" }}
        >
          {p.char}
        </motion.div>
      ))}


      {/* ─── Animated Mesh Gradients (Subtle Gray) ─── */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-zinc-800/10 rounded-full blur-[160px] animate-blob" 
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-zinc-900/10 rounded-full blur-[140px] animate-blob animation-delay-4000" 
      />
      
      {/* ─── Interactive Mouse Glow ─── */}
      <div 
        className="absolute w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[150px] transition-transform duration-700 ease-out"
        style={{ 
          transform: `translate(${mousePos.x - 400}px, ${mousePos.y - 400}px)`,
        }}
      />

      {/* ─── Data-Stream Helix (Refined Grayscale) ─── */}
      <div className="absolute top-0 right-0 w-[400px] h-full opacity-[0.10]">
        <svg viewBox="0 0 100 1000" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
          <defs>
            <linearGradient id="helix-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#71717a" stopOpacity="0" />
              <stop offset="50%" stopColor="#71717a" stopOpacity="1" />
              <stop offset="100%" stopColor="#71717a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path 
            d="M50,0 Q20,125 50,250 T50,500 T50,750 T50,1000" 
            fill="none" 
            stroke="url(#helix-grad)" 
            strokeWidth="0.5" 
            strokeDasharray="4 8"
          />
          <path 
            d="M50,0 Q80,125 50,250 T50,500 T50,750 T50,1000" 
            fill="none" 
            stroke="url(#helix-grad)" 
            strokeWidth="0.5" 
            strokeDasharray="4 8"
          />
          {/* Node points */}
          {[125, 375, 625, 875].map((y) => (
            <circle key={y} cx="50" cy={y} r="1.5" fill="#a1a1aa" className="animate-pulse" />
          ))}
        </svg>
      </div>

      {/* ─── System Markings ─── */}
      <div className="absolute top-1/4 right-8 w-px h-64 bg-gradient-to-b from-transparent via-zinc-500/20 to-transparent">
        <div className="absolute top-0 right-2 flex flex-col gap-8">
          <span className="text-[7px] font-mono text-zinc-500/30 rotate-90 origin-left uppercase tracking-[0.5em]">Sector_7G</span>
          <span className="text-[7px] font-mono text-zinc-500/30 rotate-90 origin-left uppercase tracking-[0.5em]">Buffer_Load</span>
        </div>
      </div>

      {/* ─── Overlay Textures ─── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
};



