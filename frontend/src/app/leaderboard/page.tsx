"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowUpRight, Crown, Medal, Award } from "lucide-react";
import { useSession } from "next-auth/react";

interface LeaderboardEntry {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  developer_type: string;
  readability_score: number;
  complexity_score: number;
  overall_score: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const username = (session as any)?.githubLogin || session?.user?.name;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'overall' | 'readability' | 'complexity'>('overall');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.leaderboard || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const sorted = [...entries].sort((a, b) => {
    if (sortBy === 'readability') return b.readability_score - a.readability_score;
    if (sortBy === 'complexity') return b.complexity_score - a.complexity_score;
    return b.overall_score - a.overall_score;
  });

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (i === 1) return <Medal className="w-4 h-4 text-zinc-400" />;
    if (i === 2) return <Award className="w-4 h-4 text-amber-700" />;
    return <span className="text-[11px] font-mono text-zinc-600">{i + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/20 relative noise">
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
            {username ? (
              <Link href={`/profile/${username}`} className="text-zinc-500 hover:text-white transition-colors">Profile</Link>
            ) : (
              <Link href="/login" className="text-white hover:text-emerald-400 transition-colors">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px w-8 bg-emerald-500/50" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/70">Rankings</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">Leaderboard</h1>
                <p className="text-[15px] text-zinc-500 max-w-lg">
                  Top developers ranked by their Code DNA scores. Analyze your profile to join.
                </p>
              </div>
              <div className="flex gap-2">
                {(['overall', 'readability', 'complexity'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                      sortBy === key
                        ? 'bg-white/[0.08] text-white border border-white/[0.1]'
                        : 'text-zinc-600 hover:text-zinc-400'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!loading && entries.length === 0 && (
            <div className="text-center py-32 rounded-2xl border border-white/[0.04] bg-zinc-950/30">
              <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-[15px] mb-2">No rankings yet.</p>
              <p className="text-zinc-700 text-[13px]">Be the first to analyze your profile and claim the top spot.</p>
              <Link href="/login">
                <button className="mt-6 h-10 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-emerald-400 transition-all">
                  Get Started
                </button>
              </Link>
            </div>
          )}

          {/* Table */}
          {!loading && sorted.length > 0 && (
            <div className="rounded-2xl border border-white/[0.04] overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-[0.12em] font-bold text-zinc-700 border-b border-white/[0.04] bg-zinc-950/50">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Developer</div>
                <div className="col-span-2">Archetype</div>
                <div className="col-span-2 text-center">Readability</div>
                <div className="col-span-2 text-center">Overall</div>
                <div className="col-span-1"></div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.03]">
                {sorted.map((entry, i) => (
                  <motion.div
                    key={entry.username}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  >
                    <Link href={`/profile/${entry.username}`}>
                      <div className={`grid grid-cols-12 px-6 py-5 items-center group hover:bg-zinc-950/80 transition-colors cursor-pointer ${i < 3 ? 'bg-zinc-950/40' : 'bg-zinc-950/20'}`}>
                        <div className="col-span-1 flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.03]">
                          {rankIcon(i)}
                        </div>
                        <div className="col-span-4 flex items-center gap-4">
                          <img
                            src={entry.avatar_url || `https://github.com/${entry.username}.png`}
                            alt={entry.username}
                            className="w-9 h-9 rounded-lg border border-white/[0.06] bg-zinc-900 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${entry.username}` }}
                          />
                          <div>
                            <span className="text-[13px] font-semibold text-zinc-300 group-hover:text-white transition-colors">
                              {entry.display_name || entry.username}
                            </span>
                            <span className="block text-[11px] text-zinc-600">@{entry.username}</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-[12px] text-zinc-500 font-medium">{entry.developer_type}</div>
                        <div className="col-span-2 flex items-center justify-center gap-2">
                          <div className="w-12 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${entry.readability_score}%` }} />
                          </div>
                          <span className="text-[12px] font-mono text-zinc-500">{entry.readability_score}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-[16px] font-semibold text-white">{entry.overall_score}</span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-emerald-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
