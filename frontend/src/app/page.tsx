"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Scale, LayoutGrid, Zap, Target, Globe, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { RadarChart } from "@/components/RadarChart";
import { useState, useEffect, useRef } from "react";

const SAMPLE_RADAR = [
  { axis: "Readability", value: 85 },
  { axis: "Complexity", value: 72 },
  { axis: "Documentation", value: 68 },
  { axis: "Test Mindset", value: 45 },
  { axis: "Commit Discipline", value: 78 },
  { axis: "Language Depth", value: 62 },
  { axis: "Refactor Tendency", value: 80 },
  { axis: "Error Handling", value: 55 },
];

const DIMENSIONS = [
  { label: "Readability", value: 85, desc: "How clean and scannable your code is" },
  { label: "Complexity", value: 72, desc: "Your comfort with deep nesting and algorithms" },
  { label: "Documentation", value: 68, desc: "Inline comments, docstrings, and READMEs" },
  { label: "Test Mindset", value: 45, desc: "Test coverage and assertion patterns" },
  { label: "Commit Discipline", value: 78, desc: "Message quality and atomic commits" },
  { label: "Language Depth", value: 62, desc: "Idiomatic usage of your primary languages" },
  { label: "Refactor Tendency", value: 80, desc: "How often you revisit and improve code" },
  { label: "Error Handling", value: 55, desc: "Try-catch depth and defensive patterns" },
];

const CODE_SNIPPET = `function analyzeAST(node, depth = 0) {
  const metrics = {
    nesting: depth,
    branches: 0,
    complexity: 1
  };

  for (const child of node.children) {
    if (child.type === 'IfStatement') {
      metrics.branches++;
      metrics.complexity += 1;
    }
    const sub = analyzeAST(child, depth + 1);
    metrics.complexity += sub.complexity;
  }

  return metrics;
}`;

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (status === "authenticated") {
    return <UserDashboard session={session} />;
  }
  return <PublicLanding />;
}

/* ========================================================================
   PUBLIC LANDING — For visitors who haven't signed in
   ======================================================================== */
function PublicLanding() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/20 overflow-x-hidden relative noise">
      {/* Subtle dot grid texture */}
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[15px] tracking-tight text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/how-it-works" className="text-zinc-500 hover:text-white transition-colors">How it works</Link>
            <Link href="/discover" className="text-zinc-500 hover:text-white transition-colors">Discover</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            <Link href="/pricing" className="text-zinc-500 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login">
              <Button size="sm" className="h-8 px-4 rounded-lg bg-white/[0.06] text-zinc-300 hover:bg-white/10 hover:text-white border border-white/[0.06] text-xs font-medium">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {/* ─── Hero ─── */}
        <section className="pt-40 pb-32 px-6">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="flex items-center gap-2 mb-8"
            >
              <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-emerald-500/60 to-transparent" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/80">Parallel AST Engine</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
              className="text-[clamp(2.5rem,6vw,5rem)] font-semibold tracking-[-0.03em] leading-[1.05] text-white mb-6"
            >
              Every developer writes code<br />
              <span className="text-zinc-500">differently.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[17px] text-zinc-500 max-w-xl leading-[1.7] mb-10"
            >
              Code DNA parses the structure of your GitHub repositories — function nesting, naming conventions, error patterns, commit messages — and maps your style across 8 dimensions.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
              className="flex items-center gap-4"
            >
              <Button onClick={() => router.push('/login')}
                className="h-11 px-7 rounded-xl bg-white text-black hover:bg-emerald-400 transition-all font-semibold text-sm gap-2"
              >
                Analyze Your GitHub <ArrowRight className="w-4 h-4" />
              </Button>
              <Link href="/how-it-works">
                <span className="text-sm text-zinc-500 hover:text-white transition-colors cursor-pointer">Learn more</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ─── Radar + Code Side-by-Side ─── */}
        <section className="px-6 pb-40">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl border border-white/[0.04] overflow-hidden bg-zinc-950/40">
              
              {/* Left: Code Snippet */}
              <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/[0.04]">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="ml-3 text-[11px] text-zinc-600 font-mono">analyzer.ts</span>
                </div>
                <pre className="text-[12px] leading-[1.8] font-mono text-zinc-500 overflow-x-auto">
                  <code>{CODE_SNIPPET.split('\n').map((line, i) => (
                    <span key={i} className="block">
                      <span className="text-zinc-700 select-none inline-block w-6 text-right mr-4">{i + 1}</span>
                      <span className="text-zinc-400">{line}</span>
                    </span>
                  ))}</code>
                </pre>
              </div>

              {/* Right: Radar Preview */}
              <div className="p-8 lg:p-12 flex flex-col items-center justify-center bg-black/30">
                <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-6">Generated Fingerprint</p>
                <div className="opacity-80">
                  <RadarChart data={SAMPLE_RADAR} width={360} height={300} color="#10b981" />
                </div>
                <p className="text-xs text-zinc-600 mt-4 font-medium">The Architect — Readability-first</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 8 Dimensions Grid ─── */}
        <section className="px-6 pb-40">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <Sparkles className="w-4 h-4 text-emerald-500/60" />
              <h2 className="text-xl font-semibold text-white tracking-tight">8 Dimensions of Your Code</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
              {DIMENSIONS.map((dim, i) => (
                <motion.div key={dim.label}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className="bg-zinc-950 p-6 group hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-[13px] font-semibold text-zinc-300">{dim.label}</span>
                    <span className="text-[11px] font-mono text-zinc-600">{dim.value}</span>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full mb-4 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${dim.value}%` }} 
                      transition={{ duration: 1, delay: 0.3 + i * 0.08 }}
                      className="h-full bg-emerald-500/50 rounded-full"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-600 leading-relaxed">{dim.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works (Inline) ─── */}
        <section className="px-6 pb-40">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-white tracking-tight mb-16">How it works</h2>
            <div className="space-y-0">
              {[
                { num: "01", title: "Connect GitHub", desc: "OAuth read-only access. We never see private repos or credentials." },
                { num: "02", title: "Parallel Clone", desc: "10 repositories cloned simultaneously with blob-filter. Only source code is fetched." },
                { num: "03", title: "AST Analysis", desc: "Abstract Syntax Trees are parsed for nesting depth, naming style, and error patterns." },
                { num: "04", title: "DNA Generated", desc: "8-axis fingerprint is computed. All cloned code is immediately purged from memory." },
              ].map((step, i) => (
                <div key={step.num} className="flex gap-8 py-8 border-b border-white/[0.04] group">
                  <span className="text-[11px] font-mono text-zinc-700 pt-1 group-hover:text-emerald-500/60 transition-colors">{step.num}</span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">{step.title}</h3>
                    <p className="text-[13px] text-zinc-500 leading-relaxed max-w-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Stats Counter ─── */}
        <section className="px-6 pb-40">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden">
              <AnimatedStat value={2400} suffix="+" label="Profiles Analyzed" />
              <AnimatedStat value={18000} suffix="+" label="Repos Scanned" />
              <AnimatedStat value={8} suffix="" label="DNA Dimensions" />
              <AnimatedStat value={60} suffix="s" label="Avg Analysis Time" />
            </div>
          </div>
        </section>

        {/* ─── Wall of DNA ─── */}
        <section className="px-6 pb-40 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div>
                <h2 className="text-xl font-semibold text-white tracking-tight mb-3">Global Fingerprint Feed</h2>
                <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">The latest archetypes computed across the globe. Every developer is unique.</p>
              </div>
              <Link href="/discover">
                <Button variant="outline" className="h-9 rounded-lg border-white/[0.06] text-zinc-400 hover:text-white text-[12px] font-medium">
                  View Discover Feed
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: "Saira", type: "Architect", color: "text-emerald-400" },
                { name: "Dev0x", type: "Hacker", color: "text-amber-400" },
                { name: "RefactorKing", type: "Perfectionist", color: "text-blue-400" },
                { name: "AsyncCoder", type: "Explorer", color: "text-purple-400" },
                { name: "Rustacean", type: "Pragmatist", color: "text-zinc-400" }
              ].map((user, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-950/50 border border-white/[0.04] p-5 rounded-2xl group hover:border-emerald-500/20 transition-all cursor-default"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4 flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:text-emerald-400 transition-colors">
                    DNA
                  </div>
                  <div className="text-[13px] font-semibold text-white mb-1">{user.name}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${user.color}`}>{user.type}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="px-6 pb-40">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-white tracking-tight mb-12">Frequently asked questions</h2>
            <div className="divide-y divide-white/[0.04]">
              <FAQItem q="Is my source code stored anywhere?" a="No. Repositories are cloned into volatile memory, analyzed, and immediately purged. We only store your computed scores and archetype classification — never your actual code." />
              <FAQItem q="How are the 8 scores calculated?" a="Each score is derived from weighted heuristics extracted from your Abstract Syntax Trees: function nesting depth, naming consistency, comment ratios, try-catch patterns, test file density, and commit message analysis." />
              <FAQItem q="Can I analyze private repositories?" a="Yes! Code DNA now supports private repository analysis. We request the 'repo' scope during authentication, allowing our engine to securely clone and analyze your private codebases while maintaining read-only security." />
              <FAQItem q="How long does analysis take?" a="With our parallel engine, most profiles complete in under 60 seconds. We clone up to 10 repos simultaneously and analyze the top 50 files per repo." />
              <FAQItem q="Can I delete my data?" a="Yes. Go to Settings and click 'Delete My Data'. This permanently removes all fingerprints, scores, vectors, and associated data." />
              <FAQItem q="What languages are supported?" a="Python, JavaScript, TypeScript, Go, Rust, Java, C, C++, C#, PHP, Swift, Kotlin, Ruby, and Dart. We're adding more continuously." />
            </div>
          </div>
        </section>

        {/* ─── Bottom CTA ─── */}
        <section className="px-6 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4">Ready?</h2>
            <p className="text-zinc-500 mb-10 text-[15px]">Takes less than 60 seconds. Zero code stored.</p>
            <Button onClick={() => router.push('/login')}
              className="h-11 px-8 rounded-xl bg-white text-black hover:bg-emerald-400 transition-all font-semibold text-sm"
            >
              Analyze My GitHub
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] text-zinc-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
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

/* ========================================================================
   USER DASHBOARD — For signed-in users
   ======================================================================== */
function UserDashboard({ session }: { session: any }) {
  const router = useRouter();
  const username = session?.githubLogin || session?.user?.name;
  const avatar = session?.user?.image || `https://avatar.vercel.sh/${username}`;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/profile/${username}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [username]);

  // Polling for analysis status
  useEffect(() => {
    if (!analyzingJobId) return;

    const interval = setInterval(async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/status/${analyzingJobId}`);
        const status = await res.json();
        setJobStatus(status);

        if (status.status === 'completed') {
          setAnalyzingJobId(null);
          setJobStatus(null);
          // Refresh data
          const profileRes = await fetch(`${apiUrl}/api/profile/${username}`);
          const d = await profileRes.json();
          setData(d);
        } else if (status.status === 'failed') {
          setAnalyzingJobId(null);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [analyzingJobId, username]);

  const handleReanalyze = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: session?.githubLogin,
          github_id: session?.githubId,
          display_name: session?.user?.name,
          avatar_url: session?.user?.image,
          access_token: (session as any)?.accessToken
        })
      });
      const result = await res.json();
      if (result.jobId) {
        setAnalyzingJobId(result.jobId);
      }
    } catch (err) {
      console.error('Re-analyze error:', err);
    }
  };

  const quickLinks = [
    { title: "DNA Profile", desc: "View your full 8-axis fingerprint and classification.", href: `/profile/${username}` },
    { title: "Compare DNA", desc: "Overlay your radar with any other developer.", href: "/compare" },
    { title: "Global Discover", desc: "See where you rank across the community.", href: "/discover" },
    { title: "Settings", desc: "Manage privacy and re-analyze repositories.", href: "/settings" },
  ];

  const topScores = data?.radar?.sort((a: any, b: any) => b.value - a.value).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[15px] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-5">
            <Link href={`/profile/${username}`} className="text-[13px] text-zinc-500 hover:text-white transition-colors">Profile</Link>
            <Link href="/discover" className="text-[13px] text-zinc-500 hover:text-white transition-colors">Discover</Link>
            <Link href="/leaderboard" className="text-[13px] text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            <button onClick={() => signOut()} className="text-[13px] text-zinc-600 hover:text-white transition-colors">Sign Out</button>
            <img src={avatar} alt="" className="w-7 h-7 rounded-full border border-white/10" />
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-28 pb-20 px-6 max-w-6xl mx-auto">
        {/* Welcome & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-bold">Authenticated Dashboard</span>
            </div>
            <h1 className="text-4xl font-semibold text-white tracking-tight mb-4">
              Welcome back, <span className="text-zinc-500">{username}</span>
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full">
                <Clock className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-[11px] text-zinc-500">Last Synced: {data?.analyzed_at ? new Date(data.analyzed_at).toLocaleDateString() : 'Never'}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/10 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-emerald-500 font-medium">Identity Secured</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <Button 
              onClick={handleReanalyze}
              disabled={!!analyzingJobId}
              className={`h-11 px-8 rounded-xl font-bold text-sm shrink-0 shadow-lg transition-all flex items-center gap-2 ${analyzingJobId ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-white/10' : 'bg-white text-black hover:bg-emerald-400 shadow-white/5'}`}
            >
              <Zap className={`w-4 h-4 ${analyzingJobId ? 'animate-pulse text-emerald-500' : 'fill-current'}`} />
              {analyzingJobId ? (jobStatus?.current_step || 'Analyzing...') : 'Re-Analyze DNA'}
            </Button>
          </div>
        </div>

        {/* ─── Dashboard Grid Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Top Row: AI Insights & Quick Stats */}
          <div className="lg:col-span-8 space-y-8">
            {/* AI Insights Card */}
            <div className="bg-zinc-950/50 rounded-2xl border border-white/[0.04] p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className="text-[14px] font-semibold text-white">DNA Intelligence</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <h4 className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Archetype Recommendation</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">
                        Your high <span className="text-white">Refactor Tendency</span> suggests a strong aptitude for <span className="text-emerald-400">Senior Architect</span> roles. Focus on system design to level up.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <h4 className="text-[11px] uppercase tracking-wider text-zinc-500 font-bold mb-2">Growth Opportunity</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">
                        Consider increasing your <span className="text-white">Documentation</span> frequency. Current patterns show {100 - (data?.radar?.find((r: any) => r.axis === 'Documentation')?.value || 0)}% untapped clarity potential.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.04]">
              <div className="bg-zinc-950 p-6">
                <div className="flex items-center gap-2 mb-2 text-zinc-600">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Global Rank</span>
                </div>
                <div className="text-xl font-semibold text-white">
                  {data?.radar ? `Top ${Math.max(5, 100 - Math.floor(data.radar.reduce((acc: any, r: any) => acc + r.value, 0) / 8))}%` : '---'}
                </div>
              </div>
              <div className="bg-zinc-950 p-6">
                <div className="flex items-center gap-2 mb-2 text-zinc-600">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Velocity</span>
                </div>
                <div className="text-xl font-semibold text-white">
                  {data?.radar?.find((r: any) => r.axis === 'Complexity')?.value > 70 ? 'High' : 'Optimal'}
                </div>
              </div>
              <div className="bg-zinc-950 p-6">
                <div className="flex items-center gap-2 mb-2 text-zinc-600">
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Accuracy</span>
                </div>
                <div className="text-xl font-semibold text-white">
                  {data?.radar ? `${(data.radar.reduce((acc: any, r: any) => acc + r.value, 0) / 8 + 10).toFixed(1)}%` : '---'}
                </div>
              </div>
              <div className="bg-zinc-950 p-6">
                <div className="flex items-center gap-2 mb-2 text-zinc-600">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Sources</span>
                </div>
                <div className="text-xl font-semibold text-white">{data?.repos_analyzed || 0} Repos</div>
              </div>
            </div>
          </div>

          {/* Top Right: DNA Fingerprint Visualization */}
          <div className="lg:col-span-4 bg-zinc-950/30 rounded-2xl border border-white/[0.04] p-8 flex flex-col items-center justify-center group overflow-hidden">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-8 self-start">Visual DNA</h3>
            {data?.radar ? (
              <div className="w-full aspect-square max-w-[280px] relative">
                <div className="absolute inset-0 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
                <div className="relative z-10">
                  <RadarChart data={data.radar} width={280} height={280} color="#10b981" />
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-zinc-700">
                <Scale className="w-8 h-8 mx-auto mb-4 opacity-20" />
                <p className="text-xs uppercase tracking-widest font-bold">Awaiting Data</p>
              </div>
            )}
            <Link href={`/profile/${username}`} className="mt-8 text-[11px] text-zinc-500 hover:text-white flex items-center gap-2 transition-all">
              EXPAND PROFILE <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ─── Secondary Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* DNA Activity Heatmap (Contribution Pulse) */}
          <div className="lg:col-span-8 bg-zinc-950 p-8 rounded-2xl border border-white/[0.04]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-1">DNA Activity Heatmap</h3>
                <p className="text-[10px] text-zinc-700">Your code fingerprint evolution across all analyzed repositories (Last 90 days).</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-800 uppercase font-bold">Less</span>
                <div className="flex gap-1">
                  {[0.1, 0.3, 0.6, 0.9].map(op => (
                    <div key={op} className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" style={{ opacity: op }} />
                  ))}
                </div>
                <span className="text-[9px] text-zinc-800 uppercase font-bold">More</span>
              </div>
            </div>
            
            {/* Heatmap Grid */}
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((_, row) => (
                <div key={row} className="flex gap-1.5">
                  {Array.from({ length: 13 }).map((_, col) => {
                    // Standard GitHub layout: rows=days, cols=weeks
                    const dayIndex = col * 7 + row;
                    const activityCount = data?.activity_pulse?.[dayIndex] || 0;
                    const intensity = Math.min(activityCount / 5, 1); // Normalize: 5 commits = full intensity
                    
                    return (
                      <div 
                        key={col} 
                        className="flex-1 aspect-square rounded-[2px] transition-colors hover:ring-1 hover:ring-white/20"
                        style={{ 
                          backgroundColor: activityCount > 0 ? '#10b981' : '#18181b',
                          opacity: activityCount > 0 ? (0.2 + intensity * 0.8) : 0.2
                        }}
                        title={`${activityCount} commits on Day ${dayIndex}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-6 text-[9px] uppercase tracking-[0.15em] text-zinc-700 font-bold">
              <span>Past Quarter</span>
              <div className="flex gap-8">
                <span>Refactor Phase</span>
                <span>Feature Sprint</span>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-4 bg-zinc-950 p-8 rounded-2xl border border-white/[0.04]">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-bold mb-8">Navigation</h3>
            <div className="space-y-6">
              {quickLinks.map((link) => (
                <Link key={link.title} href={link.href} className="flex items-center justify-between group py-2 border-b border-white/[0.02] last:border-0">
                  <div>
                    <h4 className="text-[14px] font-semibold text-zinc-300 group-hover:text-emerald-400 transition-colors">{link.title}</h4>
                    <p className="text-[11px] text-zinc-700">{link.desc.split('.')[0]}.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-800 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="mt-12 flex flex-wrap items-center gap-x-12 gap-y-6 px-4">
          <StatusDot label="Engine" value="Hyper-V Parallel" />
          <StatusDot label="API Scopes" value="Read-Only (Secure)" />
          <StatusDot label="Privacy" value="Zero-Retention" />
          <StatusDot label="Database" value="Encrypted Postgre" />
        </div>
      </main>
    </div>
  );
}

function StatusDot({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span className="text-[12px] text-zinc-600">{label}</span>
      <span className="text-[12px] text-zinc-400 font-medium">{value}</span>
    </div>
  );
}

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const duration = 1500;
        const steps = 40;
        const increment = value / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= value) {
            setCount(value);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current));
          }
        }, duration / steps);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="bg-zinc-950 p-8 text-center">
      <div className="text-3xl md:text-4xl font-semibold text-white mb-1 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-[11px] text-zinc-600 uppercase tracking-wider font-bold">{label}</div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-6">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left group">
        <span className="text-[14px] font-medium text-zinc-300 group-hover:text-white transition-colors pr-4">{q}</span>
        <svg className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${open ? 'rotate-45' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[13px] text-zinc-500 leading-relaxed mt-4 max-w-2xl">
          {a}
        </motion.p>
      )}
    </div>
  );
}
