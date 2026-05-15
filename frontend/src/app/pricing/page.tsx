"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "For individual developers exploring their DNA.",
    features: [
      "Analyze up to 10 repos (Public & Private)",
      "8-axis DNA fingerprint",
      "Archetype classification",
      "Compare with 1 developer",
      "Basic radar chart",
      "Community support",
    ],
    cta: "Get Started",
    href: "/login",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    desc: "For developers who want deeper insights.",
    features: [
      "Unlimited public repos",
      "Private repo analysis",
      "Historical DNA tracking",
      "Unlimited comparisons",
      "Exportable DNA card",
      "Priority engine queue",
      "Commit-level analysis",
      "API access",
    ],
    cta: "Coming Soon",
    href: "#",
    highlight: true,
  },
  {
    name: "Team",
    price: "$29",
    period: "/month",
    desc: "For engineering teams and hiring managers.",
    features: [
      "Everything in Pro",
      "Team DNA dashboard",
      "Candidate screening",
      "Skill gap analysis",
      "Custom archetypes",
      "SSO / SAML",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Contact Us",
    href: "#",
    highlight: false,
  },
];

export default function PricingPage() {
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

      <main className="relative z-10 pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-8 bg-white/50" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/70">Pricing</span>
              <div className="h-px w-8 bg-white/50" />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Simple, transparent pricing.
            </h1>
            <p className="text-[16px] text-zinc-500 max-w-lg mx-auto">
              Start free. Upgrade when you need deeper insights, private repo access, or team features.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-zinc-950 p-8 flex flex-col ${plan.highlight ? 'ring-1 ring-white/20 ring-inset relative' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 inset-x-0 h-px bg-white/40" />
                )}
                <div className="mb-8">
                  <h3 className="text-[13px] font-bold text-zinc-400 uppercase tracking-wider mb-4">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-semibold text-white">{plan.price}</span>
                    <span className="text-[13px] text-zinc-600">{plan.period}</span>
                  </div>
                  <p className="text-[12px] text-zinc-600">{plan.desc}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[12px]">
                      <Check className="w-3.5 h-3.5 text-white/60 mt-0.5 shrink-0" />
                      <span className="text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.href}>
                  <Button className={`w-full h-10 rounded-xl text-[13px] font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-black hover:bg-zinc-700'
                      : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                  }`}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
            Code DNA © {new Date().getFullYear()}
          </div>
          <div className="flex gap-8">
            <Link href="/how-it-works" className="hover:text-zinc-300 transition-colors">Docs</Link>
            <Link href="/pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link>
            <Link href="/discover" className="hover:text-zinc-300 transition-colors">Discover</Link>
            <Link href="/compare" className="hover:text-zinc-300 transition-colors">Compare</Link>
            <Link href="/leaderboard" className="hover:text-zinc-300 transition-colors">Leaderboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
