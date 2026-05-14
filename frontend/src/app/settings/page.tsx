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
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-emerald-500/20 pb-24 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.04] bg-black/60 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-semibold text-[15px] text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Code DNA
          </Link>
          <div className="flex items-center gap-6 text-[13px]">
            <Link href="/" className="text-zinc-500 hover:text-white transition-colors">Home</Link>
            <Link href="/discover" className="text-zinc-500 hover:text-white transition-colors">Discover</Link>
            <Link href="/leaderboard" className="text-zinc-500 hover:text-white transition-colors">Leaderboard</Link>
            {username && <Link href={`/profile/${username}`} className="text-zinc-500 hover:text-white transition-colors">Profile</Link>}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-32">
        {/* Header */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-emerald-500/50" />
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-500/70">Account</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">Settings</h1>
          <p className="text-[15px] text-zinc-500">Manage your profile visibility, re-analyze, or delete your data.</p>
        </div>

        <div className="space-y-6">
          {/* ─── Visibility ─── */}
          <section className="rounded-2xl border border-white/[0.04] bg-zinc-950/30 overflow-hidden">
            <div className="px-8 py-6 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-zinc-500" />
                <h2 className="text-[15px] font-semibold text-white">Profile Visibility</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/[0.04]">
              <button
                onClick={() => handlePrivacyToggle(false)}
                className={`bg-zinc-950 p-6 text-left transition-all ${!isPublic ? 'ring-1 ring-emerald-500/30 ring-inset' : 'hover:bg-zinc-900/30'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Lock className={`w-4 h-4 ${!isPublic ? 'text-emerald-500' : 'text-zinc-600'}`} />
                  <span className={`text-[13px] font-semibold ${!isPublic ? 'text-white' : 'text-zinc-400'}`}>Private</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Only you can see your DNA. Hidden from Discover and Compare.</p>
              </button>
              <button
                onClick={() => handlePrivacyToggle(true)}
                className={`bg-zinc-950 p-6 text-left transition-all ${isPublic ? 'ring-1 ring-emerald-500/30 ring-inset' : 'hover:bg-zinc-900/30'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className={`w-4 h-4 ${isPublic ? 'text-emerald-500' : 'text-zinc-600'}`} />
                  <span className={`text-[13px] font-semibold ${isPublic ? 'text-white' : 'text-zinc-400'}`}>Public</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">Your profile appears in Discover and can be compared by others.</p>
              </button>
            </div>
          </section>

          {/* ─── Re-Analyze ─── */}
          <section className="rounded-2xl border border-white/[0.04] bg-zinc-950/30 overflow-hidden">
            <div className="px-8 py-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <RefreshCw className="w-4 h-4 text-zinc-500" />
                  <h2 className="text-[15px] font-semibold text-white">Re-Analyze</h2>
                </div>
                <p className="text-[11px] text-zinc-600 max-w-sm">
                  Delete your old fingerprint and run a fresh scan against your latest GitHub activity.
                </p>
              </div>
              <Button
                className="bg-white text-black hover:bg-emerald-400 rounded-xl h-9 px-5 text-xs font-semibold shrink-0 transition-all"
                onClick={handleReanalyze} disabled={reanalyzing}
              >
                {reanalyzing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                {reanalyzing ? 'Starting...' : 'Re-Analyze'}
              </Button>
            </div>
          </section>

          {/* ─── Danger Zone ─── */}
          <section className="rounded-2xl border border-rose-500/10 bg-zinc-950/30 overflow-hidden">
            <div className="px-8 py-6 border-b border-rose-500/10">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500/70" />
                <h2 className="text-[15px] font-semibold text-rose-400">Danger Zone</h2>
              </div>
            </div>
            <div className="px-8 py-6">
              {!showDeleteConfirm ? (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-[13px] font-semibold text-white mb-1">Delete All Data</h3>
                    <p className="text-[11px] text-zinc-600 max-w-sm">
                      Permanently removes your fingerprint, scores, vectors, and profile. Cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-rose-500/[0.04] border-rose-500/15 text-rose-400 hover:bg-rose-500/10 rounded-xl h-9 px-5 text-xs font-semibold shrink-0"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete My Data
                  </Button>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-rose-500/[0.04] border border-rose-500/10">
                  <p className="text-rose-400 text-[13px] font-medium mb-4">This action is irreversible. Are you sure?</p>
                  <div className="flex gap-3">
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-9 px-5 text-xs font-semibold" onClick={handleDeleteAccount} disabled={deleting}>
                      {deleting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                      Confirm Delete
                    </Button>
                    <Button variant="outline" className="border-white/[0.06] text-zinc-400 hover:bg-white/5 rounded-xl h-9 text-xs" onClick={() => setShowDeleteConfirm(false)}>
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
