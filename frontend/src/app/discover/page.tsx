"use client";

import Link from "next/link";
import { Search, ArrowUpRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const FEATURED_DEVS = [
  { name: "Sairaman", archetype: "The Architect", scores: { readability: 92, complexity: 45 }, lang: "TypeScript", repos: 6 },
  { name: "alex-chen", archetype: "The Hacker", scores: { readability: 65, complexity: 95 }, lang: "Rust", repos: 12 },
  { name: "sarah-dev", archetype: "The Perfectionist", scores: { readability: 98, complexity: 30 }, lang: "Python", repos: 8 },
  { name: "devinross", archetype: "The Debugger", scores: { readability: 78, complexity: 60 }, lang: "Go", repos: 15 },
  { name: "maya-code", archetype: "The Polyglot", scores: { readability: 82, complexity: 70 }, lang: "Kotlin", repos: 9 },
];

const ARCHETYPES = [
  { type: "The Architect", slug: "the-architect", count: "12%", desc: "Structured, scalable code with strong readability." },
  { type: "The Hacker", slug: "the-hacker", count: "24%", desc: "Speed-first developers who tackle high complexity." },
  { type: "The Perfectionist", slug: "the-perfectionist", count: "8%", desc: "Immaculate docs and relentless refactoring." },
  { type: "The Debugger", slug: "the-debugger", count: "18%", desc: "Deep error handling and resilient systems." },
  { type: "The Polyglot", slug: "the-polyglot", count: "15%", desc: "Multi-language fluency with broad adaptability." },
  { type: "The Pragmatist", slug: "the-pragmatist", count: "23%", desc: "Balanced across all dimensions, ship-focused." },
];

const ACTIVITY_ITEMS = [
  { user: "sarah-dev", action: "analyzed", result: "The Perfectionist", time: "2m ago" },
  { user: "alex-chen", action: "compared with", result: "devinross", time: "5m ago" },
  { user: "maya-code", action: "analyzed", result: "The Polyglot", time: "12m ago" },
  { user: "Sairaman", action: "analyzed", result: "The Architect", time: "18m ago" },
  { user: "jdoe-dev", action: "analyzed", result: "The Hacker", time: "25m ago" },
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [liveActivity, setLiveActivity] = useState(ACTIVITY_ITEMS);

  const [developers, setDevelopers] = useState(FEATURED_DEVS);
  const [loading, setLoading] = useState(true);

  const filteredDevs = developers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.archetype.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    async function fetchDiscoverData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Fetch all developers
        const res = await fetch(`${apiUrl}/api/leaderboard?sortBy=overall`);
        const allDevs = await res.json();
        setDevelopers(allDevs);

        // Fetch real activity
        const activityRes = await fetch(`${apiUrl}/api/activity`);
        const realActivity = await activityRes.json();
        if (realActivity.length > 0) {
          setLiveActivity(realActivity);
        }
      } catch (err) {
        console.error('Error fetching discover data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDiscoverData();
  }, []);

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
            <Link href="/compare" className="text-zinc-500 hover:text-white transition-colors">Compare</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/pricing" className="text-zinc-500 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-white hover:text-emerald-400 transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-emerald-500/50" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/70">Community</span>
          </div>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div>
              <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Discover</h1>
              <p className="text-[15px] text-zinc-500 max-w-lg">
                Browse developer fingerprints from the community. Filter by archetype, language, or search by username.
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
                className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl h-10 pl-11 pr-4 text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/30 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Archetype Distribution */}
        <div className="max-w-6xl mx-auto mb-20">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Archetype Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {ARCHETYPES.map((arch) => (
              <Link key={arch.type} href={`/archetype/${arch.slug}`}>
                <div className="bg-zinc-950 p-5 group hover:bg-zinc-900/40 transition-colors cursor-pointer h-full">
                  <div className="text-[22px] font-semibold text-zinc-400 mb-1 group-hover:text-emerald-400 transition-colors">{arch.count}</div>
                  <div className="text-[12px] font-semibold text-zinc-300 mb-2">{arch.type}</div>
                  <div className="text-[10px] text-zinc-600 leading-relaxed">{arch.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Developer Table */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Featured Profiles</h3>

          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 text-[10px] uppercase tracking-[0.12em] font-bold text-zinc-700 border-b border-white/[0.04]">
            <div className="col-span-4">Developer</div>
            <div className="col-span-2">Archetype</div>
            <div className="col-span-2 text-center">Readability</div>
            <div className="col-span-2 text-center">Complexity</div>
            <div className="col-span-1 text-center">Repos</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-white/[0.03]">
            {filteredDevs.map((dev, i) => (
              <Link key={dev.name} href={`/profile/${dev.name}`}>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-12 px-6 py-5 items-center group hover:bg-zinc-950/80 transition-colors cursor-pointer rounded-lg"
                >
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[11px] font-bold text-zinc-500 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
                      {dev.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[13px] font-semibold text-zinc-300 group-hover:text-white transition-colors">{dev.name}</span>
                      <span className="block text-[11px] text-zinc-600">{dev.lang}</span>
                    </div>
                  </div>
                  <div className="col-span-2 text-[12px] text-zinc-500 font-medium">{dev.archetype}</div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <div className="w-12 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/50 rounded-full" style={{ width: `${dev.scores.readability}%` }} />
                    </div>
                    <span className="text-[12px] font-mono text-zinc-500">{dev.scores.readability}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-center gap-2">
                    <div className="w-12 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-500/50 rounded-full" style={{ width: `${dev.scores.complexity}%` }} />
                    </div>
                    <span className="text-[12px] font-mono text-zinc-500">{dev.scores.complexity}</span>
                  </div>
                  <div className="col-span-1 text-center text-[12px] text-zinc-600">{dev.repos}</div>
                  <div className="col-span-1 flex justify-end">
                    <ArrowUpRight className="w-4 h-4 text-zinc-800 group-hover:text-emerald-500 transition-colors" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {filteredDevs.length === 0 && (
            <div className="text-center py-20 text-zinc-600 text-sm">
              No developers match "{searchQuery}".
            </div>
          )}
        </div>
        {/* Activity Feed */}
        <div className="max-w-6xl mx-auto mt-20">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500/60" /> Live Activity
            </div>
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] text-emerald-500/80">SYSTEM LIVE</span>
            </div>
          </h3>
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-950/30 divide-y divide-white/[0.03] overflow-hidden">
            <AnimatePresence mode="popLayout">
              {liveActivity.slice(0, 5).map((item, i) => (
                <motion.div
                  key={`${item.user}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.4 }}
                  className="px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                    <span className="text-[13px] text-zinc-400">
                      <span className="text-zinc-300 font-medium">{item.user}</span>
                      {' '}{item.action}{' '}
                      <span className="text-emerald-500/80 font-medium">{item.result}</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-700 font-mono">{item.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
