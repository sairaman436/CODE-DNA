"use client";

import { useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, ArrowRight, Loader2, Star, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

import { DynamicBackground } from "@/components/DynamicBackground";
import { SilkBackground } from "@/components/SilkBackground";
import Footer from "@/components/Footer";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-zinc-500 uppercase tracking-widest text-[11px]">Loading Gateway...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a valid GitHub username.");
      return;
    }

    if (/[^a-zA-Z0-9-]/.test(trimmed)) {
      setError("Invalid GitHub username format.");
      return;
    }

    setLoading(true);
    // Redirect directly to the analyzing page
    router.push(`/analyzing/${trimmed}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-between selection:bg-emerald-500/30 relative overflow-hidden p-6 pt-28">
      <SilkBackground color="#050505" />
      <DynamicBackground />

      {/* Brand Header */}
      <Link href="/" className="fixed top-8 left-8 z-50 flex items-center gap-3 font-black text-zinc-100 group">
        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center group-hover:bg-white/[0.1] transition-all backdrop-blur-md">
          <Shield className="w-5 h-5 text-emerald-500" />
        </div>
        <span className="tracking-[0.2em] uppercase text-[12px]">Code DNA</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black tracking-tight text-zinc-100 mb-2 uppercase">
              Analyze Repositories
            </h1>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
              Enter GitHub Identity
            </p>
          </div>

          <form onSubmit={handleStartAnalysis} className="space-y-6">
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-zinc-600 font-mono text-sm">@</span>
              <Input
                type="text"
                placeholder="GITHUB USERNAME"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="bg-white/[0.02] border-white/[0.08] h-12 pl-8 rounded-xl text-[13px] font-bold uppercase tracking-widest focus:ring-emerald-500/20"
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-500 font-black uppercase tracking-widest text-center">
                {error}
              </p>
            )}

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <div className="flex gap-2.5 items-start">
                <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-200">
                    Gateway Star Required
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    You must star the <a href="https://github.com/sairaman436/CODE-DNA" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline inline-flex items-center gap-0.5">CODE-DNA repository <ExternalLink className="w-2.5 h-2.5" /></a> to authorize the analysis engine.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 mt-10 bg-zinc-100 text-black hover:bg-white rounded-2xl font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Decode Sequence <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
