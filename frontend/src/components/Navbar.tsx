"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide navbar on login and onboarding pages
  const isAuthPage = pathname === "/login" || pathname === "/onboarding";
  if (isAuthPage) return null;

  const username = session?.codedna_username || session?.githubLogin || session?.user?.name;
  const avatar = session?.user?.image || `https://avatar.vercel.sh/${username}`;

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 z-[60] mx-auto transition-all duration-500 ease-out overflow-hidden
        ${isScrolled 
          ? 'w-[90%] top-4 rounded-[24px] bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] shadow-2xl' 
          : 'w-full top-0 rounded-none bg-transparent border-transparent shadow-none'
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-[16px] tracking-tight text-zinc-100 group">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-100">
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
            {session?.role === 'ADMIN' && (
              <NavLink href="/admin" active={pathname === "/admin"}>
                <span className="text-emerald-500">Admin Panel</span>
              </NavLink>
            )}
          </div>

          <div className="h-4 w-px bg-white/10 hidden md:block mx-2" />

          <div className="flex items-center gap-4">
            <Link href="/login" className="h-10 px-8 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center text-[11px] font-black uppercase tracking-wider transition-all active:scale-95">
              Analyze Repository
            </Link>
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
      className={`relative transition-colors ${active ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
    >
      {children}
      {active && (
        <motion.div 
          layoutId="nav-underline"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"
        />
      )}
    </Link>
  );
}

