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
    available: <Check className="w-4 h-4 text-zinc-400" />,
    taken: <X className="w-4 h-4 text-zinc-400" />,
    invalid: <X className="w-4 h-4 text-amber-500" />,
  };

  if (claimed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h1>
          <p className="text-zinc-500 text-[14px]">
            Your Code DNA handle is <span className="text-zinc-300 font-semibold">@{username.toLowerCase()}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex items-center justify-center selection:bg-white/20 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />

      <Link href="/" className="fixed top-8 left-8 z-50 flex items-center gap-3 font-bold text-zinc-100 group">
        <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center group-hover:bg-white/[0.1] transition-all backdrop-blur-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span className="tracking-tight">Code DNA</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 mb-3">Choose your handle</h1>
          <p className="text-[15px] text-zinc-500 leading-relaxed px-4">
            Pick a unique Code DNA username. This is your professional identity on the platform.
          </p>
        </div>

        {/* Username Input */}
        <div className="mb-4">
          <div className="relative group/input">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 text-[16px] font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder={githubLogin || "your_handle"}
              maxLength={20}
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl h-14 pl-11 pr-14 text-[16px] text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-white/30 transition-all font-bold backdrop-blur-xl"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              {statusIcon[status]}
            </div>
          </div>

          {/* Status Message */}
          <div className="h-6 mt-2 pl-1">
            {status === "available" && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-zinc-400 font-medium">
                ✓ codedna.dev/@{username.toLowerCase()} is available
              </motion.p>
            )}
            {(status === "taken" || status === "invalid") && reason && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-zinc-300 font-medium">
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
            className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6 mb-8 shadow-xl"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 font-black mb-4">Identity Preview</p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[12px] font-black text-zinc-300">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-[15px] font-bold text-zinc-100 tracking-tight">@{username.toLowerCase()}</p>
                <p className="text-[11px] text-zinc-600 font-mono">codedna.dev/u/{username.toLowerCase()}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Claim Button */}
        <Button
          className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] bg-zinc-100 text-black hover:bg-white rounded-2xl transition-all shadow-xl shadow-emerald-500/5 active:scale-95 disabled:opacity-20"
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
