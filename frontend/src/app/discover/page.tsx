"use client";

import Link from "next/link";
import { Search, ArrowUpRight, Activity, Code2, Layers, Cpu } from "lucide-react";
import { RadarChart } from "@/components/RadarChart";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Normalized shape used everywhere in this page
interface NormalizedDev {
  name: string;
  username: string;
  github_username: string;
  archetype: string;
  readability: number;
  complexity: number;
  overall: number;
  avatar_url?: string | null;
  languages: { name: string; color: string; value: number }[];
  radar: { axis: string; value: number }[];
}

const ARCHETYPES = [
  { type: "The Architect", slug: "the-architect", count: "12%", desc: "Structured, scalable code with strong readability." },
  { type: "The Hacker", slug: "the-hacker", count: "24%", desc: "Speed-first developers who tackle high complexity." },
  { type: "The Perfectionist", slug: "the-perfectionist", count: "8%", desc: "Immaculate docs and relentless refactoring." },
  { type: "The Debugger", slug: "the-debugger", count: "18%", desc: "Deep error handling and resilient systems." },
  { type: "The Polyglot", slug: "the-polyglot", count: "15%", desc: "Multi-language fluency with broad adaptability." },
  { type: "The Pragmatist", slug: "the-pragmatist", count: "23%", desc: "Balanced across all dimensions, ship-focused." },
];

/** Normalize API leaderboard entries into the shape this page expects */
function normalizeDevs(raw: any[]): NormalizedDev[] {
  return raw.map(d => ({
    name: d.display_name || d.username || d.name || "Unknown",
    username: d.codedna_username || d.github_username || d.username || d.name || "unknown",
    github_username: d.github_username || d.username || "unknown",
    archetype: d.developer_type || d.archetype || "Unknown",
    readability: d.readability_score ?? d.readability ?? 0,
    complexity: d.complexity_score ?? d.complexity ?? 0,
    overall: d.overall_score ?? d.overall ?? 0,
    avatar_url: d.avatar_url || null,
    languages: d.languages || [{ name: "JS", color: "#f1e05a", value: 100 }],
    radar: d.radar || [
      { axis: "Readability", value: d.readability_score ?? 80 },
      { axis: "Complexity", value: d.complexity_score ?? 60 },
      { axis: "Refactoring", value: d.refactor_tendency_score ?? 70 },
      { axis: "Testing", value: d.test_mindset_score ?? 50 },
      { axis: "Docs", value: d.documentation_score ?? 40 }
    ]
  }));
}

import { DynamicBackground } from "@/components/DynamicBackground";
import { SilkBackground } from "@/components/SilkBackground";

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [liveActivity, setLiveActivity] = useState<any[]>([]);

  const [developers, setDevelopers] = useState<NormalizedDev[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredDevs = developers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.archetype.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    async function fetchDiscoverData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Fetch all developers from leaderboard
        const res = await fetch(`${apiUrl}/api/leaderboard?sortBy=overall`);
        const allDevs = await res.json();
        const entries = allDevs.leaderboard || allDevs || [];
        if (Array.isArray(entries) && entries.length > 0) {
          setDevelopers(normalizeDevs(entries));
        }

        // Fetch real activity
        const activityRes = await fetch(`${apiUrl}/api/activity`);
        const realActivity = await activityRes.json();
        const actItems = realActivity.activity || realActivity || [];
        if (Array.isArray(actItems) && actItems.length > 0) {
          setLiveActivity(actItems);
        }
      } catch (err) {
        console.error("Failed to fetch discover data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDiscoverData();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/20 relative overflow-x-hidden pb-24">
      <SilkBackground color="#050505" />
      <DynamicBackground />


      <main className="relative z-10 pt-32 pb-24 px-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-black text-emerald-400">Diagnostic Database</span>
          </div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">Discover</h1>
              <p className="text-[16px] text-zinc-500 max-w-lg leading-relaxed">
                Browse technical fingerprints from the global community. Filter by archetype, language, or search by identity.
              </p>
            </div>
            
            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search developers..."
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl h-10 pl-11 pr-4 text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-white/30 backdrop-blur-xl transition-all"
              />
            </div>
          </div>
        </div>

        {/* Archetype Distribution */}
        <div className="max-w-6xl mx-auto mb-20">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-8">System Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.08] border border-white/[0.08] rounded-[32px] overflow-hidden shadow-2xl group/grid">
            {ARCHETYPES.map((arch) => (
              <Link key={arch.type} href={`/archetype/${arch.slug}`}>
                <div className="bg-white/[0.03] p-8 group hover:bg-white/[0.08] transition-all cursor-pointer h-full backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.02] transition-colors" />
                  <div className="relative z-10">
                    <div className="text-[28px] font-black text-zinc-100 mb-2 group-hover:text-emerald-500 transition-colors tracking-tighter drop-shadow-2xl">{arch.count}</div>
                    <div className="text-[13px] font-bold text-zinc-400 mb-3 group-hover:text-zinc-100 transition-colors uppercase tracking-tight">{arch.type}</div>
                    <div className="text-[11px] text-zinc-600 leading-relaxed group-hover:text-zinc-500 transition-colors font-medium">{arch.desc}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Developer Talent Grid */}
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black">Featured Talents</h3>
              <div className="h-px w-8 bg-white/10" />
            </div>
            <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
              <span className="text-zinc-800">Filter By Sequence</span>
              <div className="flex items-center gap-6">
                <button className="text-emerald-500 border-b border-emerald-500 pb-1">DNA Score</button>
                <button className="text-zinc-600 hover:text-zinc-300 transition-colors pb-1 border-b border-transparent">Latest Scans</button>
                <button className="text-zinc-600 hover:text-zinc-300 transition-colors pb-1 border-b border-transparent">Activity</button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="p-7 rounded-[32px] bg-white/[0.02] border border-white/[0.05] animate-pulse h-[340px] flex flex-col justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5" />
                    <div className="space-y-2">
                      <div className="w-24 h-4 bg-white/5 rounded" />
                      <div className="w-16 h-3 bg-white/5 rounded" />
                      <div className="w-20 h-3.5 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between"><div className="w-10 h-2 bg-white/5 rounded" /><div className="w-6 h-2 bg-white/5 rounded" /></div>
                    <div className="h-1 bg-white/5 rounded" />
                    <div className="flex justify-between"><div className="w-10 h-2 bg-white/5 rounded" /><div className="w-6 h-2 bg-white/5 rounded" /></div>
                    <div className="h-1 bg-white/5 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between"><div className="w-20 h-2 bg-white/5 rounded" /><div className="w-12 h-2 bg-white/5 rounded" /></div>
                    <div className="h-2 bg-white/5 rounded-full" />
                  </div>
                </div>
              ))
            ) : (
              filteredDevs.map((dev, i) => (
                <DeveloperCard key={dev.username} dev={dev} index={i} />
              ))
            )}
          </div>

          {!loading && filteredDevs.length === 0 && (
            <div className="text-center py-20 text-zinc-600 text-sm bg-white/[0.02] rounded-[32px] border border-dashed border-white/10">
              No developers match &quot;{searchQuery}&quot;.
            </div>
          )}
        </div>
        {/* Activity Feed */}
        <div className="max-w-6xl mx-auto mt-24">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Live Diagnostic Feed
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">SYSTEM ONLINE</span>
            </div>
          </h3>
          <div className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl divide-y divide-white/[0.04] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
            <AnimatePresence mode="popLayout">
              {liveActivity.length > 0 ? (
                liveActivity.slice(0, 5).map((item, i) => (
                  <motion.div
                    key={`${item.user}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4 }}
                    className="px-6 py-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                      <span className="text-[13px] text-zinc-400">
                        <span className="text-zinc-300 font-medium">{item.user}</span>
                        {' '}{item.action}{' '}
                        <span className="text-zinc-100/80 font-medium">{item.result}</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-700 font-mono">{item.time}</span>
                  </motion.div>
                ))
              ) : (
                <div className="px-6 py-8 text-center text-zinc-600 text-xs">
                  No recent diagnostic activity recorded.
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DeveloperCard({ dev, index }: { dev: NormalizedDev; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <Link href={`/profile/${dev.username}`}>
        <div className="relative z-10 p-7 rounded-[32px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.06] transition-all h-full flex flex-col group/card">
          {/* Glass Highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
          
          {/* Top: Avatar & Name */}
          <div className="flex items-center gap-4 mb-8">
            <img 
              src={dev.avatar_url || `https://github.com/${dev.github_username}.png`} 
              alt="" 
              className="w-14 h-14 rounded-2xl border border-white/[0.1] object-cover shadow-2xl bg-zinc-900"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${dev.github_username}` }}
            />
            <div>
              <h4 className="text-[15px] font-bold text-zinc-100 group-hover:text-white transition-colors leading-tight">{dev.name}</h4>
              <span className="text-[11px] font-mono text-zinc-500 block mb-1">@{dev.username}</span>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                <span className="text-[10px] uppercase tracking-widest font-black text-zinc-500">{dev.archetype}</span>
              </div>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <span className="text-[18px] font-black text-zinc-100">{dev.overall}</span>
              <span className="text-[8px] uppercase tracking-tighter text-zinc-600 font-bold">DNA SCORE</span>
            </div>
          </div>

          {/* Middle: DNA Metric Pulse Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-8">
            {dev.radar.slice(0, 4).map((metric) => (
              <div key={metric.axis} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-[8px] uppercase tracking-widest font-black text-zinc-600">{(metric.axis).substring(0, 4)}</span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">{metric.value}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.02]">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${metric.value}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full bg-zinc-100/40 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom: Language DNA Bar */}
          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[9px] uppercase tracking-widest font-black text-zinc-600">Language DNA</span>
              <span className="text-[10px] font-mono text-zinc-500">{dev.languages[0]?.name} {dev.languages[0]?.value}%</span>
            </div>
            <div className="flex h-2 w-full rounded-full bg-white/[0.05] overflow-hidden border border-white/[0.05]">
              {dev.languages.map((lang, idx) => (
                <div 
                  key={idx}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all relative group/bar"
                  style={{ width: `${lang.value}%`, backgroundColor: lang.color }}
                >
                  <div className="absolute inset-0 opacity-40 blur-[4px]" style={{ backgroundColor: lang.color }} />
                </div>
              ))}
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight className="w-4 h-4 text-zinc-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
