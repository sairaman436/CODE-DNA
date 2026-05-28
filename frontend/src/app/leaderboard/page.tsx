"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, ArrowUpRight, Crown, Medal, Award } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

interface LeaderboardEntry {
  username: string;
  github_username?: string;
  codedna_username?: string;
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
  const username = session?.codedna_username || session?.githubLogin || session?.user?.name;
  const githubLogin = session?.githubLogin;
  const isMe = (entry: LeaderboardEntry) => 
    entry.username === username || entry.github_username === githubLogin || entry.codedna_username === username;
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
        // Silent error
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


      <main className="relative z-10 pt-44 pb-24 px-6">
        <div className="max-w-5xl mx-auto mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-400">Global Rankings</span>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-zinc-100 tracking-tight mb-4">Leaderboard</h1>
              <p className="text-[18px] text-zinc-500 max-w-lg leading-relaxed font-medium">
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
                      ? 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {key.replace('_', ' ')}
                  {activeFilters.includes(key) && key !== 'overall' && (
                    <motion.div layoutId="dot" className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white shadow-lg border-2 border-emerald-500" />
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
              <div className="rounded-[40px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-3xl overflow-hidden shadow-2xl shadow-emerald-500/5">
                <div className="grid grid-cols-12 px-10 py-6 text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 border-b border-white/[0.05]">
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
                        <div className={`grid grid-cols-12 px-10 py-8 items-center group/row hover:bg-white/[0.01] transition-all cursor-pointer relative ${
                          isMe(entry) ? 'bg-white/[0.01]' : ''
                        }`}>
                          {isMe(entry) && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/50 pointer-events-none shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                          )}
                          
                          <div className="col-span-1 relative z-10">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                              isMe(entry) 
                                ? 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.3)]' 
                                : 'bg-white/[0.03] border border-white/[0.06] group-hover/row:border-white/30'
                            }`}>
                              {rankIcon(i)}
                            </div>
                          </div>
                          <div className="col-span-5 flex items-center gap-5 relative z-10">
                            <div className="relative">
                              <img
                                src={entry.avatar_url || `https://github.com/${entry.github_username || entry.username}.png`}
                                alt=""
                                className="w-12 h-12 rounded-[20px] border border-white/[0.1] bg-zinc-900 object-cover group-hover/row:scale-105 transition-transform shadow-lg"
                                onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${entry.username}` }}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <div className={`text-[16px] font-black transition-colors ${
                                  isMe(entry) ? 'text-emerald-400' : 'text-zinc-100 group-hover/row:text-emerald-400'
                                }`}>
                                  {entry.display_name || entry.username}
                                </div>
                                {isMe(entry) && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black uppercase tracking-tighter">You</span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-zinc-600 tracking-tight">@{entry.username}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-center relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-white/5 border border-white/[0.03] text-zinc-400 group-hover/row:border-white/20 transition-all shadow-sm">
                              {entry.developer_type}
                            </span>
                          </div>
                          <div className="col-span-2 flex flex-col items-center gap-3 relative z-10">
                             <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/5">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${
                                   activeFilters.includes('overall') ? entry.overall_score :
                                   (entry as any)[`${activeFilters[0]}_score`] || 0
                                 }%` }}
                                 transition={{ duration: 1, delay: i * 0.1 }}
                                 className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                               />
                             </div>
                             <span className="text-[10px] font-black font-mono text-zinc-500">
                               {activeFilters.includes('overall') ? entry.overall_score :
                                (entry as any)[`${activeFilters[0]}_score`] || 0}%
                             </span>
                          </div>
                          <div className="col-span-2 text-right relative z-10">
                            <span className={`text-2xl font-black transition-colors tracking-tighter ${
                              isMe(entry) ? 'text-emerald-400' : 'text-zinc-100 group-hover/row:text-emerald-400'
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
              <div className="rounded-[40px] border border-white/[0.05] bg-zinc-900/10 divide-y divide-white/[0.03]">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="grid grid-cols-12 px-10 py-8 items-center animate-pulse">
                    <div className="col-span-1"><div className="w-10 h-10 rounded-2xl bg-white/5" /></div>
                    <div className="col-span-5 flex items-center gap-5">
                      <div className="w-12 h-12 rounded-[20px] bg-white/5" />
                      <div className="space-y-2">
                        <div className="w-40 h-5 bg-white/5 rounded-lg" />
                        <div className="w-24 h-3 bg-white/5 rounded-lg" />
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-center"><div className="w-28 h-8 rounded-xl bg-white/5" /></div>
                    <div className="col-span-2 flex justify-center"><div className="w-20 h-2 rounded-full bg-white/5" /></div>
                    <div className="col-span-2 flex justify-end"><div className="w-14 h-8 bg-white/5 rounded-lg" /></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 rounded-[40px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl shadow-2xl">
                <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Trophy className="w-10 h-10 text-emerald-500/50" />
                </div>
                <h3 className="text-3xl font-black text-zinc-100 mb-3 tracking-tight uppercase">Sequence Pending</h3>
                <p className="text-zinc-500 text-[16px] mb-12 max-w-sm mx-auto leading-relaxed">The global DNA registry is empty. Be the first to analyze your technical sequence and claim the throne.</p>
                <Link href="/login">
                  <Button className="h-14 px-12 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] active:scale-95">
                    Initialize Your Sequence
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
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

