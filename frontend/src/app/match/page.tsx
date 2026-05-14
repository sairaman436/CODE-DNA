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
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/20 pb-24 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[15px] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors">Home</Link>
            <Link href="/discover" className="text-zinc-500 hover:text-white transition-colors">Discover</Link>
            <Link href="/compare" className="text-zinc-500 hover:text-white transition-colors">Compare</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            {session ? (
              <Link href={`/profile/${session.user?.name}`} className="text-zinc-500 hover:text-white transition-colors">Profile</Link>
            ) : (
              <Link href="/login" className="text-white hover:text-emerald-400 transition-colors">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-emerald-500/50" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/70">Teammate Finder</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">Find Your Match</h1>
          <p className="text-[15px] text-zinc-500 max-w-xl">
            Find developers who complement your DNA — or think just like you.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-3 mb-8">
          <Button
            variant={mode === 'complementary' ? 'default' : 'outline'}
            className={`rounded-xl text-[13px] font-semibold ${mode === 'complementary' ? 'bg-white text-black hover:bg-emerald-400' : 'bg-zinc-950/50 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setMode('complementary')}
          >
            <Puzzle className="w-4 h-4 mr-2" /> Complementary
          </Button>
          <Button
            variant={mode === 'similar' ? 'default' : 'outline'}
            className={`rounded-xl text-[13px] font-semibold ${mode === 'similar' ? 'bg-white text-black hover:bg-emerald-400' : 'bg-zinc-950/50 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5'}`}
            onClick={() => setMode('similar')}
          >
            <Copy className="w-4 h-4 mr-2" /> Similar
          </Button>
        </div>

        {/* Search Button */}
        <div className="flex justify-center mb-12">
          <Button
            className="h-12 px-8 rounded-xl bg-white text-black hover:bg-emerald-400 font-bold text-sm transition-all"
            onClick={findMatches}
            disabled={loading || !session}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? 'Searching...' : `Find ${mode === 'complementary' ? 'Complementary' : 'Similar'} Matches`}
          </Button>
        </div>

        {/* Not signed in */}
        {!session && (
          <div className="text-center rounded-2xl border border-white/[0.04] bg-zinc-950/30 p-12">
            <Users className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-[15px] mb-2">Sign in to find your matches.</p>
            <Link href="/login">
              <button className="mt-4 h-10 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-emerald-400 transition-all">
                Sign In
              </button>
            </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match, i) => (
            <motion.div
              key={match.username}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-white/[0.04] bg-zinc-950/30 p-6 group hover:border-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={match.avatar || `https://github.com/${match.username}.png`}
                  alt={match.username}
                  className="w-12 h-12 rounded-xl border border-white/[0.06] bg-zinc-900 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${match.username}` }}
                />
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-white">{match.name}</h3>
                  <p className="text-[12px] text-zinc-600">@{match.username}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{match.matchScore}%</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">match</div>
                </div>
              </div>

              <div className="mb-4">
                <span className="px-2.5 py-1 bg-emerald-500/[0.06] text-emerald-400 border border-emerald-500/10 rounded-md text-[10px] font-bold uppercase tracking-wider">
                  {match.type}
                </span>
              </div>

              {match.fillsBlindSpots.length > 0 && (
                <p className="text-[12px] text-zinc-500 mb-4 leading-relaxed">
                  <span className="text-zinc-300 font-medium">Fills your gaps:</span> {match.fillsBlindSpots.join(', ')}
                </p>
              )}

              <Link href={`/compare?u1=${session?.user?.name}&u2=${match.username}`}>
                <Button variant="outline" className="w-full bg-zinc-950/50 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-9 text-xs font-medium">
                  Compare Profiles <ArrowRight className="w-3.5 h-3.5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
