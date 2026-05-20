"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full max-w-[1200px] mx-auto px-6 py-12 border-t border-white/[0.04] mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 text-[11px] text-zinc-600 font-medium">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>© {new Date().getFullYear()} Code DNA. Structural developer identities.</span>
      </div>
      <div className="flex gap-8">
        <Link href="/" className="hover:text-zinc-400 transition-colors">Home</Link>
        <Link href="/discover" className="hover:text-zinc-400 transition-colors">Discover</Link>
        <Link href="/leaderboard" className="hover:text-zinc-400 transition-colors">Leaderboard</Link>
        <Link href="https://github.com" target="_blank" className="hover:text-zinc-400 transition-colors">GitHub</Link>
      </div>
    </footer>
  );
}
