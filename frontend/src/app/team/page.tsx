"use client";

import { Users2, ShieldAlert, Zap } from "lucide-react";
import { RadarChart, RadarData } from "@/components/RadarChart";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const MOCK_TEAM_MEMBERS = [
  { name: "Saira", role: "Frontend Lead", type: "The Architect", avatar: "https://github.com/saira.png" },
  { name: "Alex", role: "Backend Eng", type: "The Optimizer", avatar: "https://github.com/shadcn.png" },
  { name: "Sarah", role: "Fullstack", type: "The Documenter", avatar: "https://github.com/shadcn.png" }
];

const MOCK_TEAM_RADAR: RadarData[] = [
  { axis: "Readability", value: 88 },
  { axis: "Complexity", value: 75 },
  { axis: "Documentation", value: 92 },
  { axis: "Test Mindset", value: 45 },
  { axis: "Commit Discipline", value: 80 },
  { axis: "Language Depth", value: 65 },
  { axis: "Refactor Tendency", value: 70 },
  { axis: "Error Handling", value: 55 },
];

export default function TeamPage() {
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
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-28">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16">
          <div>
            <div className="inline-flex items-center justify-center p-3 bg-zinc-900 border border-zinc-800 rounded-2xl mb-6 shadow-2xl">
              <Users2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Alpha Engineering Team</h1>
            <p className="text-xl text-zinc-400">Aggregated DNA profile for your team.</p>
          </div>
          <Button className="bg-white text-black hover:bg-zinc-200">
            + Invite Member
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold mb-8 text-zinc-100">Team Aggregate DNA</h2>
              <div className="w-full flex items-center justify-center p-4">
                <RadarChart data={MOCK_TEAM_RADAR} width={450} height={400} />
              </div>
            </section>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-emerald-400">
                  <Zap className="w-5 h-5" />
                  <h3 className="font-bold">Team Superpower</h3>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Your team excels in <strong className="text-emerald-400">Documentation</strong> and <strong className="text-emerald-400">Readability</strong>. This codebase will be incredibly easy to onboard new developers into.
                </p>
              </section>
              
              <section className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-bold">Critical Blind Spot</h3>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Your team's aggregate <strong className="text-rose-400">Test Mindset</strong> is deeply concerning (45%). Consider hiring a QA Engineer or enforcing stricter CI/CD testing rules.
                </p>
              </section>
            </div>
          </div>

          {/* Members List */}
          <div className="lg:col-span-1">
            <section className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm h-full">
              <h2 className="text-xl font-bold mb-6 text-zinc-100">Roster (3)</h2>
              
              <div className="space-y-4">
                {MOCK_TEAM_MEMBERS.map(member => (
                  <div key={member.name} className="flex items-center gap-4 p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl">
                    <img 
                      src={member.avatar} 
                      alt={member.name} 
                      className="w-12 h-12 rounded-full border border-zinc-700"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://github.com/shadcn.png' }}
                    />
                    <div>
                      <p className="font-bold text-zinc-200">{member.name}</p>
                      <p className="text-xs text-zinc-500">{member.role} • {member.type}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-zinc-800/50">
                <p className="text-sm text-zinc-400 mb-4">
                  Add another developer to see how they would shift your team's DNA.
                </p>
                <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white">
                  Simulate New Hire
                </Button>
              </div>

            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
