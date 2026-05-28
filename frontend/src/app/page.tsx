"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowUpRight, Activity, Trophy, Clock, Zap, Sparkles, 
  Globe, Target, LayoutGrid, ArrowRight, Scale,
  MessageSquare, Code2, GitPullRequest, GitCommit
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { DynamicBackground } from "@/components/DynamicBackground";
import { SilkBackground } from "@/components/SilkBackground";
import { Navbar } from "@/components/Navbar";
import { RadarChart } from "@/components/RadarChart";
import { SplitTextReveal } from "@/components/animations/SplitTextReveal";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useToast } from "@/components/Toast";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return <PublicLanding />;
}

function PublicLanding() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  async function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      const res = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNewsletterStatus("error");
        setNewsletterMessage(data.error || "Could not join the sequence.");
        return;
      }

      setNewsletterEmail("");
      setNewsletterStatus("success");
      setNewsletterMessage(data.message || "You are on the sequence.");
    } catch {
      setNewsletterStatus("error");
      setNewsletterMessage("Mail link is offline. Try again in a moment.");
    }
  }

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-white/10 relative overflow-x-hidden">
      <Navbar />
      <main className="relative z-10">
        {/* ─── Hero Section ─── */}
        <section className="pt-32 pb-32 px-6 relative flex flex-col items-center text-center overflow-visible">
          {/* ── Left Side Decoration: Floating Code Terminal ── */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -3 }}
            animate={{ opacity: 1, x: 0, rotate: -3 }}
            whileHover={{ rotate: 0, scale: 1.05 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6, 
              delay: 0.1 
            }}
            className="hidden lg:block absolute left-6 top-32 w-72 p-6 rounded-[32px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-2xl transition-colors group/term"
          >
            <div className="absolute inset-0 bg-emerald-500/5 blur-[40px] opacity-0 group-hover/term:opacity-100 transition-opacity" />
            <div className="flex gap-2 mb-6">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
            </div>
            <div className="space-y-2.5 font-mono text-[11px] leading-relaxed relative z-10">
              <div className="flex gap-2">
                <span className="text-emerald-400">def</span>
                <span className="text-sky-400">analyze_dna</span>
                <span className="text-zinc-500">(</span>
                <span className="text-amber-400">repo</span>
                <span className="text-zinc-500">):</span>
              </div>
              <div className="pl-4 flex gap-2">
                <span className="text-zinc-300">ast</span>
                <span className="text-zinc-500">=</span>
                <span className="text-violet-400">parse_structure</span>
                <span className="text-zinc-500">(repo)</span>
              </div>
              <div className="pl-4 text-zinc-600 font-italic italic"># Mapping nesting depth</div>
              <div className="pl-4 flex gap-2">
                <span className="text-emerald-400">return</span>
                <span className="text-rose-400">generate_hash</span>
                <span className="text-zinc-500">(ast)</span>
              </div>
              <div className="h-4" />
              <div className="flex items-center gap-3">
                <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden border border-white/[0.03]">
                  <motion.div 
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-1/3 h-full bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  />
                </div>
                <div className="text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter">PARSING</div>
              </div>
            </div>
          </motion.div>

          {/* ── Right Side Decoration: System Metrics ── */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 3 }}
            whileHover={{ rotate: 0, scale: 1.05 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 0.6, 
              delay: 0.2 
            }}
            className="hidden lg:block absolute right-6 top-[32rem] w-64 p-7 rounded-[32px] bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl shadow-2xl transition-colors group/metrics"
          >
            <div className="absolute inset-0 bg-violet-500/5 blur-[40px] opacity-0 group-hover/metrics:opacity-100 transition-opacity" />
            <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.25em] mb-6 flex items-center justify-between">
              Real-time Metrics
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-5 relative z-10">
              {[
                { label: "Complexity", val: "84%", color: "text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Modularity", val: "0.92", color: "text-sky-400", bg: "bg-sky-500/10" },
                { label: "Safety", val: "Secure", color: "text-violet-400", bg: "bg-violet-500/10" }
              ].map((m, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between items-center px-0.5">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{m.label}</span>
                    <span className={`text-[11px] font-bold ${m.color} tracking-tighter`}>{m.val}</span>
                  </div>
                  <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.02]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: m.val.includes('%') ? m.val : '92%' }}
                      transition={{ duration: 1.5, delay: 0.8 + i * 0.1 }}
                      className={`h-full ${m.bg.replace('/10', '/40')} rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
                    />
                  </div>
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-zinc-100 text-[11px] font-bold uppercase tracking-[0.15em] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Advanced AST Engine V1.2 Stable
            </div>
            
            <SplitTextReveal 
              text={`Every developer writes\ncode differently.`}
              className="text-6xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.9] text-zinc-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] mb-8 pb-2"
              delay={0.2}
              triggerOnScroll={false}
            />

            <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Code DNA parses the structure of your repositories — mapping function nesting, 
              naming patterns, and error handling to your unique developer fingerprint.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <div className="absolute -inset-1 bg-white/20 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500" />
                  <button className="relative px-8 py-4 bg-white text-black rounded-full font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-all">
                    Analyze Your GitHub 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              </Link>
              
              <Link href="/u/sample_dev">
                <motion.button 
                  whileHover={{ x: 5 }}
                  className="group flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors font-medium text-sm"
                >
                  View Sample Profile 
                  <div className="w-8 h-px bg-zinc-800 group-hover:w-12 group-hover:bg-white transition-all" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* ─── Bento Grid Features ─── */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-8" stagger={0.15} y={60}>
            <FeatureCard 
              icon={<Activity className="w-5 h-5 text-zinc-100" />}
              title="Deep Structural Analysis"
              description="Our engine goes beyond git history. It parses your code into Abstract Syntax Trees (AST) to find patterns in how you nest functions, name variables, and handle errors."
              delay={0}
            />
            <FeatureCard 
              icon={<Target className="w-5 h-5 text-zinc-100" />}
              title="Identity Verification"
              description="Unique code fingerprints are generated across 8 distinct dimensions, ensuring your technical identity is as unique as your biological DNA."
              delay={0}
            />
            <FeatureCard 
              icon={<Sparkles className="w-5 h-5 text-zinc-100" />}
              title="AI-Powered Insights"
              description="Get automated suggestions on architectural improvements and stylistic consistency based on your historical patterns."
              delay={0}
            />
          </ScrollReveal>
        </section>

        {/* ─── Work Flow Section ─── */}
        <section className="py-32 px-6 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 pb-2">How It Works</h2>
              <p className="text-zinc-500 max-w-2xl mx-auto text-lg leading-relaxed">From repository to fingerprint. The journey of your code through our structural AST engine.</p>
            </div>

            <ScrollReveal className="relative grid grid-cols-1 md:grid-cols-4 gap-8 items-start" stagger={0.2} y={50}>
              {[
                { step: '01', title: 'Connect', desc: 'Securely link your GitHub account with read-only access.', icon: <Zap className="w-5 h-5" /> },
                { step: '02', title: 'Parse', desc: 'Our engine builds Abstract Syntax Trees for every function.', icon: <Activity className="w-5 h-5" /> },
                { step: '03', title: 'Map', desc: 'We plot your logic patterns across 8 core dimensions.', icon: <Target className="w-5 h-5" /> },
                { step: '04', title: 'Reveal', desc: 'Generate your unique DNA and share your fingerprint.', icon: <Sparkles className="w-5 h-5" /> }
              ].map((item, idx) => (
                <div key={idx} className="relative group">
                  <div 
                    className="relative z-10 p-8 rounded-[32px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-lg group hover:border-white/20 transition-all flex flex-col items-center text-center h-full"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-100 mb-6 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Step {item.step}</div>
                    <h4 className="text-xl font-bold mb-3 text-zinc-100 tracking-tight">{item.title}</h4>
                    <p className="text-[13px] text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>

                  {/* Step Connector Arrow (Desktop) */}
                  {idx < 3 && (
                    <div className="hidden md:flex absolute -right-6 top-14 z-20 items-center justify-center">
                      <motion.div
                        animate={{ x: [0, 5, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: idx * 0.5 }}
                      >
                        <ArrowRight className="w-4 h-4 text-zinc-600" />
                      </motion.div>
                    </div>
                  )}
                </div>
              ))}
            </ScrollReveal>
          </div>
        </section>

        {/* ─── FAQ Section ─── */}
        <section className="py-32 px-6 bg-white/[0.02] border-y border-white/[0.05] backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-500 pb-2">FAQ</h2>
              <p className="text-zinc-500">Frequently asked questions about Code DNA.</p>
            </div>
            <ScrollReveal className="space-y-4" stagger={0.08} y={30}>
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
            </ScrollReveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] py-24 relative z-10 bg-[#050505]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-20">
              <div className="md:col-span-4">
                <Link href="/" className="flex items-center gap-3 font-bold text-2xl text-zinc-100 mb-8 group">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-100">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  Code DNA
                </Link>
                <p className="text-zinc-500 text-[15px] leading-relaxed mb-8 max-w-sm">
                  Mapping the structural identity of the world&apos;s developers through advanced AST analysis and cognitive fingerprinting.
                </p>
                <div className="flex gap-5">
                  {['Twitter', 'GitHub', 'LinkedIn'].map(social => (
                    <Link key={social} href="#" className="text-zinc-600 hover:text-zinc-100 transition-colors text-sm font-medium">
                      {social}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-zinc-100 font-bold text-[13px] uppercase tracking-widest mb-8">Platform</h4>
                <ul className="space-y-4 text-[14px] text-zinc-500">
                  <li><Link href="/discover" className="hover:text-zinc-100 transition-colors">Discover</Link></li>
                  <li><Link href="/leaderboard" className="hover:text-zinc-100 transition-colors">Leaderboard</Link></li>
                  <li><Link href="/how-it-works" className="hover:text-zinc-100 transition-colors">How it works</Link></li>
                  <li><Link href="/login" className="hover:text-zinc-100 transition-colors">Sign In</Link></li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h4 className="text-zinc-100 font-bold text-[13px] uppercase tracking-widest mb-8">Contact</h4>
                <ul className="space-y-4 text-[14px] text-zinc-500">
                  <li><a href="mailto:hello@codedna.dev" className="hover:text-zinc-100 transition-colors">Support</a></li>
                  <li><a href="#" className="hover:text-zinc-100 transition-colors">Twitter DM</a></li>
                  <li><a href="#" className="hover:text-zinc-100 transition-colors">Email Us</a></li>
                </ul>
              </div>

              <div className="md:col-span-4">
                <h4 className="text-zinc-100 font-bold text-[13px] uppercase tracking-widest mb-8">Stay Updated</h4>
                <p className="text-zinc-500 text-[14px] mb-6">Get notified about new engine updates and features.</p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-3 max-w-sm">
                <div className="relative group">
                  <input 
                    type="email" 
                    value={newsletterEmail}
                    onChange={(e) => {
                      setNewsletterEmail(e.target.value);
                      if (newsletterStatus !== "loading") {
                        setNewsletterStatus("idle");
                        setNewsletterMessage("");
                      }
                    }}
                    placeholder="you@email.com" 
                    required
                    className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm focus:outline-none focus:border-white/50 transition-all placeholder:text-zinc-700 pr-36"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading"}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-white text-black text-[11px] font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-95 whitespace-nowrap"
                  >
                    {newsletterStatus === "loading" ? "Joining..." : "Join Sequence"}
                  </button>
                </div>
                {newsletterMessage && (
                  <p className={`text-[12px] font-semibold ${newsletterStatus === "success" ? "text-emerald-400" : "text-red-400"}`}>
                    {newsletterMessage}
                  </p>
                )}
                </form>
              </div>
            </div>

            <div className="pt-10 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] text-zinc-600 font-medium">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
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
      className="p-8 rounded-[32px] bg-white/[0.05] border border-white/[0.1] hover:border-white/30 hover:bg-white/[0.08] backdrop-blur-xl transition-all group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-white/10 group-hover:scale-110 transition-all text-zinc-100">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-4 text-zinc-100">{title}</h3>
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
  const { addToast } = useToast();
  const router = useRouter();
  const username = session?.codedna_username || session?.githubLogin || session?.user?.name;
  const avatar = session?.user?.image || `https://avatar.vercel.sh/${username}`;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingJobId, setAnalyzingJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const displayName = data?.user?.display_name || session?.user?.name || username;

  const patterns = data?.commit_patterns || {
    most_active_hour: 14,
    commit_style: "Descriptive",
    avg_message_length: 42,
    fix_to_feature_ratio: 0.28,
    avg_commit_size: 32,
    emoji_usage_pct: 12.5,
    naming_style: "camelCase",
    avg_fn_length: 22,
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/profile/${username}`);
        if (res.ok) {
          const d = await res.json();
          setData(d);
        } else if (res.status === 404 && username !== "sample_dev") {
          // If the database user is not found, force sign out to invalidate the session cookie
          signOut({ callbackUrl: "/login" });
        }
      } catch (err) {
        // Silent error handling
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
        // Silent polling error
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [analyzingJobId, username]);

  const handleReanalyze = async () => {
    try {
      const targetGithubUsername = session?.githubLogin || data?.user?.github_username;
      const targetGithubId = session?.githubId || data?.user?.github_id;

      if (!targetGithubUsername || !targetGithubId) {
        addToast("Link your GitHub account in settings or sign in with GitHub to analyze repositories.", "error");
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': session?.user?.id || ''
        },
        body: JSON.stringify({
          username: targetGithubUsername,
          github_id: targetGithubId,
          display_name: session?.user?.name || data?.user?.display_name,
          avatar_url: session?.user?.image || data?.user?.avatar_url,
          access_token: (session as any)?.accessToken
        })
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 403 || res.status === 429) {
          router.push(`/analyzing/${targetGithubUsername}`);
        } else {
          addToast(result.message || result.error || 'Failed to start analysis', "error");
        }
        return;
      }
      if (result.jobId) {
        setAnalyzingJobId(result.jobId);
      }
    } catch (err) {
      addToast("Could not start analysis. Try again in a moment.", "error");
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/20 relative overflow-x-hidden pb-24">
      <SilkBackground color="#050505" />
      <DynamicBackground />
      <Navbar />

      <main className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto">
        {/* Welcome & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-lg ${(session as any)?.role === 'ADMIN' ? 'bg-amber-400 shadow-amber-400/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
              <span className={`text-[11px] uppercase tracking-[0.2em] font-black ${(session as any)?.role === 'ADMIN' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(session as any)?.role === 'ADMIN' ? 'Admin Oversight' : 'System Online'}
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-600 font-black">Authenticated Sequence</span>
            </div>
            <h1 className="text-5xl font-bold text-zinc-100 tracking-tight mb-6">
              Welcome back, <span className={(session as any)?.role === 'ADMIN' ? 'text-amber-400' : 'text-zinc-500'}>{displayName}</span>
            </h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full backdrop-blur-xl">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">Last Sync: {data?.analyzed_at ? new Date(data.analyzed_at).toLocaleDateString() : 'Pending'}</span>
              </div>
              <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-xl shadow-lg ${(session as any)?.role === 'ADMIN' ? 'bg-amber-400/5 border border-amber-400/20 text-amber-400' : 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-md ${(session as any)?.role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                <span className="text-[11px] font-black uppercase tracking-widest">
                  {(session as any)?.role === 'ADMIN' ? 'Authority Active' : 'Identity Secured'}
                </span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex justify-start lg:justify-end">
            <Button 
              onClick={handleReanalyze}
              disabled={!!analyzingJobId}
              className={`h-11 px-8 rounded-xl font-bold text-sm shrink-0 shadow-lg transition-all flex items-center gap-2 ${analyzingJobId ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-white/10' : 'bg-white text-black hover:bg-zinc-200 shadow-white/5'}`}
            >
              <Zap className={`w-4 h-4 ${analyzingJobId ? 'animate-pulse text-zinc-100' : 'fill-current'}`} />
              {analyzingJobId ? (jobStatus?.current_step || 'Analyzing...') : 'Re-Analyze DNA'}
            </Button>
          </div>
        </div>

        {/* ─── Dashboard Grid Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Top Row: AI Insights & Quick Stats */}
          <div className="lg:col-span-8 space-y-8">
            {/* AI Insights Card */}
            <div className="bg-white/[0.03] rounded-[32px] border border-white/[0.08] p-8 relative overflow-hidden group backdrop-blur-xl shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] -mr-48 -mt-48 group-hover:bg-emerald-500/10 transition-colors duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-zinc-100 uppercase tracking-widest">DNA Intelligence</h3>
                    <p className="text-[9px] text-zinc-600 font-bold tracking-[0.2em] uppercase mt-1">AI-Powered Structural Insights</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/60 font-black mb-3">Archetype Recommendation</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                        Your high <span className="text-zinc-100">Refactor Tendency</span> suggests a strong aptitude for <span className="text-emerald-400">Senior Architect</span> roles. Focus on system design.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-3">Growth Opportunity</h4>
                      <p className="text-[13px] text-zinc-400 leading-relaxed font-medium">
                        Consider increasing your <span className="text-zinc-100">Documentation</span> frequency. Current patterns show {100 - (data?.radar?.find((r: any) => r.axis === 'Documentation')?.value || 0)}% untapped clarity.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/[0.08] rounded-[32px] overflow-hidden border border-white/[0.08] shadow-2xl">
              <div className="bg-white/[0.03] p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all group/stat">
                <div className="flex items-center gap-3 mb-4 text-zinc-600 group-hover/stat:text-emerald-500 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em]">Global Rank</span>
                </div>
                <div className="text-2xl font-black text-zinc-100 tracking-tighter">
                  {data?.radar ? `Top ${Math.max(5, 100 - Math.floor(data.radar.reduce((acc: any, r: any) => acc + r.value, 0) / 8))}%` : '---'}
                </div>
              </div>
              <div className="bg-white/[0.03] p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all group/stat">
                <div className="flex items-center gap-3 mb-4 text-zinc-600 group-hover/stat:text-sky-500 transition-colors">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em]">Velocity</span>
                </div>
                <div className="text-2xl font-black text-zinc-100 tracking-tighter">
                  {data?.radar?.find((r: any) => r.axis === 'Complexity')?.value > 70 ? 'HIGH-SPEED' : 'OPTIMAL'}
                </div>
              </div>
              <div className="bg-white/[0.03] p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all group/stat">
                <div className="flex items-center gap-3 mb-4 text-zinc-600 group-hover/stat:text-violet-500 transition-colors">
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em]">Accuracy</span>
                </div>
                <div className="text-2xl font-black text-zinc-100 tracking-tighter tabular-nums">
                  {data?.radar ? `${(data.radar.reduce((acc: any, r: any) => acc + r.value, 0) / 8 + 10).toFixed(1)}%` : '---'}
                </div>
              </div>
              <div className="bg-white/[0.03] p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all group/stat">
                <div className="flex items-center gap-3 mb-4 text-zinc-600 group-hover/stat:text-amber-500 transition-colors">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em]">Sources</span>
                </div>
                <div className="text-2xl font-black text-zinc-100 tracking-tighter">
                  {data?.repos_analyzed || 0} <span className="text-[14px] text-zinc-600">REPOS</span>
                </div>
              </div>
              <div className="bg-white/[0.03] p-8 backdrop-blur-xl hover:bg-white/[0.06] transition-all group/stat">
                <div className="flex items-center gap-3 mb-4 text-zinc-600 group-hover/stat:text-emerald-500 transition-colors">
                  <GitCommit className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em]">Commits</span>
                </div>
                <div className="text-2xl font-black text-zinc-100 tracking-tighter">
                  {data?.total_commits ? data.total_commits.toLocaleString() : '0'} <span className="text-[14px] text-zinc-600">PARSED</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Right: DNA Fingerprint Visualization */}
          <div className="lg:col-span-4 bg-white/[0.03] rounded-[32px] border border-white/[0.08] p-10 flex flex-col justify-between items-stretch group overflow-hidden backdrop-blur-xl shadow-2xl relative min-h-[460px]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            <div>
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-8">Sequence Diagnostics</h3>
              {data?.radar ? (
                <div className="w-full space-y-4">
                  {data.radar.map((r: any, i: number) => (
                    <div key={r.axis} className="space-y-1.5">
                      <div className="flex justify-between items-center px-0.5">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{r.axis}</span>
                        <span className="text-[10px] font-bold text-emerald-400">{r.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.04]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${r.value}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: i * 0.05 }}
                          className="h-full bg-gradient-to-r from-emerald-500/80 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-zinc-700">
                  <Scale className="w-10 h-10 mx-auto mb-4 opacity-20 animate-pulse" />
                  <p className="text-[9px] uppercase tracking-[0.3em] font-black">Syncing Sequence...</p>
                </div>
              )}
            </div>
            <Link href={`/profile/${username}`} className="mt-8 text-[10px] font-black tracking-[0.2em] text-zinc-500 hover:text-emerald-400 flex items-center justify-center gap-3 transition-all group/link self-center">
              EXPAND FULL PORTAL <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ─── Secondary Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Code Signature & Git Patterns Bento Card */}
          <div className="lg:col-span-8 bg-white/[0.03] p-10 rounded-[32px] border border-white/[0.08] backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            
            <div className="mb-8">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-2">Code Signature & Git Patterns</h3>
              <p className="text-[11px] text-zinc-600 font-medium">Deep structural analysis of commit metrics, styling standards, and development cycle diagnostics.</p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Card 1: Chronological Focus */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4 text-emerald-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-black tracking-widest">Chronological Focus</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[20px] font-black tracking-tight text-zinc-100">
                      {patterns.most_active_hour ? `${patterns.most_active_hour}:00` : '14:00'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                      {patterns.most_active_hour < 12 ? 'Early Bird' : patterns.most_active_hour >= 18 ? 'Night Owl' : 'Peak Afternoon'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                    Your commit activity peaks during this period, indicating high-focus and optimal cognitive state.
                  </p>
                </div>
              </div>

              {/* Card 2: Message Signature */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4 text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-black tracking-widest">Message Signature</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[20px] font-black tracking-tight text-zinc-100">
                      {patterns.commit_style || 'Descriptive'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                      {patterns.avg_message_length ? `${Math.round(patterns.avg_message_length)} chars` : '42 chars'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                    You write {patterns.commit_style === 'Imperative' ? 'concise, action-driven' : 'highly explanatory, rich'} commit summaries with an emoji density of {patterns.emoji_usage_pct ? `${patterns.emoji_usage_pct.toFixed(1)}%` : '12.5%'}.
                  </p>
                </div>
              </div>

              {/* Card 3: Codebase Topology */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4 text-emerald-400">
                  <Code2 className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-black tracking-widest">Codebase Topology</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[20px] font-black tracking-tight text-zinc-100">
                      {patterns.avg_fn_length ? `${Math.round(patterns.avg_fn_length)} lines` : '22 lines'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                      {patterns.naming_style || 'camelCase'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                    Average function length reflects solid modularity, formatted strictly matching standard {patterns.naming_style || 'camelCase'} guidelines.
                  </p>
                </div>
              </div>

              {/* Card 4: Change Velocity */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
                <div className="flex items-center gap-3 mb-4 text-emerald-400">
                  <GitPullRequest className="w-4 h-4" />
                  <span className="text-[9px] uppercase font-black tracking-widest">Change Velocity</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[20px] font-black tracking-tight text-zinc-100">
                      {patterns.avg_commit_size ? `${patterns.avg_commit_size} lines` : '32 lines'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                      {patterns.fix_to_feature_ratio ? `${(patterns.fix_to_feature_ratio * 100).toFixed(0)}% ref` : '28% ref'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                    Your commit footprints are lightweight with {patterns.fix_to_feature_ratio > 0.4 ? 'heavy bug-fixing cycles' : 'focused feature creation increments'}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-4 bg-white/[0.03] p-10 rounded-[32px] border border-white/[0.08] backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-10">Portal Navigation</h3>
            <div className="space-y-8 relative z-10">
              {quickLinks.map((link) => (
                <Link key={link.title} href={link.href} className="flex items-center justify-between group py-3 border-b border-white/[0.04] last:border-0 hover:border-white/20 transition-all">
                  <div>
                    <h4 className="text-[15px] font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors uppercase tracking-tight">{link.title}</h4>
                    <p className="text-[11px] text-zinc-600 font-medium mt-1 uppercase tracking-tighter">{link.desc.split('.')[0]}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                    <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
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
      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
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
      <div className="text-3xl md:text-4xl font-semibold text-zinc-100 mb-1 tabular-nums">
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
        <span className="text-[14px] font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors pr-4">{q}</span>
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
