"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Users, Search, Loader2, ArrowRight, Puzzle, Copy } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface MatchResult {
  username: string;
  name: string;
  avatar: string | null;
  type: string;
  matchScore: number;
  fillsBlindSpots: string[];
  sharedStrengths: string[];
}

export default function MatchPage() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mode, setMode] = useState<'complementary' | 'similar'>('complementary');

  async function findMatches() {
    const username = (session as any)?.githubLogin || session?.user?.name;
    if (!username) return;

    setLoading(true);
    setSearched(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/match/${username}?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20 pb-24 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-[15px] text-zinc-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest">
            <Link href="/" className="text-zinc-500 hover:text-zinc-100 transition-colors">Home</Link>
            <Link href="/discover" className="text-zinc-500 hover:text-zinc-100 transition-colors">Discover</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-zinc-100 transition-colors">Leaderboard</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-black text-emerald-400">Teammate Finder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">Find Your Match</h1>
          <p className="text-[16px] text-zinc-500 max-w-xl leading-relaxed">
            Discover developers who complement your technical DNA — or think exactly like you.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-4 mb-10">
          <Button
            variant={mode === 'complementary' ? 'default' : 'outline'}
            className={`rounded-2xl h-12 px-8 text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'complementary' ? 'bg-zinc-100 text-black hover:bg-white shadow-xl shadow-emerald-500/5' : 'bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-zinc-100 hover:bg-white/5'}`}
            onClick={() => setMode('complementary')}
          >
            <Puzzle className="w-4 h-4 mr-2" /> Complementary
          </Button>
          <Button
            variant={mode === 'similar' ? 'default' : 'outline'}
            className={`rounded-2xl h-12 px-8 text-[11px] font-black uppercase tracking-widest transition-all ${mode === 'similar' ? 'bg-zinc-100 text-black hover:bg-white shadow-xl shadow-emerald-500/5' : 'bg-white/[0.03] border-white/[0.08] text-zinc-500 hover:text-zinc-100 hover:bg-white/5'}`}
            onClick={() => setMode('similar')}
          >
            <Copy className="w-4 h-4 mr-2" /> Similar Patterns
          </Button>
        </div>

        {/* Search Button */}
        <div className="flex justify-center mb-16">
          <Button
            className="h-14 px-12 rounded-[20px] bg-emerald-500 text-zinc-100 hover:bg-emerald-400 font-black uppercase tracking-widest text-[12px] transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95"
            onClick={findMatches}
            disabled={loading || !session}
          >
            {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Search className="w-5 h-5 mr-3" />}
            {loading ? 'Initializing Diagnostic...' : `Search ${mode === 'complementary' ? 'Complementary' : 'Similar'} DNA`}
          </Button>
        </div>

        {/* Not signed in */}
        {!session && (
          <div className="text-center rounded-2xl border border-white/[0.04] bg-zinc-950/30 p-12">
            <Users className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-[15px] mb-2">Sign in to find your matches.</p>
            <Button asChild className="mt-4 h-10 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-700 transition-all shadow-lg">
              <Link href="/login">
                Sign In
              </Link>
            </Button>
          </div>
        )}

        {/* Empty */}
        {searched && matches.length === 0 && (
          <div className="text-center rounded-2xl border border-white/[0.04] bg-zinc-950/30 p-12">
            <p className="text-zinc-400 mb-2">No matches found yet.</p>
            <p className="text-zinc-600 text-[13px]">More developers need to be analyzed before matching works. Share Code DNA with friends!</p>
          </div>
        )}

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {matches.map((match, i) => (
            <motion.div
              key={match.username}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 group hover:bg-white/[0.05] hover:border-white/20 transition-all shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
              
              <div className="flex items-center gap-5 mb-6">
                <img
                  src={match.avatar || `https://github.com/${match.username}.png`}
                  alt={match.username}
                  className="w-14 h-14 rounded-2xl border border-white/[0.1] bg-zinc-900 object-cover shadow-2xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${match.username}` }}
                />
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-zinc-100 tracking-tight">{match.name}</h3>
                  <p className="text-[11px] text-zinc-600 font-mono">@{match.username}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-zinc-100">{match.matchScore}%</div>
                  <div className="text-[9px] text-zinc-600 uppercase tracking-widest font-black">MATCH</div>
                </div>
              </div>

              <div className="mb-6">
                <span className="px-3 py-1 bg-white/[0.04] text-zinc-400 border border-white/[0.05] rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {match.type}
                </span>
              </div>

              {match.fillsBlindSpots.length > 0 && (
                <div className="mb-8 p-4 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/[0.05]">
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    <span className="text-emerald-500/60 font-black uppercase tracking-tighter mr-2">Gap Coverage:</span> {match.fillsBlindSpots.join(', ')}
                  </p>
                </div>
              )}

              <Button asChild variant="outline" className="w-full bg-white/[0.02] border-white/[0.08] text-zinc-500 hover:text-zinc-100 hover:bg-white/5 rounded-2xl h-11 text-[11px] font-black uppercase tracking-widest transition-all">
                <Link href={`/compare?u1=${session?.user?.name}&u2=${match.username}`}>
                  Initialize Comparison <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
