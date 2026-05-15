"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const ARCHETYPES: Record<string, {
  title: string; tagline: string; color: string;
  traits: string[]; strengths: string[]; weaknesses: string[];
  famous: string[]; tip: string;
  scores: { axis: string; range: string }[];
}> = {
  "the-architect": {
    title: "The Architect",
    tagline: "You build systems that last.",
    color: "emerald",
    traits: ["Highly structured code", "Strong naming conventions", "Modular design patterns", "Preference for composition over inheritance"],
    strengths: ["Readability", "Refactor Tendency", "Commit Discipline"],
    weaknesses: ["Can over-engineer simple problems", "May prioritize structure over shipping speed"],
    famous: ["Linus Torvalds", "Martin Fowler", "Robert C. Martin"],
    tip: "Your instinct for clean architecture is rare. Channel it by mentoring juniors and writing internal design docs.",
    scores: [
      { axis: "Readability", range: "80–95" },
      { axis: "Refactor Tendency", range: "75–90" },
      { axis: "Commit Discipline", range: "70–85" },
    ],
  },
  "the-hacker": {
    title: "The Hacker",
    tagline: "You move fast and break conventions.",
    color: "cyan",
    traits: ["Polyglot coding", "High complexity tolerance", "Rapid prototyping", "Unconventional solutions"],
    strengths: ["Complexity", "Language Depth", "Error Handling"],
    weaknesses: ["Documentation often sparse", "Code can be hard for others to read"],
    famous: ["John Carmack", "Fabrice Bellard", "George Hotz"],
    tip: "Your speed is your superpower. Add brief inline comments to make your brilliant hacks accessible to your team.",
    scores: [
      { axis: "Complexity", range: "85–100" },
      { axis: "Language Depth", range: "70–90" },
      { axis: "Error Handling", range: "60–80" },
    ],
  },
  "the-perfectionist": {
    title: "The Perfectionist",
    tagline: "Every line matters to you.",
    color: "purple",
    traits: ["Immaculate documentation", "Rigorous refactoring", "High test coverage", "Consistent formatting"],
    strengths: ["Documentation", "Test Mindset", "Readability"],
    weaknesses: ["Can spend too long polishing", "Scope creep on refactors"],
    famous: ["Dan Abramov", "Evan You", "Rich Harris"],
    tip: "Your attention to detail creates exceptional codebases. Set time-boxes for refactoring to stay productive.",
    scores: [
      { axis: "Documentation", range: "85–100" },
      { axis: "Test Mindset", range: "75–95" },
      { axis: "Readability", range: "80–95" },
    ],
  },
  "the-debugger": {
    title: "The Debugger",
    tagline: "You make systems resilient.",
    color: "orange",
    traits: ["Deep error handling", "Defensive programming", "Logging-first approach", "Edge case awareness"],
    strengths: ["Error Handling", "Complexity", "Test Mindset"],
    weaknesses: ["May over-handle errors", "Can add too many safety nets"],
    famous: ["Bryan Cantrill", "Brendan Gregg", "Julia Evans"],
    tip: "Your resilience-first mindset is critical for production systems. Consider writing postmortem docs to share your debugging expertise.",
    scores: [
      { axis: "Error Handling", range: "85–100" },
      { axis: "Test Mindset", range: "65–85" },
      { axis: "Complexity", range: "60–80" },
    ],
  },
  "the-polyglot": {
    title: "The Polyglot",
    tagline: "You speak every language.",
    color: "pink",
    traits: ["Multi-language fluency", "Adaptive coding style", "Broad technology exposure", "Quick learner"],
    strengths: ["Language Depth", "Complexity", "Refactor Tendency"],
    weaknesses: ["May lack deep expertise in one language", "Inconsistent idioms across projects"],
    famous: ["Andrej Karpathy", "TJ Holowaychuk", "antirez"],
    tip: "Your breadth is rare. Pick one language to go truly deep on — it will amplify all your other skills.",
    scores: [
      { axis: "Language Depth", range: "80–100" },
      { axis: "Complexity", range: "60–80" },
      { axis: "Refactor Tendency", range: "65–85" },
    ],
  },
  "the-pragmatist": {
    title: "The Pragmatist",
    tagline: "You ship what matters.",
    color: "yellow",
    traits: ["Balanced across all dimensions", "Ship-focused", "Practical trade-offs", "Team-oriented"],
    strengths: ["Commit Discipline", "Readability", "Documentation"],
    weaknesses: ["Rarely exceptional in any single dimension", "May avoid complex challenges"],
    famous: ["DHH", "Taylor Otwell", "Guillermo Rauch"],
    tip: "Your balance is your strength. Focus on one dimension to push into 'exceptional' territory.",
    scores: [
      { axis: "Commit Discipline", range: "70–85" },
      { axis: "Readability", range: "65–80" },
      { axis: "Documentation", range: "60–75" },
    ],
  },
  "the-scientist": {
    title: "The Scientist",
    tagline: "You optimize with data.",
    color: "blue",
    traits: ["Algorithm-heavy code", "Performance-conscious", "Mathematical patterns", "Benchmark-driven"],
    strengths: ["Complexity", "Language Depth", "Error Handling"],
    weaknesses: ["Code can be hard to read", "Over-optimization of non-bottlenecks"],
    famous: ["Peter Norvig", "Jeff Dean", "Chris Lattner"],
    tip: "Your analytical approach produces efficient systems. Add comments explaining the 'why' behind algorithmic choices.",
    scores: [
      { axis: "Complexity", range: "80–100" },
      { axis: "Language Depth", range: "75–90" },
      { axis: "Error Handling", range: "60–80" },
    ],
  },
  "the-mentor": {
    title: "The Mentor",
    tagline: "You write code that teaches.",
    color: "teal",
    traits: ["Exceptional documentation", "Self-documenting code", "Tutorial-quality examples", "Inclusive naming"],
    strengths: ["Documentation", "Readability", "Commit Discipline"],
    weaknesses: ["May over-document simple things", "Can be verbose"],
    famous: ["Sarah Drasner", "Wes Bos", "Kent C. Dodds"],
    tip: "Your code educates others. Consider open-sourcing more — your documentation style is a gift to the community.",
    scores: [
      { axis: "Documentation", range: "90–100" },
      { axis: "Readability", range: "80–95" },
      { axis: "Commit Discipline", range: "75–90" },
    ],
  },
};

export default function ArchetypePage() {
  const params = useParams();
  const slug = params.type as string;
  const arch = ARCHETYPES[slug];

  if (!arch) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">Archetype not found</h1>
          <Link href="/" className="text-zinc-400 hover:underline text-sm">Go home</Link>
        </div>
      </div>
    );
  }

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
            <Link href="/login" className="text-white hover:text-zinc-300 transition-colors">Sign In</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <Link href="/discover" className="inline-flex items-center gap-2 text-[12px] text-zinc-600 hover:text-white transition-colors mb-12">
          <ArrowLeft className="w-3.5 h-3.5" /> All archetypes
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-3">{arch.title}</h1>
          <p className="text-xl text-zinc-500 mb-16">{arch.tagline}</p>
        </motion.div>

        {/* Traits */}
        <section className="mb-16">
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Core Traits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {arch.traits.map((trait) => (
              <div key={trait} className="bg-zinc-950 p-5 flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-white/60 shrink-0" />
                <span className="text-[13px] text-zinc-300">{trait}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typical Scores */}
        <section className="mb-16">
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Typical Score Ranges</h2>
          <div className="rounded-2xl border border-white/[0.04] bg-zinc-950/30 p-8 space-y-4">
            {arch.scores.map((s) => (
              <div key={s.axis} className="flex items-center justify-between">
                <span className="text-[13px] text-zinc-400 font-medium">{s.axis}</span>
                <span className="text-[13px] font-mono text-white/80">{s.range}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04] rounded-2xl overflow-hidden mb-16">
          <div className="bg-zinc-950 p-8">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/70 font-bold mb-5">Strengths</h3>
            <ul className="space-y-3">
              {arch.strengths.map((s) => (
                <li key={s} className="text-[13px] text-zinc-300 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/60" /> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-zinc-950 p-8">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-5">Watch Out For</h3>
            <ul className="space-y-3">
              {arch.weaknesses.map((w) => (
                <li key={w} className="text-[13px] text-zinc-500 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-zinc-600" /> {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Famous Examples */}
        <section className="mb-16">
          <h2 className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Famous Examples</h2>
          <div className="flex flex-wrap gap-3">
            {arch.famous.map((name) => (
              <span key={name} className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] text-zinc-400 font-medium">
                {name}
              </span>
            ))}
          </div>
        </section>

        {/* Pro Tip */}
        <section className="rounded-2xl border border-white/10 bg-zinc-800/[0.03] p-8 mb-16">
          <h3 className="text-[11px] uppercase tracking-[0.15em] text-white/70 font-bold mb-4">Pro Tip</h3>
          <p className="text-[14px] text-zinc-400 leading-relaxed">{arch.tip}</p>
        </section>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link href="/login">
            <button className="h-11 px-8 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-700 transition-all">
              Discover Your Archetype
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
