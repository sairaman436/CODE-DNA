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
            <Link href="/leaderboard" className="text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/pricing" className="text-zinc-500 hover:text-white transition-colors">Pricing</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-emerald-500/50" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/70">Compare</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">Compare DNA</h1>
          <p className="text-[15px] text-zinc-500 max-w-lg">
            See how two developer fingerprints overlap. Both developers must have been analyzed first.
          </p>
        </div>

        {/* Input Section */}
        <div className="rounded-2xl border border-white/[0.04] bg-zinc-950/30 p-6 mb-16">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
              <Input
                value={dev1} onChange={(e) => setDev1(e.target.value)}
                className="pl-11 bg-zinc-950/50 border-white/[0.06] text-zinc-300 h-11 rounded-xl text-[13px] placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                placeholder="Developer 1"
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              />
            </div>
            <span className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest px-3">vs</span>
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
              <Input
                value={dev2} onChange={(e) => setDev2(e.target.value)}
                className="pl-11 bg-zinc-950/50 border-white/[0.06] text-zinc-300 h-11 rounded-xl text-[13px] placeholder:text-zinc-700 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                placeholder="Developer 2"
                onKeyDown={(e) => e.key === 'Enter' && handleCompare()}
              />
            </div>
            <Button
              className="h-11 px-6 rounded-xl bg-white text-black hover:bg-emerald-400 font-semibold text-[13px] w-full md:w-auto transition-all"
              onClick={handleCompare} disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Compare
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-center mb-12 p-5 rounded-2xl border border-rose-500/10 bg-rose-500/[0.03]">
            <p className="text-rose-400 text-[13px] font-medium">{error}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
              <div className="bg-zinc-950 p-8 text-center">
                <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-2">Compatibility</div>
                <div className="text-5xl font-semibold text-white">{result.compatibility_score}%</div>
              </div>
              <div className="bg-zinc-950 p-8 text-center">
                <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-2">Team Fit</div>
                <div className="text-lg font-semibold text-emerald-400">{result.team_fit}</div>
              </div>
              <div className="bg-zinc-950 p-8 text-center">
                <div className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-2">Profiles</div>
                <div className="text-[13px] text-zinc-400">
                  {result.user1.type} <span className="text-zinc-700">vs</span> {result.user2.type}
                </div>
              </div>
            </div>

            {/* Radar Overlap + Skill Gap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
              {/* Radar */}
              <div className="bg-zinc-950 p-8 flex flex-col items-center">
                <div className="flex gap-6 text-[11px] mb-6 self-start">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-400">@{result.user1.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                    <span className="text-zinc-400">@{result.user2.username}</span>
                  </div>
                </div>
                <OverlappingRadarChart
                  datasets={[result.radar1, result.radar2]}
                  colors={["#10b981", "#52525b"]}
                  width={380} height={380}
                />
              </div>

              {/* Skill Gap */}
              <div className="bg-zinc-950 p-8">
                <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Skill Gap Analysis</h3>
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
                          <div className="bg-emerald-500/40 rounded-full" style={{ width: `${c.user1_score}%` }} />
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
