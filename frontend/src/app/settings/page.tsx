"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Shield, Lock, Globe, Trash2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const githubId = (session as any)?.githubId;
  const username = (session as any)?.githubLogin || session?.user?.name;

  async function handlePrivacyToggle(pub: boolean) {
    setIsPublic(pub);
    try {
      await fetch(`${apiUrl}/api/settings/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_id: githubId, is_public: pub })
      });
    } catch (err) {
      console.error('Failed to update privacy:', err);
    }
  }

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      await fetch(`${apiUrl}/api/settings/reanalyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, github_id: githubId })
      });
      router.push(`/analyzing/${username}`);
    } catch (err) {
      console.error('Failed to reanalyze:', err);
      setReanalyzing(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await fetch(`${apiUrl}/api/settings/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ github_id: githubId })
      });
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Failed to delete account:', err);
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white/20 pb-24 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.08] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-[15px] text-zinc-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-widest">
            <Link href="/" className="text-zinc-500 hover:text-zinc-100 transition-colors">Home</Link>
            <Link href="/discover" className="text-zinc-500 hover:text-zinc-100 transition-colors">Discover</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-zinc-100 transition-colors">Leaderboard</Link>
          </div>
        </div>
      </nav>

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
