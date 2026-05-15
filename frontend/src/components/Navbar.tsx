"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { scrollY } = useScroll();
  
  // Transform values for floating effect on scroll
  const navWidth = useTransform(scrollY, [0, 50], ["100%", "90%"]);
  const navTop = useTransform(scrollY, [0, 50], ["0px", "16px"]);
  const navBorderRadius = useTransform(scrollY, [0, 50], ["0px", "24px"]);
  const navOpacity = useTransform(scrollY, [0, 50], [0.4, 0.8]);
  const navBlur = useTransform(scrollY, [0, 50], ["12px", "20px"]);

  // Hide navbar on login and onboarding pages
  const isAuthPage = pathname === "/login" || pathname === "/onboarding";
  if (isAuthPage) return null;

  const username = (session as any)?.githubLogin || session?.user?.name;
  const avatar = session?.user?.image || `https://avatar.vercel.sh/${username}`;

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: navWidth,
        top: navTop,
        borderRadius: navBorderRadius,
        backgroundColor: `rgba(0, 0, 0, 0.4)`,
        backdropFilter: `blur(12px)`,
      }}
      className="fixed inset-x-0 z-[60] mx-auto border border-white/[0.04] shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-[16px] tracking-tight text-white group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="hidden sm:inline">Code DNA</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-10">
          <div className="hidden md:flex items-center gap-10 text-[13px] font-bold uppercase tracking-[0.18em]">
            <NavLink href="/" active={pathname === "/"}>Home</NavLink>
            <NavLink href="/discover" active={pathname === "/discover"}>Discover</NavLink>
            <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>Leaderboard</NavLink>
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block mx-2" />

          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => signOut()}
                  className="text-[11px] uppercase tracking-widest font-black text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  Logout
                </button>
                <Link href={username ? `/u/${username}` : "#"} className="relative group">
                  <div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img src={avatar} alt="" className="relative w-10 h-10 rounded-full border border-white/10 group-hover:border-emerald-500/50 transition-all" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                <Link href="/login" className="text-[11px] uppercase tracking-widest font-black text-zinc-400 hover:text-white transition-colors">Login</Link>
                <Link href="/login" className="h-11 px-8 rounded-full bg-emerald-500 text-black hover:bg-emerald-400 flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`relative transition-colors ${active ? "text-emerald-400" : "text-zinc-500 hover:text-white"}`}
    >
      {children}
      {active && (
        <motion.div 
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        />
      )}
    </Link>
  );
}

