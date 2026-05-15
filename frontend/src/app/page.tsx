"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowUpRight, Activity, Trophy, Clock, Zap, Sparkles, 
  Globe, Target, LayoutGrid, ArrowRight, Scale 
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { DynamicBackground } from "@/components/DynamicBackground";
import { RadarChart } from "@/components/RadarChart";

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

function PublicLanding() {
  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500/20 relative overflow-x-hidden">


      <main className="relative z-10">
        {/* ─── Hero Section ─── */}
        <section className="pt-32 pb-32 px-6 relative flex flex-col items-center text-center overflow-visible">
          {/* ── Left Side Decoration: Floating Code Terminal ── */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            className="hidden lg:block absolute left-6 top-32 w-64 p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl rotate-[-3deg] hover:rotate-0 transition-transform duration-700"
          >
            <div className="flex gap-1.5 mb-4">
              <div className="w-2 h-2 rounded-full bg-rose-500/30" />
              <div className="w-2 h-2 rounded-full bg-amber-500/30" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/30" />
            </div>
            <div className="space-y-2 font-mono text-[10px] text-zinc-500">
              <div className="text-emerald-500/70">def analyze_dna(repo):</div>
              <div className="pl-4">ast = parse_structure(repo)</div>
              <div className="pl-4 text-indigo-400/60"># Mapping nesting depth</div>
              <div className="pl-4">return generate_hash(ast)</div>
              <div className="h-2" />
              <div className="flex items-center gap-2">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-1/2 h-full bg-emerald-500/40"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Right Side Decoration: System Metrics ── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="hidden lg:block absolute right-6 top-[32rem] w-56 p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl rotate-[3deg] hover:rotate-0 transition-transform duration-700"
          >
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Real-time Metrics</div>
            <div className="space-y-4">
              {[
                { label: "Complexity", val: "84%", color: "text-emerald-400" },
                { label: "Modularity", val: "0.92", color: "text-indigo-400" },
                { label: "Safety", val: "Secure", color: "text-white" }
              ].map((m, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[10px] text-zinc-500">{m.label}</span>
                  <span className={`text-[10px] font-bold ${m.color}`}>{m.val}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[11px] font-bold uppercase tracking-[0.15em] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Advanced AST Engine V1.2 Stable
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.9] text-white mb-8">
              {["Every", "developer", "writes"].map((word, i) => (
                <motion.span 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: [0.215, 0.61, 0.355, 1] }}
                  className="inline-block mr-[0.2em]"
                >
                  {word}
                </motion.span>
              ))}
              <br /> 
              <motion.span 
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.2, delay: 0.5 }}
                className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40"
              >
                code differently.
              </motion.span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Code DNA parses the structure of your repositories — mapping function nesting, 
              naming patterns, and error handling to your unique developer fingerprint.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500" />
                <button className="relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm flex items-center gap-2 hover:bg-emerald-50 transition-all">
                  Analyze Your GitHub 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
              
              <Link href="/u/sample_dev">
                <motion.button 
                  whileHover={{ x: 5 }}
                  className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium text-sm"
                >
                  View Sample Profile 
                  <div className="w-8 h-px bg-zinc-800 group-hover:w-12 group-hover:bg-emerald-500 transition-all" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ─── Bento Grid Features ─── */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Activity className="w-5 h-5 text-emerald-400" />}
              title="Deep Structural Analysis"
              description="Our engine goes beyond git history. It parses your code into Abstract Syntax Trees (AST) to find patterns in how you nest functions, name variables, and handle errors."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Target className="w-5 h-5 text-indigo-400" />}
              title="Identity Verification"
              description="Unique code fingerprints are generated across 8 distinct dimensions, ensuring your technical identity is as unique as your biological DNA."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Sparkles className="w-5 h-5 text-emerald-400" />}
              title="AI-Powered Insights"
              description="Get automated suggestions on architectural improvements and stylistic consistency based on your historical patterns."
              delay={0.3}
            />
          </div>
        </section>

        {/* ─── Work Flow Section ─── */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">How It Works</h2>
              <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">From repository to fingerprint. The journey of your code through our structural AST engine.</p>
            </div>

            <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
              {[
                { step: '01', title: 'Connect', desc: 'Securely link your GitHub account with read-only access.', icon: <Zap className="w-5 h-5" /> },
                { step: '02', title: 'Parse', desc: 'Our engine builds Abstract Syntax Trees for every function.', icon: <Activity className="w-5 h-5" /> },
                { step: '03', title: 'Map', desc: 'We plot your logic patterns across 8 core dimensions.', icon: <Target className="w-5 h-5" /> },
                { step: '04', title: 'Reveal', desc: 'Generate your unique DNA and share your fingerprint.', icon: <Sparkles className="w-5 h-5" /> }
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative z-10 p-8 rounded-[32px] bg-zinc-900/40 border border-white/[0.05] backdrop-blur-sm group hover:border-emerald-500/30 transition-all flex flex-col items-center text-center h-full"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                      {item.icon}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-4">Step {item.step}</div>
                    <h4 className="text-xl font-bold mb-3 text-white tracking-tight">{item.title}</h4>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">{item.desc}</p>
                  </motion.div>

                  {/* Step Connector Arrow (Desktop) */}
                  {idx < 3 && (
                    <div className="hidden md:flex absolute -right-6 top-14 z-20 items-center justify-center">
                      <motion.div
                        animate={{ x: [0, 5, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-emerald-500/40" />
                      </motion.div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ Section ─── */}
        <section className="py-32 px-6 bg-black/40">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">FAQ</h2>
              <p className="text-zinc-500">Frequently asked questions about Code DNA.</p>
            </div>
            <div className="space-y-4">
              <FAQItem 
                q="How does the AST engine actually work?" 
                a="Unlike simple line counters, our engine parses your source code into an Abstract Syntax Tree. This allows us to understand logical structure, nesting depth, and structural complexity regardless of the programming language." 
              />
              <FAQItem 
                q="Is my source code stored on your servers?" 
                a="No. Code DNA performs analysis in-memory and immediately discards the source code. We only store the resulting metadata and scores to generate your fingerprint." 
              />
              <FAQItem 
                q="Can I analyze private repositories?" 
                a="Yes, if you grant the necessary permissions during GitHub OAuth. We strictly use read-only access and never modify your code." 
              />
              <FAQItem 
                q="How does this differ from the standard GitHub contribution graph?" 
                a="The GitHub graph measures 'how much' you code (commits, PRs). Code DNA measures 'how' you code. We analyze the actual logic structure, patterns, and architectural choices, providing a qualitative fingerprint rather than just a quantitative count." 
              />
              <FAQItem 
                q="Is my developer fingerprint public?" 
                a="Yes. Code DNA is a social-first platform designed for technical discovery and professional networking, similar to LinkedIn. By default, every analyzed profile is public, allowing you to rank on the leaderboard and showcase your verified coding persona to recruiters and the global developer community." 
              />
              <FAQItem 
                q="Does Code DNA support team-wide analysis?" 
                a="Yes. Our Enterprise tier allows engineering leaders to see the aggregate 'Team DNA'—helping identify if a team is trending towards technical debt, high modularity, or if there's a lack of architectural consistency across the board." 
              />
              <FAQItem 
                q="What programming languages are supported?" 
                a="We currently have deep AST support for TypeScript, JavaScript, Python, Rust, Go, and Java. We are constantly expanding our parsers to include more languages from the C-family and Ruby." 
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-24 relative z-10 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
              <div className="md:col-span-4">
                <Link href="/" className="flex items-center gap-3 font-bold text-2xl text-white mb-8 group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  Code DNA
                </Link>
                <p className="text-zinc-500 text-[15px] leading-relaxed mb-8 max-w-sm">
                  Mapping the structural identity of the world's developers through advanced AST analysis and cognitive fingerprinting.
                </p>
                <div className="flex gap-5">
                  {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
                    <Link key={social} href="#" className="text-zinc-600 hover:text-white transition-colors text-sm font-medium">
                      {social}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-white font-bold text-[13px] uppercase tracking-widest mb-8">Platform</h4>
                <ul className="space-y-4 text-[14px] text-zinc-500">
                  <li><Link href="/discover" className="hover:text-emerald-400 transition-colors">Discover</Link></li>
                  <li><Link href="/leaderboard" className="hover:text-emerald-400 transition-colors">Leaderboard</Link></li>
                  <li><Link href="/how-it-works" className="hover:text-emerald-400 transition-colors">How it works</Link></li>
                  <li><Link href="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-white font-bold text-[13px] uppercase tracking-widest mb-8">Contact</h4>
                <ul className="space-y-4 text-[14px] text-zinc-500">
                  <li><a href="mailto:hello@codedna.dev" className="hover:text-emerald-400 transition-colors">Support</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Twitter DM</a></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">Email Us</a></li>
                </ul>
              </div>

              <div className="md:col-span-4">
                <h4 className="text-white font-bold text-[13px] uppercase tracking-widest mb-8">Stay Updated</h4>
                <p className="text-zinc-500 text-[14px] mb-6">Get notified about new engine updates and features.</p>
                <div className="relative max-w-sm group">
                  <input 
                    type="email" 
                    placeholder="you@email.com" 
                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 pr-36"
                  />
                  <button className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-white text-black text-[11px] font-bold rounded-xl hover:bg-emerald-400 transition-colors active:scale-95 whitespace-nowrap">
                    Join Sequence
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-10 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] text-zinc-600 font-medium">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                <span>© {new Date().getFullYear()} Code DNA. Built by developers for developers.</span>
              </div>
              <div className="flex gap-10">
                <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
                <Link href="/cookies" className="hover:text-zinc-400 transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -5, rotateY: 8, rotateX: -4 }}
      style={{ perspective: 1000 }}
      className="p-8 rounded-[32px] bg-white/[0.02] border border-white/[0.05] hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
        <p className="text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
          {description}
        </p>
      </div>
    </motion.div>
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


      <main className="relative z-10 pt-24 pb-20 px-6 max-w-6xl mx-auto">
        {/* Welcome & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/70">Engine V1.2.4</span>
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
