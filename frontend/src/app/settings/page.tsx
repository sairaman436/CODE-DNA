"use client";

import { useState, useEffect } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { Trash2, AlertTriangle, RefreshCw, Loader2, Camera, Upload, Check, Palette, Award, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

const THEMES = [
  { id: "emerald", label: "Emerald Green", color: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400 bg-emerald-500", glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]", name: "Emerald" },
  { id: "sky", label: "Sky Blue", color: "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-400 bg-sky-500", glow: "shadow-[0_0_20px_rgba(14,165,233,0.15)]", name: "Sky" },
  { id: "cyberpunk", label: "Cyberpunk Glow", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 bg-gradient-to-r from-purple-500 to-pink-500", glow: "shadow-[0_0_20px_rgba(168,85,247,0.2)]", name: "Cyberpunk" },
  { id: "nebula", label: "Nebula Cosmos", color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30 text-indigo-400 bg-gradient-to-r from-indigo-500 to-purple-600", glow: "shadow-[0_0_20px_rgba(99,102,241,0.2)]", name: "Nebula" },
  { id: "sunset", label: "Sunset Glow", color: "from-amber-500/20 to-red-500/20 border-amber-500/30 text-amber-400 bg-gradient-to-r from-amber-500 to-red-500", glow: "shadow-[0_0_20px_rgba(245,158,11,0.2)]", name: "Sunset" }
];

const AVAILABLE_BADGES = [
  { id: "grandmaster", label: "Code Grandmaster", icon: "🏆", desc: "Exceptional overall diagnostic score." },
  { id: "cleancoder", label: "Clean Coder", icon: "🧹", desc: "Prioritizes readability & style rules." },
  { id: "architect", label: "System Architect", icon: "🏗️", desc: "Command of complex layouts & architecture." },
  { id: "bughunter", label: "Bug Hunter", icon: "🐛", desc: "Excellent diagnostic & error prevention." },
  { id: "nightowl", label: "Night Owl", icon: "🦉", desc: "Commits pushed mostly during late-night." },
  { id: "speeddemon", label: "Speed Demon", icon: "🏎️", desc: "High velocity & consistent rapid commits." },
  { id: "warden", label: "Security Warden", icon: "🛡️", desc: "Secure patterns & robust dependencies." },
  { id: "scribe", label: "Doc Scribe", icon: "📝", desc: "Outstanding explanation and inline comments." }
];

const BADGE_RULES: Record<string, { check: (radar: any[], overall: number) => boolean; requirement: string }> = {
  grandmaster: {
    check: (radar, overall) => overall >= 80,
    requirement: "Requires 80+ Overall Score"
  },
  cleancoder: {
    check: (radar) => (radar.find(r => r.axis === "Readability")?.value || 0) >= 75,
    requirement: "Requires 75+ Readability"
  },
  architect: {
    check: (radar) => (radar.find(r => r.axis === "Complexity")?.value || 0) >= 75,
    requirement: "Requires 75+ Complexity"
  },
  bughunter: {
    check: (radar) => (radar.find(r => r.axis === "Error Handling")?.value || 0) >= 75,
    requirement: "Requires 75+ Error Handling"
  },
  nightowl: {
    check: (radar) => (radar.find(r => r.axis === "Commit Discipline")?.value || 0) >= 75,
    requirement: "Requires 75+ Commit Discipline"
  },
  speeddemon: {
    check: (radar) => (radar.find(r => r.axis === "Refactor Tendency")?.value || 0) >= 75,
    requirement: "Requires 75+ Refactor Tendency"
  },
  warden: {
    check: (radar) => (radar.find(r => r.axis === "Language Depth")?.value || 0) >= 75,
    requirement: "Requires 75+ Language Depth"
  },
  scribe: {
    check: (radar) => (radar.find(r => r.axis === "Documentation")?.value || 0) >= 75,
    requirement: "Requires 75+ Documentation"
  }
};

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile customization states
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [accentTheme, setAccentTheme] = useState("emerald");
  const [pinnedBadges, setPinnedBadges] = useState<string[]>([]);
  const [radar, setRadar] = useState<any[] | null>(null);

  // Loading/feedback states
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [isCompressing, setIsCompressing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setProfileError("");
    setProfileSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const max_size = 150;
          const width = img.width;
          const height = img.height;

          // Crop to a square preserving aspect ratio
          const minDim = Math.min(width, height);
          canvas.width = max_size;
          canvas.height = max_size;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setProfileError("Failed to compress image");
            setIsCompressing(false);
            return;
          }

          // Draw center-cropped square image
          ctx.drawImage(
            img,
            (width - minDim) / 2,
            (height - minDim) / 2,
            minDim,
            minDim,
            0,
            0,
            max_size,
            max_size
          );

          // Compress to JPEG, quality 0.7 (70%)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setAvatarUrl(compressedBase64);
        } catch (err) {
          setProfileError("Failed to process image");
        } finally {
          setIsCompressing(false);
        }
      };
      img.onerror = () => {
        setProfileError("Invalid image file");
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setProfileError("Failed to read file");
      setIsCompressing(false);
    };
    reader.readAsDataURL(file);
  };



  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const githubId = (session as any)?.githubId;
  const username = (session as any)?.githubLogin || session?.user?.name;

  // Load current customizations from DB
  useEffect(() => {
    if (!username) return;
    async function loadProfile() {
      try {
        const res = await fetch(`${apiUrl}/api/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setAvatarUrl(data.user?.avatar_url || "");
          setBio(data.user?.bio || "");
          setAccentTheme(data.user?.accent_theme || "emerald");
          setPinnedBadges(data.user?.pinned_badges ? data.user.pinned_badges.split(',').filter(Boolean) : []);
          setRadar(data.radar || []);
        }
      } catch (err) {
        // Silent error
      }
    }
    loadProfile();
  }, [username, apiUrl]);

  async function handleProfileUpdate(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      const res = await fetch(`${apiUrl}/api/settings/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': (session?.user as any)?.id || ''
        },
        body: JSON.stringify({ 
          github_id: githubId,
          bio,
          cover_url: "",
          accent_theme: accentTheme,
          pinned_badges: pinnedBadges.join(','),
          avatar_url: avatarUrl
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        setProfileError(errData.error || 'Failed to update settings');
        return;
      }

      // Trigger hot update to NextAuth session token for avatar
      if (avatarUrl) {
        await updateSession({ image: avatarUrl });
      }
      
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError('Failed to save profile changes');
    } finally {
      setProfileLoading(false);
    }
  }

  const checkUnlocked = (badgeId: string) => {
    if (!radar || radar.length === 0) return false;
    const isAnalyzed = radar.some(r => r.value > 0);
    if (!isAnalyzed) return false;

    const overall = Math.round(radar.reduce((s, r) => s + r.value, 0) / radar.length);
    const rule = BADGE_RULES[badgeId];
    if (!rule) return true;
    return rule.check(radar, overall);
  };

  const toggleBadge = (badgeId: string) => {
    const isUnlocked = checkUnlocked(badgeId);
    if (!isUnlocked && !pinnedBadges.includes(badgeId)) {
      setProfileError("This badge is locked. Improve your DNA metrics to unlock it!");
      return;
    }

    if (pinnedBadges.includes(badgeId)) {
      setPinnedBadges(pinnedBadges.filter(id => id !== badgeId));
    } else {
      if (pinnedBadges.length >= 3) {
        setProfileError("You can showcase at most 3 badges");
        return;
      }
      setProfileError("");
      setPinnedBadges([...pinnedBadges, badgeId]);
    }
  };



  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      await fetch(`${apiUrl}/api/settings/reanalyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': (session?.user as any)?.id || ''
        },
        body: JSON.stringify({ username, github_id: githubId })
      });
      router.push(`/analyzing/${username}`);
    } catch (err) {
      // Silent error
      setReanalyzing(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await fetch(`${apiUrl}/api/settings/account`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': (session?.user as any)?.id || ''
        },
        body: JSON.stringify({ github_id: githubId })
      });
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      // Silent error
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-white/20 pb-24 relative">

      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-black text-emerald-400">Security & Privacy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-100 tracking-tight mb-4">Settings</h1>
          <p className="text-[16px] text-zinc-500 leading-relaxed max-w-xl">Manage your profile customization, re-analyze your code, or permanently delete your DNA data.</p>
        </div>

        <div className="space-y-6">

          {/* ─── Profile Customization ─── */}
          <section className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[15px] font-bold text-zinc-100 tracking-tight">Profile Customization</h2>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Public Styling</span>
            </div>
            
            <div className="p-8">
              <form onSubmit={handleProfileUpdate} className="space-y-8">
                


                {/* 2. Profile Avatar Upload */}
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-zinc-500" /> Profile Picture (Square)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01]">
                    <div className="relative group shrink-0">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity" />
                      <img 
                        src={avatarUrl || (session?.user?.image) || `https://avatar.vercel.sh/${username}`} 
                        alt="Avatar Preview" 
                        className="relative w-16 h-16 rounded-full border border-white/10 object-cover bg-zinc-950" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${username}`;
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 w-full space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          value={avatarUrl.startsWith('data:') ? 'Local Image (Ready to Save)' : avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className="flex-1 bg-white/[0.02] border border-white/[0.08] text-zinc-100 h-10 px-4 rounded-xl text-[13px] placeholder:text-zinc-700 focus:outline-none focus:border-white/20 transition-all"
                          disabled={avatarUrl.startsWith('data:')}
                        />
                        <div className="flex gap-2 shrink-0">
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl("")}
                              className="px-4 h-10 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors border border-white/[0.08] rounded-xl hover:bg-white/5"
                            >
                              Clear
                            </button>
                          )}
                          <input
                            id="avatar-file-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            disabled={isCompressing}
                            onClick={() => document.getElementById('avatar-file-input')?.click()}
                            className="h-10 px-5 rounded-xl border border-white/[0.08] hover:bg-white/5 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all flex items-center justify-center gap-2"
                          >
                            {isCompressing ? <Loader2 className="w-3 h-3 animate-spin text-emerald-500" /> : <Upload className="w-3 h-3 text-emerald-500" />}
                            Upload File
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Custom Bio / Headline */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-500" /> Developer Bio / Headline
                    </label>
                    <span className="text-[9px] text-zinc-600 font-mono">{bio.length}/160</span>
                  </div>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 160))}
                    placeholder="Describe your engineering focus, main tech stack, or creative headline..."
                    rows={3}
                    className="w-full bg-white/[0.02] border border-white/[0.08] text-zinc-100 p-4 rounded-xl text-[13px] placeholder:text-zinc-700 focus:outline-none focus:border-white/20 transition-all resize-none leading-relaxed"
                  />
                </div>

                {/* 4. Accent Glow Theme */}
                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-zinc-500" /> Profile Accent Theme
                  </label>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {THEMES.map((theme) => {
                      const isActive = accentTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setAccentTheme(theme.id)}
                          className={`relative p-4 rounded-xl border text-center transition-all hover:bg-white/[0.04] ${
                            isActive 
                              ? 'bg-white/[0.05] border-white/20 shadow-inner' 
                              : 'bg-white/[0.01] border-white/[0.06] text-zinc-500'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${theme.color}`} />
                            <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-zinc-100' : 'text-zinc-600'}`}>{theme.name}</span>
                          </div>
                          {isActive && (
                            <span className="absolute top-2 right-2">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Showcase Badges */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-zinc-500" /> Showcase Badges (Choose Up to 3)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-zinc-600 bg-white/5 px-2 py-0.5 rounded-md">{pinnedBadges.length}/3 Selected</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {AVAILABLE_BADGES.map((badge) => {
                      const isSelected = pinnedBadges.includes(badge.id);
                      const isUnlocked = checkUnlocked(badge.id);
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => toggleBadge(badge.id)}
                          className={`flex items-start text-left p-4 rounded-2xl border transition-all duration-300 ${
                            !isUnlocked
                              ? 'bg-zinc-950/20 border-white/[0.03] text-zinc-600 cursor-not-allowed opacity-50'
                              : isSelected 
                              ? `bg-white/[0.04] text-zinc-100 ${
                                  accentTheme === 'emerald' ? 'border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.06)]' :
                                  accentTheme === 'sky' ? 'border-sky-500/40 shadow-[0_0_12px_rgba(14,165,233,0.06)]' :
                                  accentTheme === 'cyberpunk' ? 'border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.08)]' :
                                  accentTheme === 'nebula' ? 'border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.08)]' :
                                  'border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                                }`
                              : 'bg-white/[0.01] border-white/[0.06] text-zinc-500 hover:bg-white/[0.03] hover:border-white/[0.1]'
                          }`}
                        >
                          <span className={`text-2xl mr-3.5 select-none ${!isUnlocked ? 'filter grayscale opacity-30' : ''}`}>{badge.icon}</span>
                          <div className="space-y-0.5 w-full">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[12px] font-bold block ${isSelected ? 'text-zinc-100 font-extrabold' : !isUnlocked ? 'text-zinc-500' : 'text-zinc-400'}`}>{badge.label}</span>
                              {!isUnlocked && (
                                <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500/80 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded-full">
                                  Locked
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-600 leading-snug block">{badge.desc}</span>
                            {!isUnlocked && (
                              <span className="text-[9px] text-zinc-500 font-mono mt-1.5 block">
                                🔒 {!radar || radar.length === 0 || !radar.some(r => r.value > 0) ? "Requires repository analysis" : BADGE_RULES[badge.id]?.requirement}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save Feedback and Trigger */}
                <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 mt-4">
                  <div className="min-h-5 flex items-center">
                    {profileError && <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">{profileError}</span>}
                    {profileSuccess && <span className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.2em] animate-pulse">Profile updated successfully</span>}
                  </div>
                  <Button
                    type="submit"
                    disabled={profileLoading}
                    className={`bg-zinc-100 text-black hover:bg-white rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                      accentTheme === 'emerald' ? 'shadow-emerald-500/5' :
                      accentTheme === 'sky' ? 'shadow-sky-500/5' :
                      accentTheme === 'cyberpunk' ? 'shadow-purple-500/5' :
                      accentTheme === 'nebula' ? 'shadow-indigo-500/5' :
                      'shadow-amber-500/5'
                    }`}
                  >
                    {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                    Save Profile Settings
                  </Button>
                </div>

              </form>
            </div>
          </section>

          {/* ─── Technical Identity (Link GitHub) ─── */}
          <section className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-8 py-8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-lg border border-white/10">
                    <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </div>
                  <h2 className="text-[15px] font-bold text-zinc-100 tracking-tight">Technical Identity</h2>
                </div>
                <p className="text-[11px] text-zinc-600 max-w-sm leading-relaxed">
                  {githubId 
                    ? `Currently linked to GitHub ID: ${githubId}. Your technical DNA is synchronized.` 
                    : "Link your GitHub account to initialize your technical DNA sequence and appear on the leaderboard."
                  }
                </p>
              </div>
              <Button
                variant={githubId ? "outline" : "default"}
                className={`rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                  githubId ? 'border-white/10 text-emerald-500 hover:bg-emerald-500/5' : 'bg-white text-black hover:bg-zinc-200'
                }`}
                onClick={() => !githubId && signIn('github')}
                disabled={!!githubId}
              >
                {githubId ? 'Linked' : 'Link GitHub'}
              </Button>
            </div>
          </section>

          {/* ─── Re-Analyze ─── */}
          <section className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-8 py-8 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <RefreshCw className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-[15px] font-bold text-zinc-100 tracking-tight">Full System Re-Analysis</h2>
                </div>
                <p className="text-[11px] text-zinc-600 max-w-sm leading-relaxed">
                  Permanently delete your current technical fingerprint and run a fresh diagnostic against your latest repositories.
                </p>
              </div>
              <Button
                className="bg-zinc-100 text-black hover:bg-white rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/5 active:scale-95"
                onClick={handleReanalyze} disabled={reanalyzing}
              >
                {reanalyzing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                {reanalyzing ? 'Processing...' : 'Run Analysis'}
              </Button>
            </div>
          </section>

          {/* ─── Danger Zone ─── */}
          <section className="rounded-[32px] border border-red-500/10 bg-red-500/[0.02] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-red-500/10">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500/50" />
                <h2 className="text-[15px] font-bold text-red-500/60 tracking-tight">Danger Zone</h2>
              </div>
            </div>
            <div className="px-8 py-8">
              {!showDeleteConfirm ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-[14px] font-bold text-zinc-100 mb-1">Delete All Technical Data</h3>
                    <p className="text-[11px] text-zinc-600 max-w-sm leading-relaxed">
                      Permanently removes your technical fingerprint, archetypes, and global scores. This action cannot be reversed.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-white/[0.03] border-red-500/20 text-red-500/60 hover:bg-red-500/10 rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Erase Data
                  </Button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-red-500/[0.03] border border-red-500/10">
                  <p className="text-zinc-100 text-[14px] font-bold mb-4">Are you absolutely sure?</p>
                  <div className="flex gap-4">
                    <Button className="bg-red-500 text-white hover:bg-red-600 rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all" onClick={handleDeleteAccount} disabled={deleting}>
                      {deleting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                      Confirm Deletion
                    </Button>
                    <Button variant="outline" className="border-white/[0.08] text-zinc-500 hover:text-zinc-100 hover:bg-white/5 rounded-xl h-11 px-8 text-[11px] font-black uppercase tracking-widest transition-all" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
