"use client";

import { useState, useEffect } from "react";
import { useSession, signOut, signIn } from "next-auth/react";
import { Shield, Lock, Globe, Trash2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const githubId = (session as any)?.githubId;
  const username = (session as any)?.githubLogin || session?.user?.name;

  // Load current privacy state from DB
  useEffect(() => {
    if (!username) return;
    async function loadPrivacy() {
      try {
        const res = await fetch(`${apiUrl}/api/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setIsPublic(data.user?.plan === 'public' || false);
        }
      } catch (err) {
        // Silent error
      } finally {
        setPrivacyLoading(false);
      }
    }
    loadPrivacy();
  }, [username, apiUrl]);

  async function handlePrivacyToggle(pub: boolean) {
    setIsPublic(pub);
    try {
      await fetch(`${apiUrl}/api/settings/privacy`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': (session?.user as any)?.id || ''
        },
        body: JSON.stringify({ github_id: githubId, is_public: pub })
      });
    } catch (err) {
      // Silent error
    }
  }

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
          <p className="text-[16px] text-zinc-500 leading-relaxed max-w-xl">Manage your profile visibility, re-analyze your code, or permanently delete your DNA data.</p>
        </div>

        <div className="space-y-6">
          {/* ─── Visibility ─── */}
          <section className="rounded-[32px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[15px] font-bold text-zinc-100 tracking-tight">Profile Visibility</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.08]">
              <button
                onClick={() => handlePrivacyToggle(false)}
                className={`bg-white/[0.04] p-8 text-left transition-all ${!isPublic ? 'bg-white/[0.1] shadow-inner' : 'hover:bg-white/[0.06]'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className={`w-4 h-4 ${!isPublic ? 'text-zinc-100' : 'text-zinc-600'}`} />
                  <span className={`text-[14px] font-bold ${!isPublic ? 'text-zinc-100' : 'text-zinc-500'}`}>Private DNA</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Only you can see your technical fingerprint. Hidden from Discover and Compare.</p>
              </button>
              <button
                onClick={() => handlePrivacyToggle(true)}
                className={`bg-white/[0.04] p-8 text-left transition-all ${isPublic ? 'bg-white/[0.1] shadow-inner' : 'hover:bg-white/[0.06]'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className={`w-4 h-4 ${isPublic ? 'text-zinc-100' : 'text-zinc-600'}`} />
                  <span className={`text-[14px] font-bold ${isPublic ? 'text-zinc-100' : 'text-zinc-500'}`}>Public Discovery</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Your profile appears in the global talent feed and can be analyzed by recruiters.</p>
              </button>
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
    </div>
  );
}
