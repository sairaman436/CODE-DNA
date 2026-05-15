"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Authenticate",
    desc: "You connect via GitHub OAuth. We request read:user and repo scopes. This allows our engine to analyze both your public and private repositories without requiring write permissions.",
    detail: "OAuth 2.0 · Read-only · Public & Private"
  },
  {
    num: "02",
    title: "Clone & Filter",
    desc: "Our engine clones up to 10 of your repositories (public or private) in parallel using --depth 1 and --filter=blob:none flags. Only the latest snapshot of source code is downloaded — no history, no binary assets.",
    detail: "10 repos · Parallel threads · ~15 seconds"
  },
  {
    num: "03",
    title: "Parse ASTs",
    desc: "Each source file is parsed into an Abstract Syntax Tree. We extract structural metrics: function nesting depth, cyclomatic complexity, naming conventions, try-catch patterns, and assertion density.",
    detail: "Python · JavaScript · TypeScript · Go · Rust · Java"
  },
  {
    num: "04",
    title: "Score & Classify",
    desc: "Raw metrics are normalized into 8 dimensional scores (0–100). These scores are fed into a classification algorithm that maps your profile to one of 8 developer archetypes.",
    detail: "8 axes · Weighted scoring · Archetype mapping"
  },
  {
    num: "05",
    title: "Purge & Deliver",
    desc: "All cloned repositories are immediately deleted from volatile memory. Only your computed scores and archetype are stored — never your source code. Your DNA fingerprint is ready.",
    detail: "Zero retention · Scores only · GDPR compliant"
  }
];

const METRICS = [
  { name: "Readability", what: "Line length, naming consistency, function size, blank line ratio." },
  { name: "Complexity", what: "Cyclomatic complexity, max nesting depth, branching density." },
  { name: "Documentation", what: "Comment ratio, docstring presence, README quality." },
  { name: "Test Mindset", what: "Test file count, assertion density, test-to-code ratio." },
  { name: "Commit Discipline", what: "Message length, conventional commits, atomic changes." },
  { name: "Language Depth", what: "Idiomatic patterns, stdlib usage, feature adoption." },
  { name: "Refactor Tendency", what: "Code churn, rename frequency, dead code removal." },
  { name: "Error Handling", what: "Try-catch depth, custom exceptions, fallback patterns." },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[15px] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors">Home</Link>
            <Link href="/discover" className="text-zinc-500 hover:text-white transition-colors">Discover</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/pricing" className="text-zinc-500 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-white hover:text-zinc-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-white/50" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/70">Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight leading-[1.1] mb-6">
            How Code DNA<br />
            <span className="text-zinc-500">analyzes your code.</span>
          </h1>
          <p className="text-[17px] text-zinc-500 max-w-xl leading-[1.7]">
            A transparent breakdown of every stage in the pipeline — from OAuth handshake to DNA generation. No black boxes.
          </p>
        </div>

        {/* Pipeline Steps */}
        <div className="max-w-4xl mx-auto mb-32">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/[0.04]" />
            
            <div className="space-y-0">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-8 group"
                >
                  {/* Node */}
                  <div className="relative flex-shrink-0 pt-8">
                    <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/[0.06] flex items-center justify-center text-[11px] font-mono text-zinc-600 group-hover:text-zinc-400 group-hover:border-white/20 transition-all z-10 relative">
                      {step.num}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="py-8 border-b border-white/[0.04] flex-1">
                    <h3 className="text-[17px] font-semibold text-white mb-3 group-hover:text-zinc-300 transition-colors">{step.title}</h3>
                    <p className="text-[13px] text-zinc-500 leading-[1.7] mb-4 max-w-lg">{step.desc}</p>
                    <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-zinc-700 bg-zinc-950 px-3 py-1.5 rounded-md border border-white/[0.04]">
                      {step.detail}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Breakdown */}
        <div className="max-w-4xl mx-auto mb-32">
          <h2 className="text-xl font-semibold text-white tracking-tight mb-4">What we measure</h2>
          <p className="text-[15px] text-zinc-500 mb-12 max-w-lg">Each dimension is scored 0–100 based on weighted heuristics extracted from your ASTs.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {METRICS.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="bg-zinc-950 p-6 group hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-1 rounded-full bg-white/60" />
                  <h4 className="text-[13px] font-semibold text-zinc-300">{m.name}</h4>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">{m.what}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="max-w-4xl mx-auto mb-32">
          <h2 className="text-xl font-semibold text-white tracking-tight mb-12">Security & Privacy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {[
              { title: "No Code Stored", desc: "Repositories are cloned into volatile memory and purged immediately after analysis. We never write your source code to disk." },
              { title: "Read-Only Access", desc: "OAuth scope is limited to read:user and public_repo. We cannot push, delete, or modify anything in your GitHub account." },
              { title: "Delete Anytime", desc: "One-click data deletion from Settings. Removes all scores, vectors, fingerprints, and associated data permanently." },
            ].map((item) => (
              <div key={item.title} className="bg-zinc-950 p-8">
                <h4 className="text-[13px] font-semibold text-white mb-3">{item.title}</h4>
                <p className="text-[11px] text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-white mb-4 tracking-tight">Try it yourself</h2>
          <p className="text-zinc-500 text-[15px] mb-8">60 seconds. Zero code stored. Full transparency.</p>
          <Link href="/login">
            <button className="h-11 px-8 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-700 transition-all">
              Analyze GitHub
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
