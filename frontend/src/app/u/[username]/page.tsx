"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Share2, ExternalLink, Check, Dna, Fingerprint, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { DynamicBackground } from "@/components/DynamicBackground";
import { AdminControls } from "@/components/AdminControls";
import { RoleBadge } from "@/components/RoleBadge";

interface RadarData {
  axis: string;
  value: number;
}

interface ProfileData {
  user: { id: string; username: string; codedna_username: string | null; display_name: string | null; avatar_url: string | null; last_analyzed_at: string | null; role?: string; staff_type?: string };
  type: string;
  summary: string;
  strengths: string[];
  growth_areas: string[];
  radar: RadarData[];
  languages: { language: string; total_lines: number; total_commits: number; trend: string }[];
  commit_patterns: Record<string, unknown>;
  repos_analyzed: number;
  total_files_analyzed: number;
  total_commits: number;
  avg_commits_per_week: number;
  top_patterns: string[];
  coding_since: string;
  analyzed_at: string;
}


export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const { data: session } = useSession();

  const isOwnProfile = 
    session?.codedna_username === username || 
    session?.githubLogin === username || 
    session?.user?.name === username;

  useEffect(() => {
    async function fetchProfile() {
      // Mock data for sample profile
      if (username === "sample_dev") {
        setProfile({
          user: {
            id: "sample_id",
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
            { axis: "Structural Depth", value: 92 },
            { axis: "Modularity", value: 88 },
            { axis: "Idiomatic Expression", value: 75 },
            { axis: "Error Resilience", value: 82 },
            { axis: "Namespace Hygiene", value: 95 },
            { axis: "Concurrency Pattern", value: 68 },
            { axis: "Complexity Gradient", value: 85 },
            { axis: "Dependency Gravity", value: 90 },
          ],
          languages: [
            { language: "Rust", total_lines: 45200, total_commits: 124, trend: "+12%" },
            { language: "TypeScript", total_lines: 32000, total_commits: 88, trend: "+5%" },
            { language: "Python", total_lines: 15000, total_commits: 45, trend: "-2%" }
          ],
          commit_patterns: {},
          repos_analyzed: 14,
          total_files_analyzed: 1240,
          total_commits: 257,
          avg_commits_per_week: 18,
          top_patterns: ["Builder Pattern", "Observer Pattern", "Strategy Pattern", "Dependency Injection"],
          coding_since: "2019",
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

  function handleCopyBadge() {
    const badgeUrl = `${window.location.origin}/api/badge/${username}`;
    const profileUrl = window.location.href;
    const markdown = `[![Code DNA Profile](${badgeUrl})](${profileUrl})`;
    navigator.clipboard.writeText(markdown);
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <DynamicBackground />
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em]">Decoding AST Fingerprint...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    const isNoAnalysis = error?.includes("No analysis found") || error?.includes("not yet initialized");
    
    if (!isNoAnalysis && error !== "Profile not found") {
      return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/10 relative overflow-hidden">
          <DynamicBackground />
          <div className="min-h-screen flex items-center justify-center text-center px-6 relative z-10">
            <div className="max-w-md">
              <div className="w-20 h-20 mx-auto mb-8 rounded-[32px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.1)]">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h1 className="text-4xl font-bold text-zinc-100 mb-4 tracking-tight">Sequence Terminated</h1>
              <p className="text-zinc-500 mb-10 text-[16px] leading-relaxed">{error || "Internal system fault detected during DNA traversal."}</p>
              <Link href="/">
                <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-xl active:scale-95">
                  Return to Command
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Profile not found or no analysis — show a friendly fallback
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/10 relative overflow-hidden">
        <DynamicBackground />
        <div className="min-h-screen flex items-center justify-center text-center px-6 relative z-10">
          <div className="max-w-md">
            <div className="w-20 h-20 mx-auto mb-8 rounded-[32px] bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
              <Fingerprint className="w-8 h-8 text-zinc-600" />
            </div>
            <h1 className="text-4xl font-bold text-zinc-100 mb-4 tracking-tight">Identity Not Found</h1>
            <p className="text-zinc-500 mb-10 text-[16px] leading-relaxed">
              This developer&apos;s technical DNA sequence has not been initialized or the profile does not exist.
            </p>
            <Link href="/discover">
              <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-xl active:scale-95">
                <Dna className="w-4 h-4 mr-2" />
                Explore Developers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAnalyzed = !!profile?.analyzed_at;

  const displayName = profile.user.display_name || profile.user.codedna_username || profile.user.username;
  const handle = profile.user.codedna_username || profile.user.username;
  const avatar = profile.user.avatar_url || `https://avatar.vercel.sh/${handle}`;
  const totalLines = profile.languages.reduce((s, l) => s + l.total_lines, 0);
  const overallScore = Math.round(profile.radar.reduce((s, r) => s + r.value, 0) / profile.radar.length);

  // badgeRank calculated but currently unused in UI
  /*
  const badgeRank = overallScore >= 95 ? "Code Grandmaster" 
    : overallScore >= 80 ? "Elite Hacker" 
    : overallScore >= 60 ? "System Architect" 
    : overallScore >= 40 ? "Script Hacker" 
    : "Code Newbie";
  */

  return (
    <div className="min-h-screen text-zinc-100 font-sans selection:bg-white/10 pb-24 relative overflow-x-hidden">

      {/* ── Navbar ── */}

      <AdminControls 
        targetUser={profile.user} 
        onUpdate={() => window.location.reload()} 
      />

      <main className="w-full px-12 pt-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── Left Sidebar (Identity) ── */}
          <div className="lg:col-span-4 space-y-6">
            <motion.section
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[40px] p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[60px] -mr-16 -mt-16" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.1] overflow-hidden mb-6 shadow-2xl">
                  <img src={avatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${handle}` }} />
                </div>
                
                <h1 className="text-3xl font-bold text-zinc-100 mb-1 tracking-tight">{displayName}</h1>
                <p className="text-[14px] text-zinc-600 font-mono mb-4">@{handle}</p>

                <div className="mb-6">
                  <RoleBadge 
                    role={profile.user.role || 'USER'} 
                    type={profile.user.staff_type} 
                  />
                </div>
                
                <div className="flex gap-2 w-full">
                  <Button onClick={handleCopyLink} variant="outline" className="flex-1 h-12 rounded-2xl border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:text-zinc-100 hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-all">
                    {copied ? <Check className="w-3.5 h-3.5 mr-2 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 mr-2" />}
                    {copied ? "Copied" : "Share"}
                  </Button>
                  <Button asChild variant="outline" className="h-12 w-12 rounded-2xl border-white/[0.08] bg-white/[0.03] p-0 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                    <Link href={`https://github.com/${profile.user.username}`} target="_blank">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                {isOwnProfile && (
                  <Button 
                    onClick={handleCopyBadge} 
                    variant="outline" 
                    className="w-full mt-2 h-12 rounded-2xl border-white/[0.08] bg-zinc-100 text-black hover:bg-white text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/5"
                  >
                    {copiedBadge ? <Check className="w-3.5 h-3.5 mr-2 text-emerald-600" /> : <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>}
                    {copiedBadge ? "Badge Copied!" : "Embed DNA Badge"}
                  </Button>
                )}
              </div>

              <div className="mt-10 space-y-4">
                <div className="p-6 rounded-[28px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-2">Class Assignment</h3>
                  <p className="text-[16px] font-bold text-zinc-100 tracking-tight">{profile.type}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-[28px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-700 mb-1">Score</h3>
                    <p className="text-3xl font-black text-zinc-100 tracking-tighter">{isAnalyzed ? overallScore : "---"}</p>
                  </div>
                  <div className="p-6 rounded-[28px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-700 mb-1">Repos</h3>
                    <p className="text-3xl font-black text-zinc-100 tracking-tighter">{isAnalyzed ? profile.repos_analyzed : "0"}</p>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.1] rounded-[40px] p-8"
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
                          className="h-full bg-zinc-400 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            {/* Developer Context Section */}
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[40px] p-8 shadow-2xl"
            >
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-6">Developer Context</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-500 mb-1">Velocity</p>
                    <p className="text-[16px] font-bold text-zinc-100">{profile.avg_commits_per_week} <span className="text-[12px] text-zinc-500 font-normal">commits/wk</span></p>
                  </div>
                  <div className="p-4 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                    <p className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-500 mb-1">Total Impact</p>
                    <p className="text-[16px] font-bold text-zinc-100">{profile.total_commits} <span className="text-[12px] text-zinc-500 font-normal">commits</span></p>
                  </div>
                </div>
                <div className="p-5 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-500 mb-3">Top Patterns</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.top_patterns?.map(pattern => (
                      <span key={pattern} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-bold tracking-wide">
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex justify-between items-center">
                  <span className="text-[12px] font-bold text-zinc-400">Coding Since</span>
                  <span className="text-[14px] font-mono text-zinc-100">{profile.coding_since || "Unknown"}</span>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ── Right Content (DNA Data) ── */}
          <div className="lg:col-span-8 space-y-8">
            {/* DNA Metric Bars — Hero Visualization */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[40px] p-10 relative shadow-2xl"
            >
              <div className="absolute inset-0 bg-white/5 blur-[80px] -z-10 rounded-[40px]" />
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600">Sequence Analysis</h3>
                {!isAnalyzed && <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest">Incomplete</div>}
              </div>
              
              {!isAnalyzed ? (
                <div className="py-20 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-[32px] bg-zinc-900 border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
                    <Fingerprint className="w-8 h-8 text-zinc-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-100 mb-4 tracking-tight">Identity Not Decoded</h2>
                  <p className="text-zinc-500 max-w-sm mb-10 text-[15px] leading-relaxed">
                    This developer&apos;s technical DNA sequence has not been initialized. No fingerprints are available for traversal.
                  </p>
                  {isOwnProfile && (
                    <Link href="/discover">
                      <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-2xl active:scale-95">
                        <Dna className="w-4 h-4 mr-2" />
                        Initialize DNA Sequence
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.radar.map((axis, i) => {
                  const barColor = axis.value >= 80 
                    ? 'bg-white' 
                    : axis.value >= 60 
                      ? 'bg-zinc-400' 
                      : 'bg-zinc-700';
                  const textColor = axis.value >= 80 
                    ? 'text-zinc-100' 
                    : axis.value >= 60 
                      ? 'text-zinc-400' 
                      : 'text-zinc-600';

                  return (
                    <motion.div
                      key={axis.axis}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="group"
                    >
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[15px] font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">{axis.axis}</span>
                        <span className={`text-[18px] font-black font-mono ${textColor}`}>{axis.value}%</span>
                      </div>
                      <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${axis.value}%` }}
                          transition={{ duration: 1.2, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}
            </motion.section>

            {/* Cognitive Summary — Full Width */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-6">Cognitive Summary</h3>
              <p className="text-[18px] text-zinc-200 leading-[1.8] font-medium mb-8">
                {profile.summary}
              </p>
              <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-4" stagger={0.15} y={30}>
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-500 mb-2">Dominant Trait</h4>
                  <p className="text-[16px] font-bold text-zinc-100">{profile.strengths[0]}</p>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                  <h4 className="text-[10px] uppercase tracking-[0.15em] font-black text-zinc-500 mb-2">Evolution Target</h4>
                  <p className="text-[16px] font-bold text-zinc-100">{profile.growth_areas[0]}</p>
                </div>
              </ScrollReveal>
            </motion.section>

            {/* Language DNA Breakdown */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-[11px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-6">Language DNA Breakdown</h3>
              
              {/* Stacked Bar */}
              <div className="w-full h-4 flex rounded-full overflow-hidden mb-8 bg-zinc-900 border border-white/5">
                {profile.languages.map((lang, idx) => {
                  const percentage = (lang.total_lines / totalLines) * 100;
                  const colors = ['bg-white', 'bg-zinc-400', 'bg-zinc-600', 'bg-zinc-800'];
                  const color = colors[idx % colors.length];
                  
                  return (
                    <motion.div
                      key={lang.language}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                      className={`h-full ${color} border-r border-black last:border-r-0 hover:opacity-80 transition-opacity cursor-pointer`}
                      title={`${lang.language}: ${percentage.toFixed(1)}%`}
                    />
                  );
                })}
              </div>

              {/* Language Cards */}
              <ScrollReveal className="grid grid-cols-2 md:grid-cols-3 gap-4" stagger={0.1} y={30}>
                {profile.languages.map((lang, idx) => {
                  const percentage = ((lang.total_lines / totalLines) * 100).toFixed(1);
                  const colors = ['bg-white', 'bg-zinc-400', 'bg-zinc-600', 'bg-zinc-800'];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <div key={lang.language} className="p-5 rounded-3xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-md flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                        <span className="text-[14px] font-bold text-zinc-100">{lang.language}</span>
                        <span className="text-[11px] font-mono text-zinc-500 ml-auto">{percentage}%</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Lines</p>
                          <p className="text-[16px] font-mono font-bold text-zinc-100">{(lang.total_lines / 1000).toFixed(1)}k</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Trend</p>
                          <p className="text-[12px] font-mono font-bold text-zinc-100">{lang.trend}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </ScrollReveal>
            </motion.section>
          </div>


        </div>
      </main>
    </div>
  );
}
