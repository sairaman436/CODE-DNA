"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Share2, ArrowUpRight, ExternalLink, MapPin, Globe, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadarChart, RadarData } from "@/components/RadarChart";
import Link from "next/link";

interface ProfileData {
  user: { username: string; codedna_username: string | null; display_name: string | null; avatar_url: string | null; last_analyzed_at: string | null };
  type: string;
  summary: string;
  strengths: string[];
  growth_areas: string[];
  radar: RadarData[];
  languages: { language: string; total_lines: number; total_commits: number; trend: string }[];
  commit_patterns: any;
  repos_analyzed: number;
  total_files_analyzed: number;
  analyzed_at: string;
}

import { DynamicBackground } from "@/components/DynamicBackground";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      // Mock data for sample profile
      if (username === "sample_dev") {
        setProfile({
          user: {
            username: "sample_dev",
            codedna_username: "Architect-X",
            display_name: "The Sample Architect",
            avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sample",
            last_analyzed_at: new Date().toISOString()
          },
          type: "System Architect",
          summary: "A developer who prioritizes structural integrity and high-level modularity. Their code fingerprints show a deep mastery of complex design patterns and a preference for clean, decoupled architectures.",
          strengths: ["Structural Integrity", "Decoupled Logic", "Deep AST Nesting", "Type Safety"],
          growth_areas: ["Documentation Verbosity", "Micro-optimization"],
          radar: [
            { subject: "Structural Depth", value: 92, fullMark: 100 },
            { subject: "Modularity", value: 88, fullMark: 100 },
            { subject: "Idiomatic Expression", value: 75, fullMark: 100 },
            { subject: "Error Resilience", value: 82, fullMark: 100 },
            { subject: "Namespace Hygiene", value: 95, fullMark: 100 },
            { subject: "Concurrency Pattern", value: 68, fullMark: 100 },
            { subject: "Complexity Gradient", value: 85, fullMark: 100 },
            { subject: "Dependency Gravity", value: 90, fullMark: 100 },
          ],
          languages: [
            { language: "Rust", total_lines: 45200, total_commits: 124, trend: "+12%" },
            { language: "TypeScript", total_lines: 32000, total_commits: 88, trend: "+5%" },
            { language: "Python", total_lines: 15000, total_commits: 45, trend: "-2%" }
          ],
          commit_patterns: {},
          repos_analyzed: 14,
          total_files_analyzed: 1240,
          analyzed_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/profile/${username}`);
        if (res.ok) {
          setProfile(await res.json());
        } else {
          const err = await res.json();
          setError(err.error || "Profile not found");
        }
      } catch {
        setError("Could not connect to the server.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <DynamicBackground />
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">Decoding AST Fingerprint...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/20 relative overflow-hidden">
        <DynamicBackground />
        <div className="min-h-screen flex items-center justify-center text-center px-6 relative z-10">
          <div className="max-w-md">
            <div className="w-20 h-20 mx-auto mb-8 rounded-[32px] bg-zinc-900/50 border border-white/[0.05] flex items-center justify-center text-3xl">🧬</div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Sequence Terminated</h1>
            <p className="text-zinc-500 mb-10 text-[16px] leading-relaxed">{error || "This developer hasn't been analyzed yet. Start the sequence to generate their DNA."}</p>
            <Link href="/">
              <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-emerald-400 font-bold transition-all shadow-2xl active:scale-95">
                Return to Command
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.user.display_name || profile.user.codedna_username || profile.user.username;
  const handle = profile.user.codedna_username || profile.user.username;
  const avatar = profile.user.avatar_url || `https://avatar.vercel.sh/${handle}`;
  const totalLines = profile.languages.reduce((s, l) => s + l.total_lines, 0);
  const overallScore = Math.round(profile.radar.reduce((s, r) => s + r.value, 0) / profile.radar.length);

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500/20 pb-24 relative overflow-x-hidden">

      {/* ── Navbar ── */}

      <main className="max-w-6xl mx-auto px-6 pt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── Left Sidebar (Identity) ── */}
          <div className="lg:col-span-4 space-y-6">
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-900/20 backdrop-blur-xl border border-white/[0.05] rounded-[40px] p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] -mr-16 -mt-16" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.1] overflow-hidden mb-6 shadow-2xl">
                  <img src={avatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${handle}` }} />
                </div>
                
                <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">{displayName}</h1>
                <p className="text-[14px] text-zinc-500 font-mono mb-6">@{handle}</p>
                
                <div className="flex gap-2 w-full">
                  <Button onClick={handleCopyLink} variant="outline" className="flex-1 h-11 rounded-xl border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:text-white hover:bg-white/5 text-[12px] font-bold transition-all">
                    {copied ? <Check className="w-3.5 h-3.5 mr-2 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 mr-2" />}
                    {copied ? "Copied" : "Share"}
                  </Button>
                  <Button asChild variant="outline" className="h-11 w-11 rounded-xl border-white/[0.08] bg-white/[0.02] p-0 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all">
                    <Link href={`https://github.com/${profile.user.username}`} target="_blank">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-10 space-y-4">
                <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-500/60 mb-2">Class Assignment</h3>
                  <p className="text-[15px] font-bold text-white">{profile.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-1">Score</h3>
                    <p className="text-2xl font-bold text-white">{overallScore}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.05]">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-1">Repos</h3>
                    <p className="text-2xl font-bold text-white">{profile.repos_analyzed}</p>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-900/20 backdrop-blur-xl border border-white/[0.05] rounded-[40px] p-8"
            >
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-6">Language Composition</h3>
              <div className="space-y-4">
                {profile.languages.slice(0, 5).map((lang) => {
                  const pct = totalLines > 0 ? Math.round((lang.total_lines / totalLines) * 100) : 0;
                  return (
                    <div key={lang.language}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[13px] font-bold text-zinc-300">{lang.language}</span>
                        <span className="text-[11px] font-mono text-zinc-600">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-emerald-500/40 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          </div>

          {/* ── Right Content (DNA Data) ── */}
          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/20 backdrop-blur-xl border border-white/[0.05] rounded-[40px] p-8 flex flex-col items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-emerald-500/5 blur-[80px] -z-10" />
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-8 self-start">Sequence Radar</h3>
                <RadarChart data={profile.radar} width={340} height={300} color="#10b981" />
              </motion.section>

              {/* Archetype Summary */}
              <motion.section
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/20 backdrop-blur-xl border border-white/[0.05] rounded-[40px] p-8"
              >
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-6">Cognitive Summary</h3>
                <p className="text-[17px] text-zinc-300 leading-[1.6] font-medium mb-8">
                  {profile.summary}
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                    <h4 className="text-[10px] uppercase tracking-[0.15em] font-black text-emerald-500/60 mb-2">Dominant Trait</h4>
                    <p className="text-[14px] font-bold text-white">{profile.strengths[0]}</p>
                  </div>
                  <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                    <h4 className="text-[10px] uppercase tracking-[0.15em] font-black text-amber-500/60 mb-2">Evolution Target</h4>
                    <p className="text-[14px] font-bold text-white">{profile.growth_areas[0]}</p>
                  </div>
                </div>
              </motion.section>
            </div>

            {/* Score Breakdown Bars */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/20 backdrop-blur-xl border border-white/[0.05] rounded-[40px] p-10"
            >
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-10">8-Axis Metric Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {profile.radar.map((axis, i) => (
                  <div key={axis.axis}>
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[14px] font-bold text-zinc-300">{axis.axis}</span>
                      <span className="text-[12px] font-mono text-emerald-500">{axis.value}%</span>
                    </div>
                    <div className="h-2 bg-white/[0.03] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${axis.value}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.05, ease: "easeOut" }}
                        className="h-full bg-emerald-500/60 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xl font-bold text-white mb-1">{value}</div>
      <div className="text-[11px] text-zinc-600 font-medium">{label}</div>
    </div>
  );
}
