"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Shield, Lock, Eye, Mail, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { DynamicBackground } from "@/components/DynamicBackground";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [publicUsername, setPublicUsername] = useState("");
  const [authMode, setAuthMode] = useState<"main" | "email" | "otp">("main");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSendOtp() {
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setSending(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthMode("otp");
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyOtp() {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.success) {
        const result = await signIn("otp", {
          email,
          user: JSON.stringify(data.user),
          redirect: false,
          callbackUrl: data.user.needs_username ? "/onboarding" : "/"
        });

        if (result?.error) {
          setError(result.error);
        } else {
          router.push(data.user.needs_username ? "/onboarding" : "/");
        }
      } else {
        setError(data.error || "Invalid code");
      }
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleOtpInput(index: number, value: string) {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
    if (e.key === "Enter" && otp.join("").length === 6) {
      handleVerifyOtp();
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center selection:bg-emerald-500/20 relative overflow-hidden">
      <DynamicBackground />

      <Link href="/" className="fixed top-8 left-8 z-50 flex items-center gap-3 font-bold text-white group">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        Code DNA
      </Link>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] -z-10" />
        
        <AnimatePresence mode="wait">
          {authMode === "main" && (
            <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="rounded-[40px] border border-white/[0.05] bg-zinc-900/20 backdrop-blur-xl p-10 shadow-2xl"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-white mb-3">Begin Analysis</h1>
                <p className="text-[14px] text-zinc-500 leading-relaxed">Choose an authentication method to generate your unique developer fingerprint.</p>
              </div>

              <div className="space-y-4 mb-10">
                <Button
                  className="w-full h-14 text-[15px] font-bold bg-white text-black hover:bg-emerald-400 rounded-2xl transition-all shadow-xl shadow-white/5 active:scale-95"
                  onClick={() => signIn("github")}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  Connect GitHub
                </Button>

                <Button
                  variant="ghost"
                  className="w-full h-14 text-[14px] font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                  onClick={() => setAuthMode("email")}
                >
                  <Mail className="w-4 h-4 mr-3" />
                  Continue with Email
                </Button>
              </div>

              <div className="space-y-3 p-6 rounded-3xl bg-white/[0.02] border border-white/[0.04] mb-10">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 mb-4">Required Access</h3>
                <PermRow icon={<Eye className="w-3.5 h-3.5" />} scope="read:user" desc="Identity verification" />
                <PermRow icon={<GitBranch className="w-3.5 h-3.5" />} scope="repo" desc="AST data retrieval" />
                <PermRow icon={<Shield className="w-3.5 h-3.5" />} scope="no write" desc="Zero-mutation guarantee" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px bg-white/[0.05]" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-700 font-bold">Public Analysis</span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>

              <div className="flex gap-2">
                <Input
                  value={publicUsername}
                  onChange={(e) => setPublicUsername(e.target.value)}
                  placeholder="GitHub username..."
                  className="bg-black/40 border-white/[0.08] text-white rounded-xl h-11 text-[13px] focus-visible:ring-emerald-500/40 placeholder:text-zinc-700"
                  onKeyDown={(e) => e.key === 'Enter' && handlePublicAnalysis()}
                />
                <Button
                  className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-black rounded-xl h-11 px-6 text-[13px] font-bold transition-all shrink-0"
                  onClick={handlePublicAnalysis}
                >
                  Analyze
                </Button>
              </div>
            </motion.div>
          )}

          {authMode === "email" && (
            <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-[40px] border border-white/[0.05] bg-zinc-900/20 backdrop-blur-xl p-10 shadow-2xl"
            >
              <button onClick={() => setAuthMode("main")} className="flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-white transition-colors mb-10 uppercase tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Email Access</h1>
                <p className="text-[14px] text-zinc-500 leading-relaxed">We&apos;ll send a secure 6-digit code to your inbox.</p>
              </div>

              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="developer@domain.com"
                className="bg-black/40 border-white/[0.08] text-white rounded-2xl h-14 text-[15px] focus-visible:ring-emerald-500/40 placeholder:text-zinc-700 mb-6"
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              />

              {error && <p className="text-rose-500 text-[12px] mb-6 font-bold text-center">{error}</p>}

              <Button
                className="w-full h-14 text-[15px] font-bold bg-white text-black hover:bg-emerald-400 rounded-2xl transition-all shadow-xl shadow-white/5"
                onClick={handleSendOtp}
                disabled={sending || !email}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Access Code"}
              </Button>
            </motion.div>
          )}

          {authMode === "otp" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-[40px] border border-white/[0.05] bg-zinc-900/20 backdrop-blur-xl p-10 shadow-2xl text-center"
            >
              <button onClick={() => setAuthMode("email")} className="flex items-center gap-2 text-[12px] font-bold text-zinc-500 hover:text-white transition-colors mb-10 uppercase tracking-widest text-left">
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
              </button>

              <div className="mb-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-emerald-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Verify Identity</h1>
                <p className="text-[14px] text-zinc-500">Entering code sent to {email}</p>
              </div>

              <div className="flex justify-center gap-3 mb-8">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-16 bg-black/40 border border-white/[0.08] rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                ))}
              </div>

              {error && <p className="text-rose-500 text-[12px] mb-6 font-bold">{error}</p>}

              <Button
                className="w-full h-14 text-[15px] font-bold bg-white text-black hover:bg-emerald-400 rounded-2xl transition-all shadow-xl shadow-white/5"
                onClick={handleVerifyOtp}
                disabled={verifying || otp.join("").length !== 6}
              >
                {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Analyze"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function PermRow({ icon, scope, desc }: { icon: React.ReactNode; scope: string; desc: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="text-zinc-600">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{scope}</span>
        <span className="text-[10px] text-zinc-600 font-medium">{desc}</span>
      </div>
    </div>
  );
}

