"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  Share2, Scale, Zap, 
  ChevronRight, LayoutGrid, Activity, Target, 
  ShieldAlert, ShieldCheck, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RadarChart, RadarData } from "@/components/RadarChart";
import { useToast } from "@/components/Toast";
import { ProfileBadgeCluster } from "@/components/ProfileBadgeCluster";
import Footer from "@/components/Footer";

interface ProfileData {
  user: { 
    username: string; 
    codedna_username?: string | null;
    display_name: string | null; 
    avatar_url: string | null; 
    last_analyzed_at: string | null;
    bio?: string | null;
    cover_url?: string | null;
    accent_theme?: string | null;
    pinned_badges?: string | null;
    role?: string;
    staff_type?: string;
  };
  type: string;
  summary: string;
  strengths: string[];
  growth_areas: string[];
  radar: RadarData[];
  languages: { language: string; total_lines: number; total_commits: number; trend: string }[];
  commit_patterns: {
    avg_message_length: number;
    commit_style: string;
    most_active_hour: number;
    most_active_day: string;
    fix_to_feature_ratio: number;
    avg_commit_size?: number;
    naming_style?: string;
    avg_fn_length?: number;
    total_commits?: number;
  } | null;
  repos_analyzed: number;
  total_files_analyzed: number;
  analyzed_at: string;
}

const BADGE_DETAILS: Record<string, { label: string; icon: string }> = {
  grandmaster: { label: "Grandmaster", icon: "🏆" },
  cleancoder: { label: "Clean Coder", icon: "🧹" },
  architect: { label: "Architect", icon: "🏗️" },
  bughunter: { label: "Bug Hunter", icon: "🐛" },
  nightowl: { label: "Night Owl", icon: "🦉" },
  speeddemon: { label: "Speed Demon", icon: "🏎️" },
  warden: { label: "Security Warden", icon: "🛡️" },
  scribe: { label: "Doc Scribe", icon: "📝" }
};

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { data: session } = useSession();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      addToast("Profile link copied to clipboard!", "success");
    }
  };

  const handleCompareClick = () => {
    router.push(`/compare?user1=${username}`);
  };

  const handleReanalyzeClick = () => {
    router.push(`/analyzing/${username}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`);
    addToast("Link copied to clipboard!", "success");
  };

  const handleDownloadPDF = () => {
    if (!profileData) return;
    const displayName = profileData.user.display_name || profileData.user.codedna_username || profileData.user.username;
    const handle = profileData.user.codedna_username || profileData.user.username;
    const avatar = profileData.user.avatar_url || `https://avatar.vercel.sh/${handle}`;
    const analyzedDate = profileData.analyzed_at 
      ? new Date(profileData.analyzed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    const totalCommits = profileData.languages.reduce((sum, l) => sum + l.total_commits, 0);
    const radarScores = profileData.radar;

    // Create iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    // Build metrics HTML
    const metricsHtml = radarScores.map(score => `
      <div class="metric-row">
        <span class="metric-label">${score.axis}</span>
        <div class="metric-bar-container">
          <div class="metric-bar-fill" style="width: ${score.value}%"></div>
        </div>
        <span class="metric-value">${score.value}%</span>
      </div>
    `).join("");

    // Build languages HTML
    const languagesHtml = profileData.languages.map(lang => `
      <tr>
        <td><strong>${lang.language}</strong></td>
        <td>${lang.total_lines.toLocaleString()} lines</td>
        <td>${lang.total_commits.toLocaleString()} commits</td>
        <td><span class="trend-badge">${lang.trend}</span></td>
      </tr>
    `).join("");

    // Build strengths HTML
    const strengthsHtml = profileData.strengths.length > 0 
      ? profileData.strengths.map(s => `<li><span class="bullet positive">✓</span> ${s}</li>`).join("")
      : "<li>No specific strengths recorded.</li>";

    // Build growth areas HTML
    const growthHtml = profileData.growth_areas.length > 0
      ? profileData.growth_areas.map(g => `<li><span class="bullet negative">⚠</span> ${g}</li>`).join("")
      : "<li>No specific growth areas recorded.</li>";

    // Build patterns HTML
    const patterns = profileData.commit_patterns;
    const patternsHtml = patterns ? `
      <div class="pattern-grid">
        <div class="pattern-card">
          <div class="pattern-label">Commit Style</div>
          <div class="pattern-val">${patterns.commit_style}</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-label">Active Hour</div>
          <div class="pattern-val">${patterns.most_active_hour}:00</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-label">Avg Msg Length</div>
          <div class="pattern-val">${patterns.avg_message_length} chars</div>
        </div>
        <div class="pattern-card">
          <div class="pattern-label">Fix Ratio</div>
          <div class="pattern-val">${Math.round(patterns.fix_to_feature_ratio * 100)}%</div>
        </div>
        ${patterns.avg_commit_size ? `
        <div class="pattern-card">
          <div class="pattern-label">Avg Commit Size</div>
          <div class="pattern-val">${patterns.avg_commit_size} lines</div>
        </div>
        ` : ''}
        ${patterns.naming_style ? `
        <div class="pattern-card">
          <div class="pattern-label">Naming Style</div>
          <div class="pattern-val">${patterns.naming_style}</div>
        </div>
        ` : ''}
      </div>
    ` : '<p class="no-data">No commit pattern analysis available.</p>';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Code DNA Profile - ${handle}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm 20mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #1f2937;
              background-color: #ffffff;
              line-height: 1.5;
              font-size: 13px;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-container {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .profile-identity {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .avatar {
              width: 70px;
              height: 70px;
              border-radius: 12px;
              object-fit: cover;
              border: 1px solid #d1d5db;
            }
            .avatar-fallback {
              width: 70px;
              height: 70px;
              border-radius: 12px;
              background-color: #3f3f46;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
            }
            .name-title h1 {
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 4px 0;
              color: #111827;
              letter-spacing: -0.5px;
            }
            .name-title p {
              font-size: 13px;
              color: #4b5563;
              margin: 0;
            }
            .archetype-badge {
              display: inline-block;
              background-color: #f3f4f6;
              border: 1px solid #e5e7eb;
              color: #1f2937;
              padding: 4px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-top: 5px;
            }
            .report-meta {
              text-align: right;
              font-size: 11px;
              color: #6b7280;
            }
            .report-meta strong {
              color: #111827;
            }
            .summary-box {
              background-color: #f9fafb;
              border-left: 4px solid #10b981;
              padding: 12px 16px;
              border-radius: 0 8px 8px 0;
              margin-bottom: 20px;
            }
            .summary-box h3 {
              margin: 0 0 5px 0;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #10b981;
              font-weight: 700;
            }
            .summary-box p {
              margin: 0;
              font-style: italic;
              color: #374151;
            }
            .section-grid {
              display: grid;
              grid-template-columns: 1.10fr 0.90fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .card {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              background-color: #ffffff;
            }
            .card-title {
              font-size: 13px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #111827;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 8px;
              margin: 0 0 12px 0;
            }
            .metric-row {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              font-size: 12px;
            }
            .metric-label {
              width: 120px;
              font-weight: 500;
              color: #374151;
            }
            .metric-bar-container {
              flex-grow: 1;
              height: 8px;
              background-color: #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
              margin: 0 10px;
            }
            .metric-bar-fill {
              height: 100%;
              background-color: #10b981;
              border-radius: 4px;
            }
            .metric-value {
              width: 35px;
              text-align: right;
              font-weight: 700;
              color: #111827;
            }
            .bullet-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .bullet-list li {
              margin-bottom: 8px;
              line-height: 1.4;
              color: #374151;
            }
            .bullet {
              font-weight: bold;
              display: inline-block;
              width: 16px;
            }
            .bullet.positive {
              color: #10b981;
            }
            .bullet.negative {
              color: #f59e0b;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              padding: 6px 8px;
              border-bottom: 1px solid #e5e7eb;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #f3f4f6;
              color: #374151;
            }
            .trend-badge {
              display: inline-block;
              background-color: #f3f4f6;
              border: 1px solid #e5e7eb;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              text-transform: uppercase;
            }
            .pattern-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            .pattern-card {
              background-color: #f9fafb;
              border: 1px solid #f3f4f6;
              border-radius: 6px;
              padding: 8px 12px;
            }
            .pattern-label {
              font-size: 9px;
              text-transform: uppercase;
              color: #6b7280;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .pattern-val {
              font-size: 12px;
              font-weight: 700;
              color: #111827;
            }
            .report-footer {
              margin-top: 30px;
              border-top: 1px dashed #e5e7eb;
              padding-top: 10px;
              text-align: center;
              font-size: 10px;
              color: #9ca3af;
            }
            .no-data {
              color: #9ca3af;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="profile-identity">
              ${avatar ? `<img class="avatar" src="${avatar}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />` : ''}
              <div class="avatar-fallback" style="display: ${avatar ? 'none' : 'flex'}">
                ${handle.slice(0, 2).toUpperCase()}
              </div>
              <div class="name-title">
                <h1>${displayName}</h1>
                <p>@${handle} • GitHub Profile Report</p>
                <div class="archetype-badge">${profileData.type}</div>
              </div>
            </div>
            <div class="report-meta">
              <div>Generated: <strong>${analyzedDate}</strong></div>
              <div>Repos Analyzed: <strong>${profileData.repos_analyzed}</strong></div>
              <div>Files Cleaned: <strong>${profileData.total_files_analyzed}</strong></div>
              <div>Total Commits: <strong>${totalCommits.toLocaleString()}</strong></div>
            </div>
          </div>

          <div class="summary-box">
            <h3>DNA Personality Profile</h3>
            <p>"${profileData.summary}"</p>
          </div>

          <div class="section-grid">
            <div class="card">
              <h4 class="card-title">Core Coding Style Axis (Scores)</h4>
              ${metricsHtml}
            </div>
            
            <div class="card">
              <h4 class="card-title">Commit & Naming Patterns</h4>
              ${patternsHtml}
            </div>
          </div>

          <div class="section-grid">
            <div class="card">
              <h4 class="card-title">Language DNA Breakdown</h4>
              <table>
                <thead>
                  <tr>
                    <th>Language</th>
                    <th>Volume (LOC)</th>
                    <th>Activity</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  ${languagesHtml}
                </tbody>
              </table>
            </div>

            <div class="card">
              <h4 class="card-title">Strengths & Growth Vectors</h4>
              <div style="margin-bottom: 12px;">
                <strong style="font-size: 11px; text-transform: uppercase; color: #10b981; display: block; margin-bottom: 6px;">Key Strengths</strong>
                <ul class="bullet-list">
                  ${strengthsHtml}
                </ul>
              </div>
              <div>
                <strong style="font-size: 11px; text-transform: uppercase; color: #f59e0b; display: block; margin-bottom: 6px;">Areas of Growth</strong>
                <ul class="bullet-list">
                  ${growthHtml}
                </ul>
              </div>
            </div>
          </div>

          <div class="report-footer">
            Developer Fingerprint Diagnostics Report generated by Code DNA. Verified authentic source metrics.
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 60000);
    }, 500);
  };

  useEffect(() => {
    async function fetchProfile() {
      if (username === "sample_dev") {
        setProfileData({
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
          commit_patterns: {
            avg_message_length: 42,
            commit_style: "Descriptive",
            most_active_hour: 14,
            most_active_day: "Monday",
            fix_to_feature_ratio: 0.28,
            avg_commit_size: 32,
            naming_style: "camelCase",
            avg_fn_length: 22
          },
          repos_analyzed: 14,
          total_files_analyzed: 1240,
          analyzed_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setProfileData(data);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Profile not found');
        }
      } catch (err) {
        setError('Could not connect to the backend.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  const isOwner = session?.user?.name === username;
  const avatar = profileData?.user?.avatar_url || `https://github.com/${profileData?.user?.username}.png`;
  const displayName = profileData?.user?.display_name || username;

  const badgesList = profileData?.user?.pinned_badges ? profileData.user.pinned_badges.split(',').filter(Boolean) : [];

  const themeId = profileData?.user?.accent_theme || "emerald";
  const accent = (({
    emerald: {
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
      gradient: "from-emerald-500/20 to-emerald-500/5",
      pulse: "bg-emerald-500",
      bar: "bg-emerald-500"
    },
    sky: {
      text: "text-sky-400",
      border: "border-sky-500/30",
      bg: "bg-sky-500",
      glow: "shadow-[0_0_30px_rgba(14,165,233,0.15)]",
      gradient: "from-sky-500/20 to-sky-500/5",
      pulse: "bg-sky-500",
      bar: "bg-sky-500"
    },
    cyberpunk: {
      text: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500",
      glow: "shadow-[0_0_30px_rgba(168,85,247,0.2)]",
      gradient: "from-purple-500/20 to-pink-500/10",
      pulse: "bg-purple-500",
      bar: "bg-gradient-to-r from-purple-500 to-pink-500"
    },
    nebula: {
      text: "text-indigo-400",
      border: "border-indigo-500/30",
      bg: "bg-indigo-500",
      glow: "shadow-[0_0_30px_rgba(99,102,241,0.2)]",
      gradient: "from-indigo-500/20 to-purple-500/10",
      pulse: "bg-indigo-500",
      bar: "bg-gradient-to-r from-indigo-500 to-purple-500"
    },
    sunset: {
      text: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
      gradient: "from-amber-500/20 to-red-500/10",
      pulse: "bg-amber-500",
      bar: "bg-gradient-to-r from-amber-500 to-red-500"
    }
  } as Record<string, any>)[themeId]) || {
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.15)]",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    pulse: "bg-emerald-500",
    bar: "bg-emerald-500"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-white/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-600 text-[13px] font-medium uppercase tracking-widest">Sequencing DNA...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-white/20 relative">
        <div className="min-h-screen flex items-center justify-center text-center px-6">
          <div className="max-w-md">
            <h1 className="text-2xl font-semibold text-white mb-4 tracking-tight">Profile Not Found</h1>
            <p className="text-zinc-500 mb-8 text-[15px]">{error || 'This profile has not been analyzed yet.'}</p>
            <Link href="/">
              <Button className="bg-white text-black hover:bg-zinc-700 font-bold rounded-xl h-11 px-8 text-sm">
                Analyze a Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalLines = profileData.languages.reduce((sum, l) => sum + l.total_lines, 0);
  const totalCommits = profileData.commit_patterns?.total_commits ?? profileData.languages.reduce((sum, l) => sum + l.total_commits, 0);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-300 font-sans selection:bg-white/20 pb-20">
      
      <main className="max-w-[1200px] mx-auto px-6 pt-32 space-y-6">
        
        {/* ─── Header Card ─── */}
        <section className="bg-[#18181b] border border-white/[0.04] rounded-[24px] p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0 shadow-2xl relative z-10">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-zinc-600">RD</span>
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                  {badgesList.length > 0 && (
                    <div className="flex gap-1.5">
                      {badgesList.map(bId => {
                        const badgeInfo = BADGE_DETAILS[bId];
                        if (!badgeInfo) return null;
                        return (
                          <span key={bId} className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/[0.04] border ${accent.border} ${accent.text} ${accent.glow}`}>
                            <span>{badgeInfo.icon}</span>
                            <span>{badgeInfo.label}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[14px] text-zinc-500 mb-3 font-medium">
                  <span>@{username}</span>
                  <span>•</span>
                  <span>{profileData.repos_analyzed} repos analyzed</span>
                  <span>•</span>
                  <span>{totalCommits.toLocaleString()} commits parsed</span>
                </div>
                {profileData.user.bio && (
                  <p className="text-[13px] text-zinc-400 mb-3 max-w-xl italic leading-relaxed">
                    &ldquo;{profileData.user.bio}&rdquo;
                  </p>
                )}
                <div className="w-full max-w-[400px]">
                  <ProfileBadgeCluster 
                    profile={profileData} 
                    isAnalyzed={!!profileData.analyzed_at} 
                    overallScore={profileData.radar?.length > 0 ? Math.round(profileData.radar.reduce((acc, r) => acc + r.value, 0) / profileData.radar.length) : 0} 
                  />
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <HeaderAction icon={<Share2 />} label="Share DNA card" onClick={handleShare} />
              <HeaderAction icon={<Scale />} label="Compare" onClick={handleCompareClick} />
              <HeaderAction icon={<Zap />} label="Re-analyze" onClick={handleReanalyzeClick} />
            </div>
          </div>

          <div className="text-[11px] text-zinc-600 font-medium text-right mt-6">
            Last analyzed {profileData.analyzed_at ? 'recently' : 'never'}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10 pt-10 border-t border-white/[0.02]">
            <HeaderStat label="Repos analyzed" value={String(profileData.repos_analyzed)} />
            <HeaderStat label="Files analyzed" value={String(profileData.total_files_analyzed || 0)} />
            <HeaderStat label="Commits parsed" value={totalCommits.toLocaleString()} />
            <HeaderStat label="Languages detected" value={String(profileData.languages.length)} />
            <HeaderStat label="Global readability" value={`Top ${100 - (profileData.radar.find(r => r.axis === 'Readability')?.value || 50)}%`} />
          </div>
        </section>

        {/* ─── Main Content Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* DNA Axes (Top Left) */}
          <section className="bg-[#18181b] border border-white/[0.04] rounded-[24px] p-8">
            <h3 className="text-[14px] font-bold text-white mb-8 flex items-center gap-2">
              <div className="w-1 h-3 bg-zinc-800 rounded-full" />
              DNA axes
            </h3>
            <div className="space-y-6">
              {profileData.radar.map((axis) => (
                <div key={axis.axis} className="flex items-center gap-6">
                  <span className="text-[13px] text-zinc-500 w-32 shrink-0">{axis.axis}</span>
                  <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${axis.value}%` }} 
                      className={`h-full rounded-full ${accent.bar}`}
                    />
                  </div>
                  <span className="text-[13px] font-bold text-white w-6">{axis.value}</span>
                  <div className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter w-16 text-center">
                    {axis.value > 80 ? 'Top' : `Top ${100 - axis.value}%`}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Language DNA & Blind Spots (Top Right) */}
          <div className="space-y-6">
            <section className="bg-[#18181b] border border-white/[0.04] rounded-[24px] p-8">
              <h3 className="text-[14px] font-bold text-white mb-8 flex items-center gap-2">
                <div className="w-1 h-3 bg-zinc-800 rounded-full" />
                Language DNA
              </h3>
              <div className="space-y-6">
                {profileData.languages.slice(0, 5).map((lang) => {
                  const pct = Math.round((lang.total_lines / totalLines) * 100);
                  return (
                    <div key={lang.language} className="flex items-center gap-6">
                      <span className="text-[13px] text-zinc-500 w-24 shrink-0">{lang.language}</span>
                      <div className="flex-1 h-2 bg-white/[0.03] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${pct}%` }} 
                          className={`h-full rounded-full ${accent.bar}`}
                        />
                      </div>
                      <span className="text-[13px] font-bold text-zinc-500">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-12">
                <h4 className="text-[12px] font-bold text-zinc-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5" />
                  Blind spot detector
                </h4>
                <div className="space-y-3">
                  <BlindSpotCard 
                    type="success"
                    title={`${profileData.languages[0]?.language || 'Main Language'} — proven, deeply`}
                    desc={`${profileData.languages[0]?.total_lines?.toLocaleString() || 0} lines across ${profileData.repos_analyzed} production repos`}
                  />
                  {profileData.growth_areas.slice(0, 1).map((g, i) => (
                    <BlindSpotCard 
                      key={i}
                      type="error"
                      title="Area for optimization"
                      desc={g}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Commit Patterns (Bottom Left) */}
          <section className="bg-[#18181b] border border-white/[0.04] rounded-[24px] p-8">
            <h3 className="text-[14px] font-bold text-white mb-8 flex items-center gap-2">
              <div className="w-1 h-3 bg-zinc-800 rounded-full" />
              Commit patterns
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <PatternTile label="Commit style" value={profileData.commit_patterns?.commit_style || 'Imperative'} />
              <PatternTile 
                label="Most active hour" 
                value={profileData.commit_patterns?.most_active_hour !== undefined ? `${profileData.commit_patterns.most_active_hour % 12 || 12}${profileData.commit_patterns.most_active_hour >= 12 ? 'pm' : 'am'}` : '12pm'} 
              />
              <PatternTile label="Avg msg length" value={`${Math.round(profileData.commit_patterns?.avg_message_length || 0)} chars`} />
              <PatternTile label="Fix-to-feature ratio" value={`1 : ${Math.round(1/ (profileData.commit_patterns?.fix_to_feature_ratio || 0.1))}`} />
              <PatternTile label="Naming style" value={profileData.commit_patterns?.naming_style || 'camelCase'} />
              <PatternTile label="Avg fn length" value={`${profileData.commit_patterns?.avg_fn_length || 20} lines`} />
            </div>
          </section>

          {/* Strengths & Growth Areas (Bottom Right) */}
          <section className="bg-[#18181b] border border-white/[0.04] rounded-[24px] p-8">
            <h3 className="text-[14px] font-bold text-white mb-8 flex items-center gap-2">
              <div className="w-1 h-3 bg-zinc-800 rounded-full" />
              Strengths & growth areas
            </h3>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Strengths</h4>
                <div className="space-y-3">
                  {profileData.strengths.slice(0, 3).map((s, i) => (
                    <InsightCard 
                      key={i}
                      type="strength"
                      title={s}
                      desc="Strong patterns detected across your codebase"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest mb-4">Growth Areas</h4>
                <div className="space-y-3">
                  {profileData.growth_areas.slice(0, 2).map((g, i) => (
                    <InsightCard 
                      key={i}
                      type="growth"
                      title={g}
                      desc="A potential focus area for technical evolution"
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ─── Shareable DNA Card ─── */}
        <section className="bg-[#18181b] border border-white/[0.04] rounded-[24px] p-8">
          <h3 className="text-[14px] font-bold text-white mb-8 flex items-center gap-2">
            <div className="w-1 h-3 bg-zinc-800 rounded-full" />
            Shareable DNA card
          </h3>
          <div className="bg-[#111116] border border-white/[0.04] rounded-[32px] p-10 flex flex-col md:flex-row items-center gap-12 group overflow-hidden relative">
            <div className="absolute inset-0 bg-zinc-800/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-zinc-800 to-purple-600 border border-white/20 flex items-center justify-center shrink-0 z-10 shadow-2xl shadow-indigo-500/20">
               {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover rounded-[24px]" />
                ) : (
                  <span className="text-2xl font-bold text-white">{username.slice(0, 2).toUpperCase()}</span>
                )}
            </div>
            <div className="flex-1 z-10 text-center md:text-left">
              <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-[14px] text-zinc-500 mb-6">
                <span>@{username}</span>
                <span>•</span>
                <span>codedna.dev</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 border border-white/20 rounded-lg mb-8">
                <div className="w-3 h-3 rounded bg-white/40" />
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{profileData.type}</span>
              </div>
              <div className="flex gap-4">
                <Button 
                  onClick={handleDownloadPDF}
                  className="h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white hover:bg-white/5 font-semibold text-xs px-6 transition-all"
                >
                  <Download className="w-3.5 h-3.5 mr-2" /> Download PDF
                </Button>
                <Button 
                  onClick={handleCopyLink}
                  variant="outline" 
                  className="h-10 rounded-xl border-white/[0.06] text-zinc-400 hover:text-white font-semibold text-xs px-6"
                >
                  Copy link
                </Button>
              </div>
            </div>
            <div className="flex gap-10 z-10">
              <ShareStat label="Readability" value={String(profileData.radar.find(r => r.axis === 'Readability')?.value || 0)} />
              <ShareStat label="Discipline" value={String(profileData.radar.find(r => r.axis === 'Commit Discipline')?.value || 0)} />
              <ShareStat label="Lang depth" value={String(profileData.radar.find(r => r.axis === 'Language Depth')?.value || 0)} />
              <div className="text-center">
                <div className="text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Top</div>
                <div className="text-2xl font-black text-white">{100 - (profileData.radar.find(r => r.axis === 'Readability')?.value || 50)}%</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function HeaderAction({ icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="h-20 w-24 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group"
    >
      <div className="text-zinc-600 group-hover:text-zinc-300 transition-colors scale-75">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight text-center px-2">{label}</span>
    </button>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-[12px] text-zinc-600 font-medium">{label}</div>
    </div>
  );
}

function PatternTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5">
      <div className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest mb-2">{label}</div>
      <div className="text-[15px] font-semibold text-zinc-300">{value}</div>
    </div>
  );
}

function InsightCard({ type, title, desc }: { type: 'strength' | 'growth'; title: string; desc: string }) {
  return (
    <div className={`p-4 rounded-xl border ${type === 'strength' ? 'bg-zinc-800/[0.02] border-white/10' : 'bg-zinc-800/[0.02] border-white/10'}`}>
      <h5 className={`text-[13px] font-bold mb-1 ${type === 'strength' ? 'text-zinc-300' : 'text-zinc-300'}`}>{title}</h5>
      <p className="text-[12px] text-zinc-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function BlindSpotCard({ type, title, desc }: { type: 'error' | 'success'; title: string; desc: string }) {
  return (
    <div className={`p-4 rounded-xl border flex items-start gap-4 ${type === 'error' ? 'bg-white/5 border-white/10' : 'bg-white/5 border-white/10'}`}>
      <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${type === 'error' ? 'bg-zinc-800' : 'bg-zinc-800'}`} />
      <div>
        <h5 className={`text-[13px] font-bold mb-1 ${type === 'error' ? 'text-zinc-300' : 'text-zinc-300'}`}>{title}</h5>
        <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}

function ShareStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{label}</div>
    </div>
  );
}
