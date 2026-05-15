"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [reason, setReason] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const githubId = (session as any)?.githubId;
  const githubLogin = (session as any)?.githubLogin || session?.user?.name;

  // Debounced availability check
  const checkAvailability = useCallback(async (name: string) => {
    if (name.length < 3) {
      setStatus("invalid");
      setReason("Must be at least 3 characters");
      return;
    }
    setStatus("checking");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/username/check?q=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (data.available) {
        setStatus("available");
        setReason("");
      } else {
        setStatus("taken");
        setReason(data.reason || "Not available");
      }
    } catch {
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    if (!username.trim()) {
      setStatus("idle");
      setReason("");
      return;
    }
    const timer = setTimeout(() => checkAvailability(username.trim().toLowerCase()), 400);
    return () => clearTimeout(timer);
  }, [username, checkAvailability]);

  async function handleClaim() {
    if (status !== "available") return;
    setClaiming(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/username/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_id: githubId, username: username.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimed(true);
        setTimeout(() => router.push("/"), 1500);
      } else {
        setStatus("taken");
        setReason(data.error || "Failed to claim");
      }
    } catch {
      setReason("Network error");
    } finally {
      setClaiming(false);
    }
  }

  const statusIcon = {
    idle: null,
    checking: <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />,
    available: <Check className="w-4 h-4 text-emerald-500" />,
    taken: <X className="w-4 h-4 text-rose-500" />,
    invalid: <X className="w-4 h-4 text-amber-500" />,
  };

  if (claimed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h1>
          <p className="text-zinc-500 text-[14px]">
            Your Code DNA handle is <span className="text-emerald-400 font-semibold">@{username.toLowerCase()}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex items-center justify-center selection:bg-emerald-500/20 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

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
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Choose your handle</h1>
          <p className="text-[14px] text-zinc-500">
            Pick a unique Code DNA username. This is your public profile URL.
          </p>
        </div>

        {/* Username Input */}
        <div className="mb-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 text-[14px] font-medium">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder={githubLogin || "your_handle"}
              maxLength={20}
              className="w-full bg-zinc-950 border border-white/[0.06] rounded-xl h-12 pl-9 pr-12 text-[15px] text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/30 transition-colors font-medium"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {statusIcon[status]}
            </div>
          </div>

          {/* Status Message */}
          <div className="h-6 mt-2 pl-1">
            {status === "available" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-emerald-500 font-medium">
                ✓ codedna.dev/@{username.toLowerCase()} is available
              </motion.p>
            )}
            {(status === "taken" || status === "invalid") && reason && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-rose-400 font-medium">
                {reason}
              </motion.p>
            )}
          </div>
        </div>

        {/* Preview Card */}
        {username.length >= 3 && status === "available" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/[0.04] bg-zinc-950/50 p-5 mb-6"
          >
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600 font-bold mb-3">Profile URL Preview</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white">@{username.toLowerCase()}</p>
                <p className="text-[11px] text-zinc-600">codedna.dev/u/{username.toLowerCase()}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Claim Button */}
        <Button
          className="w-full h-12 text-[14px] font-semibold bg-white text-black hover:bg-emerald-400 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={status !== "available" || claiming}
          onClick={handleClaim}
        >
          {claiming ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Claiming...</>
          ) : (
            <>Claim @{username.toLowerCase() || "handle"} <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            <span className="text-zinc-400 font-medium">Note:</span> You can change your username once every 30 days.
            This handle will be used for your public profile and recruiter-visible URL.
          </p>
        </div>

        {/* Skip */}
        <div className="text-center mt-6">
          <button onClick={() => router.push("/")} className="text-[12px] text-zinc-600 hover:text-zinc-400 transition-colors">
            Skip for now →
          </button>
        </div>
      </motion.div>
    </div>
  );
}
