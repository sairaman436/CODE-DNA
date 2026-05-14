"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Shield, Lock, Eye } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [publicUsername, setPublicUsername] = useState("");

  useEffect(() => {
    if (session?.user?.name) {
      router.push(`/analyzing/${session.user.name}`);
    }
  }, [session, router]);

  function handlePublicAnalysis() {
    if (publicUsername.trim()) {
      router.push(`/analyzing/${publicUsername.trim()}`);
    }
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex items-center justify-center selection:bg-emerald-500/20 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      {/* Back to home */}
      <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-2.5 text-[13px] text-zinc-600 hover:text-white transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Code DNA
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Sign in</h1>
          <p className="text-[14px] text-zinc-500">Connect your GitHub to generate your DNA fingerprint.</p>
        </div>

        {/* GitHub Button */}
        <Button
          className="w-full h-12 text-[14px] font-semibold bg-white text-black hover:bg-emerald-400 rounded-xl mb-8 transition-all"
          onClick={() => signIn("github")}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Continue with GitHub
        </Button>

        {/* Permissions */}
        <div className="rounded-xl border border-white/[0.04] bg-zinc-950/40 p-5 mb-6">
          <h3 className="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-600 mb-4">Permissions</h3>
          <div className="space-y-3">
            <PermRow icon={<Eye className="w-3.5 h-3.5" />} scope="read:user" desc="Public profile info" />
            <PermRow icon={<GitBranch className="w-3.5 h-3.5" />} scope="public_repo" desc="Read public repositories" />
            <PermRow icon={<Lock className="w-3.5 h-3.5" />} scope="no write" desc="Cannot modify your repos" />
          </div>
        </div>

        {/* Trust Signal */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 mb-8">
          <Shield className="w-4 h-4 text-emerald-500/70 mt-0.5 shrink-0" />
          <p className="text-[12px] text-zinc-500 leading-relaxed">
            We <span className="text-zinc-300 font-medium">never store your source code</span>. Only derived scores and classification data is persisted.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/[0.04]" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-700 font-bold">Or analyze publicly</span>
          <div className="flex-1 h-px bg-white/[0.04]" />
        </div>

        {/* Public Input */}
        <div className="flex gap-2">
          <Input
            value={publicUsername}
            onChange={(e) => setPublicUsername(e.target.value)}
            placeholder="GitHub username"
            className="bg-zinc-950/50 border-white/[0.06] text-zinc-300 rounded-xl h-10 text-[13px] focus-visible:ring-1 focus-visible:ring-emerald-500/30 placeholder:text-zinc-700"
            onKeyDown={(e) => e.key === 'Enter' && handlePublicAnalysis()}
          />
          <Button
            variant="outline"
            className="bg-zinc-950/50 border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-10 text-[13px] font-medium shrink-0"
            onClick={handlePublicAnalysis}
          >
            Analyze
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function PermRow({ icon, scope, desc }: { icon: React.ReactNode; scope: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-zinc-600">{icon}</div>
      <span className="text-[12px] font-mono text-zinc-400">{scope}</span>
      <span className="text-[12px] text-zinc-600">— {desc}</span>
    </div>
  );
}
