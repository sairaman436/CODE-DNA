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

import { DynamicBackground } from "@/components/DynamicBackground";

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
    if (i === 0) return <Crown className="w-4 h-4 text-emerald-400" />;
    if (i === 1) return <Medal className="w-4 h-4 text-zinc-400" />;
    if (i === 2) return <Award className="w-4 h-4 text-amber-600/80" />;
    return <span className="text-[11px] font-mono text-zinc-600">{i + 1}</span>;
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500/20 relative overflow-x-hidden">


      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/80">Global Rankings</span>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">Community Leaderboard</h1>
                <p className="text-[16px] text-zinc-500 max-w-lg leading-relaxed">
                  The top technical minds ranked by structural code quality and architectural depth. 
                  Analyzed via AST fingerprinting.
                </p>
              </div>
              <div className="flex gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                {(['overall', 'readability', 'complexity'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      sortBy === key
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            {!loading && sorted.length > 0 ? (
              <div className="rounded-[32px] border border-white/[0.05] bg-zinc-900/20 backdrop-blur-sm overflow-hidden">
                <div className="grid grid-cols-12 px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 border-b border-white/[0.05]">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Developer</div>
                  <div className="col-span-2 text-center">Archetype</div>
                  <div className="col-span-2 text-center">AST Metric</div>
                  <div className="col-span-2 text-right">DNA Score</div>
                </div>

                <div className="divide-y divide-white/[0.03]">
                  {sorted.map((entry, i) => (
                    <motion.div
                      key={entry.username}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={`/u/${entry.username}`}>
                        <div className="grid grid-cols-12 px-8 py-6 items-center group/row hover:bg-white/[0.02] transition-all cursor-pointer">
                          <div className="col-span-1">
                            <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover/row:border-emerald-500/30 transition-colors">
                              {rankIcon(i)}
                            </div>
                          </div>
                          <div className="col-span-5 flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={entry.avatar_url || `https://github.com/${entry.username}.png`}
                                alt=""
                                className="w-11 h-11 rounded-2xl border border-white/[0.1] bg-zinc-900 object-cover group-hover/row:scale-105 transition-transform"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${entry.username}` }}
                              />
                              {i < 3 && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />}
                            </div>
                            <div>
                              <div className="text-[15px] font-bold text-white mb-0.5 group-hover/row:text-emerald-400 transition-colors">
                                {entry.display_name || entry.username}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-600 tracking-tight">@{entry.username}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 text-zinc-400">
                              {entry.developer_type}
                            </span>
                          </div>
                          <div className="col-span-2 flex flex-col items-center gap-2">
                             <div className="w-16 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                               <div className="h-full bg-emerald-500/40" style={{ width: `${entry.readability_score}%` }} />
                             </div>
                             <span className="text-[10px] font-mono text-zinc-600">{entry.readability_score}%</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-xl font-bold text-white group-hover/row:text-emerald-400 transition-colors">
                              {entry.overall_score}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                 <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                 <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">Retrieving DNA Data...</p>
              </div>
            ) : (
              <div className="text-center py-32 rounded-[32px] border border-white/[0.05] bg-zinc-950/30">
                <Trophy className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-2">No DNA Sequences Yet</h3>
                <p className="text-zinc-600 text-sm mb-8 max-w-xs mx-auto">Be the first to analyze your code and claim the top of the board.</p>
                <Link href="/login">
                  <Button className="rounded-xl bg-white text-black font-bold hover:bg-emerald-400">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

