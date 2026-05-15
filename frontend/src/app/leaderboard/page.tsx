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
  documentation_score: number;
  test_mindset_score: number;
  error_handling_score: number;
  language_depth_score: number;
  overall_score: number;
}

import { DynamicBackground } from "@/components/DynamicBackground";

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const username = (session as any)?.githubLogin || session?.user?.name;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<string[]>(['overall']);

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

  const toggleFilter = (filter: string) => {
    if (filter === 'overall') {
      setActiveFilters(['overall']);
      return;
    }
    setActiveFilters(prev => {
      const next = prev.filter(f => f !== 'overall');
      if (next.includes(filter)) {
        const filtered = next.filter(f => f !== filter);
        return filtered.length === 0 ? ['overall'] : filtered;
      }
      return [...next, filter];
    });
  };

  const filtered = entries.filter(entry => {
    if (activeFilters.includes('overall')) return true;
    return activeFilters.every(filter => {
      const score = (entry as any)[`${filter}_score`] || 0;
      return score >= 70; // Recruiter threshold for "High Skill"
    });
  });

  const sorted = [...filtered].sort((a, b) => {
    const primary = activeFilters[0];
    if (primary === 'overall') return b.overall_score - a.overall_score;
    return ((b as any)[`${primary}_score`] || 0) - ((a as any)[`${primary}_score`] || 0);
  });

  const rankIcon = (i: number) => {
    if (i === 0) return <Crown className="w-4 h-4 text-zinc-300" />;
    if (i === 1) return <Medal className="w-4 h-4 text-zinc-400" />;
    if (i === 2) return <Award className="w-4 h-4 text-amber-600/80" />;
    return <span className="text-[11px] font-mono text-zinc-600">{i + 1}</span>;
  };

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-white/20 relative overflow-x-hidden">


      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-400">Global Rankings</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">Community Leaderboard</h1>
              <p className="text-[16px] text-zinc-500 max-w-lg leading-relaxed">
                The top technical minds ranked by structural code quality and architectural depth. 
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-md">
              {(['overall', 'readability', 'complexity', 'documentation', 'test_mindset', 'error_handling', 'language_depth'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                    activeFilters.includes(key)
                      ? 'bg-emerald-500 text-zinc-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {key.replace('_', ' ')}
                  {activeFilters.includes(key) && key !== 'overall' && (
                    <motion.div layoutId="dot" className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Legend Podium (Top 3) */}
          {!loading && sorted.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 items-end pt-8">
              {/* Rank 2 */}
              <div className="order-2 md:order-1">
                <PodiumCard entry={sorted[1]} rank={2} color="text-zinc-400" />
              </div>
              {/* Rank 1 */}
              <div className="order-1 md:order-2">
                <PodiumCard entry={sorted[0]} rank={1} color="text-zinc-100" isMain />
              </div>
              {/* Rank 3 */}
              <div className="order-3">
                <PodiumCard entry={sorted[2]} rank={3} color="text-emerald-600" />
              </div>
            </div>
          )}

          {/* Table */}
          <div className="relative">
            {!loading && sorted.length > 0 ? (
              <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl shadow-emerald-500/5">
                <div className="grid grid-cols-12 px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-600 border-b border-white/[0.05]">
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
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={`/u/${entry.username}`}>
                        <div className={`grid grid-cols-12 px-8 py-6 items-center group/row hover:bg-white/[0.02] transition-all cursor-pointer relative ${
                          entry.username === username ? 'bg-white/[0.01]' : ''
                        }`}>
                          {entry.username === username && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 pointer-events-none" />
                          )}
                          
                          <div className="col-span-1 relative z-10">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                              entry.username === username 
                                ? 'bg-zinc-100 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                                : 'bg-white/[0.03] border border-white/[0.06] group-hover/row:border-white/30'
                            }`}>
                              {rankIcon(i)}
                            </div>
                          </div>
                          <div className="col-span-5 flex items-center gap-4 relative z-10">
                            <div className="relative">
                              <img
                                src={entry.avatar_url || `https://github.com/${entry.username}.png`}
                                alt=""
                                className="w-11 h-11 rounded-2xl border border-white/[0.1] bg-zinc-900 object-cover group-hover/row:scale-105 transition-transform"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${entry.username}` }}
                              />
                              {i < 3 && (
                                <motion.div 
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-zinc-800 border-2 border-black" 
                                />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className={`text-[15px] font-bold transition-colors ${
                                  entry.username === username ? 'text-zinc-300' : 'text-zinc-100 group-hover/row:text-zinc-300'
                                }`}>
                                  {entry.display_name || entry.username}
                                </div>
                                {entry.username === username && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-black font-black uppercase">You</span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-600 tracking-tight">@{entry.username}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center relative z-10">
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/[0.03] text-zinc-400 group-hover/row:border-white/20 transition-all">
                              {entry.developer_type}
                            </span>
                          </div>
                          <div className="col-span-2 flex flex-col items-center gap-2 relative z-10">
                             <div className="w-16 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${
                                   activeFilters.includes('overall') ? entry.overall_score :
                                   (entry as any)[`${activeFilters[0]}_score`] || 0
                                 }%` }}
                                 transition={{ duration: 1, delay: i * 0.1 }}
                                 className="h-full bg-emerald-500/60" 
                               />
                             </div>
                             <span className="text-[10px] font-mono text-zinc-600">
                               {activeFilters.includes('overall') ? entry.overall_score :
                                (entry as any)[`${activeFilters[0]}_score`] || 0}%
                             </span>
                          </div>
                          <div className="col-span-2 text-right relative z-10">
                            <span className={`text-xl font-black transition-colors ${
                              entry.username === username ? 'text-emerald-400' : 'text-zinc-100 group-hover/row:text-emerald-400'
                            }`}>
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
              <div className="rounded-[32px] border border-white/[0.05] bg-zinc-900/10 divide-y divide-white/[0.03]">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 px-8 py-6 items-center animate-pulse">
                    <div className="col-span-1"><div className="w-8 h-8 rounded-xl bg-white/5" /></div>
                    <div className="col-span-5 flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white/5" />
                      <div className="space-y-2">
                        <div className="w-32 h-4 bg-white/5 rounded" />
                        <div className="w-20 h-3 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center"><div className="w-24 h-6 rounded-full bg-white/5" /></div>
                    <div className="col-span-2 flex justify-center"><div className="w-16 h-2 rounded-full bg-white/5" /></div>
                    <div className="col-span-2 flex justify-end"><div className="w-12 h-6 bg-white/5 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 rounded-[32px] border border-white/[0.05] bg-zinc-950/30">
                <Trophy className="w-12 h-12 text-zinc-800 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-2">No DNA Sequences Yet</h3>
                <p className="text-zinc-600 text-sm mb-8 max-w-xs mx-auto">Be the first to analyze your code and claim the top of the board.</p>
                <Link href="/login">
                  <button className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-700 transition-all active:scale-95">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PodiumCard({ entry, rank, color, isMain = false }: { entry: LeaderboardEntry; rank: number; color: string; isMain?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className={`relative p-6 rounded-[32px] bg-white/[0.04] border border-white/[0.1] backdrop-blur-xl text-center group hover:bg-white/[0.06] transition-all ${
        isMain ? 'md:pb-12 md:pt-12 border-white/20 shadow-2xl shadow-emerald-500/10' : ''
      }`}
    >
      <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-zinc-950 border border-white/10 text-[10px] font-black uppercase tracking-widest ${color}`}>
        RANK {rank}
      </div>
      
      <div className="relative inline-block mb-4">
        <img
          src={entry.avatar_url || `https://github.com/${entry.username}.png`}
          alt=""
          className={`${isMain ? 'w-24 h-24' : 'w-16 h-16'} rounded-[32px] border-2 border-white/10 mx-auto object-cover group-hover:scale-105 transition-transform`}
        />
        {rank === 1 && (
          <Crown className="absolute -top-3 -right-3 w-8 h-8 text-zinc-100 drop-shadow-lg" />
        )}
      </div>

      <h3 className={`font-bold text-zinc-100 truncate mb-1 ${isMain ? 'text-xl' : 'text-base'}`}>
        {entry.display_name || entry.username}
      </h3>
      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-4">
        {entry.developer_type}
      </div>
      
      <div className="inline-block px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
        <span className={`font-black ${isMain ? 'text-2xl' : 'text-xl'}`}>
          {entry.overall_score}
        </span>
        <span className="text-[8px] ml-2 text-zinc-600 font-black uppercase tracking-tighter">DNA Score</span>
      </div>
    </motion.div>
  );
}

