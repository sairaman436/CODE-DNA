"use client";

import { useState } from "react";
import { RadarData } from "@/components/RadarChart";
import { OverlappingRadarChart } from "@/components/OverlappingRadarChart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";

interface CompareResult {
  user1: { username: string; type: string; avatar_url: string | null };
  user2: { username: string; type: string; avatar_url: string | null };
  compatibility_score: number;
  team_fit: string;
  comparison: { axis: string; user1_score: number; user2_score: number; stronger: string }[];
  radar1: RadarData[];
  radar2: RadarData[];
}

export default function ComparePage() {
  const [dev1, setDev1] = useState("");
  const [dev2, setDev2] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCompare() {
    if (!dev1.trim() || !dev2.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/compare/${dev1.trim()}/${dev2.trim()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Comparison failed');
        return;
      }
      const data = await res.json();
      setResult(data);
    } catch {
      setError('Could not connect to the backend.');
    } finally {
      setLoading(false);
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

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-black text-emerald-400">Diagnostic Suite</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-100 mb-4">Compare DNA</h1>
          <p className="text-[16px] text-zinc-500 max-w-lg leading-relaxed">
            See how two developer fingerprints overlap. Both developers must have been analyzed first.
          </p>
        </div>

        {/* Input Section */}
        <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-8 mb-16 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full group/input">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                value={dev1} onChange={(e) => setDev1(e.target.value)}
                className="pl-12 bg-white/[0.03] border-white/[0.08] text-zinc-100 h-14 rounded-2xl text-[14px] placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                placeholder="First Developer"
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              />
            </div>
            <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest px-2">vs</span>
            <div className="relative flex-1 w-full group/input">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within/input:text-emerald-500 transition-colors" />
              <Input
                value={dev2} onChange={(e) => setDev2(e.target.value)}
                className="pl-12 bg-white/[0.03] border-white/[0.08] text-zinc-100 h-14 rounded-2xl text-[14px] placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-white/20 transition-all"
                placeholder="Second Developer"
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              />
            </div>
            <Button
              className="h-14 px-10 rounded-2xl bg-zinc-100 text-black hover:bg-white font-black uppercase tracking-widest text-[11px] w-full md:w-auto transition-all shadow-xl shadow-emerald-500/5 active:scale-95"
              onClick={handleCompare} disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Run Diagnostic
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-center mb-12 p-5 rounded-2xl border border-white/10 bg-zinc-800/[0.03]">
            <p className="text-zinc-300 text-[13px] font-medium">{error}</p>
            <p className="text-zinc-600 text-[11px] mt-1">Both developers need to have been analyzed first.</p>
          </div>
        )}

        {/* Empty State */}
        {!result && !error && (
          <div className="text-center py-32">
            <p className="text-zinc-700 text-[14px]">Enter two GitHub usernames above to compare their DNA fingerprints.</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Compatibility Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.08] border border-white/[0.08] rounded-[32px] overflow-hidden shadow-2xl">
              <div className="bg-white/[0.04] p-8 text-center backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-2">Compatibility</div>
                <div className="text-5xl font-black text-zinc-100">{result.compatibility_score}%</div>
              </div>
              <div className="bg-white/[0.04] p-8 text-center backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-2">Team Fit</div>
                <div className="text-xl font-bold text-zinc-300 tracking-tight">{result.team_fit}</div>
              </div>
              <div className="bg-white/[0.04] p-8 text-center backdrop-blur-md">
                <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-2">Diagnostic Profiles</div>
                <div className="text-[13px] text-zinc-400 font-mono">
                  {result.user1.type} <span className="text-zinc-700 font-sans mx-2">VS</span> {result.user2.type}
                </div>
              </div>
            </div>

            {/* Radar Overlap + Skill Gap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08] rounded-[32px] overflow-hidden shadow-2xl">
              {/* Radar */}
              <div className="bg-white/[0.04] p-10 flex flex-col items-center backdrop-blur-md">
                <div className="flex gap-6 text-[10px] mb-8 self-start font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-zinc-400">@{result.user1.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="text-zinc-400">@{result.user2.username}</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] rounded-full" />
                  <OverlappingRadarChart
                    datasets={[result.radar1, result.radar2]}
                    colors={["#10b981", "#52525b"]}
                    width={380} height={380}
                  />
                </div>
              </div>

              {/* Skill Gap */}
              <div className="bg-white/[0.04] p-10 backdrop-blur-md">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-8">Skill Gap Analysis</h3>
                <div className="space-y-5">
                  {result.comparison
                    .sort((a, b) => Math.abs(b.user1_score - b.user2_score) - Math.abs(a.user1_score - a.user2_score))
                    .slice(0, 6)
                    .map((c) => (
                      <div key={c.axis}>
                        <div className="flex justify-between text-[11px] mb-2">
                          <span className="text-zinc-400 font-medium">{c.axis}</span>
                          <span className="text-zinc-600">{c.user1_score} vs {c.user2_score}</span>
                        </div>
                        <div className="flex gap-1 h-1">
                          <div className="bg-white/40 rounded-full" style={{ width: `${c.user1_score}%` }} />
                          <div className="bg-zinc-700/40 rounded-full" style={{ width: `${c.user2_score}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
