"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch, Shield, Lock, Eye, Mail, Loader2, ArrowLeft, User, Phone, Globe, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import { DynamicBackground } from "@/components/DynamicBackground";
import { SilkBackground } from "@/components/SilkBackground";

type AuthMode = "login" | "signup" | "link_mismatch";
type AuthStep = "credentials" | "otp" | "link_github";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") as AuthMode || "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<AuthStep>("credentials");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: searchParams.get("email") || "",
    password: "",
    phone: "",
    countryCode: "+91",
  });

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  // Remove the old URL error effect since we use mode now

  useEffect(() => {
    if (session?.user && step !== "link_github") {
      router.push("/");
    }
  }, [session, router, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleAction = async () => {
    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const endpoint = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.bypassOtp) {
          await finalizeAuth(data.user);
        } else {
          setStep("otp");
        }
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code }),
      });

      const data = await res.json();
      if (data.success) {
        setVerifiedUser(data.user);
        
        if (mode === "link_mismatch") {
          const forceLinkRes = await fetch(`${apiUrl}/api/auth/force-link-github`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.user.email,
              github_id: searchParams.get("gh_id"),
              github_username: searchParams.get("gh_username"),
              avatar_url: searchParams.get("gh_avatar")
            })
          });
          if (forceLinkRes.ok) {
            // Re-trigger GitHub OAuth login which will now succeed
            await signIn("github", { callbackUrl: "/" });
            return;
          } else {
            setError("Failed to link GitHub account.");
            return;
          }
        }

        if (!data.user.github_linked) {
          setStep("link_github");
        } else {
          // Finalize login with NextAuth credentials
          await finalizeAuth(data.user);
        }
      } else {
        setError(data.error || "Invalid code");
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeAuth = async (user: any) => {
    const result = await signIn("otp", {
      email: user.email,
      user: JSON.stringify(user),
      redirect: false,
    });
    if (result?.ok) {
      router.push("/");
    } else {
      setError("Session creation failed.");
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex items-center justify-center selection:bg-emerald-500/30 relative overflow-hidden p-6">
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
        className="relative z-10 w-full max-w-lg"
      >
        <AnimatePresence mode="wait">
          {step === "credentials" && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              
              <div className="text-center mb-10">
                <h1 className="text-4xl font-black tracking-tight text-zinc-100 mb-2 uppercase">
                  {mode === "login" ? "Security Portal" : mode === "link_mismatch" ? "Link Identity" : "Genesis Init"}
                </h1>
                <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
                  {mode === "login" ? "Authorized Access Only" : mode === "link_mismatch" ? "Verify Registered Email" : "Create your technical identity"}
                </p>
                {mode === "link_mismatch" && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-[13px] font-bold">
                    GitHub email unmatched. Login below to link it to your account.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {mode === "signup" && (
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-4 h-4 text-zinc-600" />
                    <Input
                      name="name"
                      placeholder="FULL NAME"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-white/[0.02] border-white/[0.08] h-12 pl-12 rounded-xl text-[13px] font-bold uppercase tracking-widest focus:ring-emerald-500/20"
                    />
                  </div>
                )}
                
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-4 h-4 text-zinc-600" />
                  <Input
                    name="email"
                    type="email"
                    placeholder="EMAIL SEQUENCE"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-white/[0.02] border-white/[0.08] h-12 pl-12 rounded-xl text-[13px] font-bold uppercase tracking-widest focus:ring-emerald-500/20"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-4 h-4 text-zinc-600" />
                  <Input
                    name="password"
                    type="password"
                    placeholder="ENCRYPTION KEY"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="bg-white/[0.02] border-white/[0.08] h-12 pl-12 rounded-xl text-[13px] font-bold uppercase tracking-widest focus:ring-emerald-500/20"
                  />
                </div>

                {mode === "signup" && (
                  <div className="flex gap-2">
                    <div className="relative w-24 shrink-0">
                      <Globe className="absolute left-4 top-4 w-4 h-4 text-zinc-600" />
                      <Input
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className="bg-white/[0.02] border-white/[0.08] h-12 pl-12 rounded-xl text-[13px] font-bold focus:ring-emerald-500/20"
                      />
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-4 w-4 h-4 text-zinc-600" />
                      <Input
                        name="phone"
                        placeholder="PHONE SEQUENCE"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="bg-white/[0.02] border-white/[0.08] h-12 pl-12 rounded-xl text-[13px] font-bold uppercase tracking-widest focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {error && <p className="mt-6 text-[11px] text-rose-500 font-black uppercase tracking-widest text-center">{error}</p>}

              <Button
                onClick={handleAction}
                disabled={loading}
                className="w-full h-14 mt-10 bg-zinc-100 text-black hover:bg-white rounded-2xl font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl transition-all active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Verify Identity" : mode === "link_mismatch" ? "Link & Continue" : "Initialize Account"}
              </Button>

              {mode !== "link_mismatch" && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-emerald-400 transition-colors"
                  >
                    {mode === "login" ? "Establish New Identity" : "Return to Security Portal"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-100 mb-2">2FA Verification</h2>
              <p className="text-[12px] text-zinc-500 mb-10 font-bold uppercase tracking-widest">Code sent to {formData.email}</p>

              <div className="flex justify-center gap-3 mb-10">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0) {
                        document.getElementById(`otp-${i - 1}`)?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                      if (paste.length > 0) {
                        const newOtp = [...otp];
                        for (let j = 0; j < paste.length && i + j < 6; j++) {
                          newOtp[i + j] = paste[j];
                        }
                        setOtp(newOtp);
                        const nextIndex = Math.min(i + paste.length, 5);
                        document.getElementById(`otp-${nextIndex}`)?.focus();
                      }
                    }}
                    className="w-12 h-16 bg-white/[0.02] border border-white/[0.08] rounded-xl text-center text-2xl font-black text-emerald-500 focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                  />
                ))}
              </div>

              {error && <p className="mb-6 text-[11px] text-rose-500 font-black uppercase tracking-widest">{error}</p>}

              <Button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full h-14 bg-emerald-500 text-black hover:bg-emerald-400 rounded-2xl font-black uppercase tracking-[0.3em] text-[13px] shadow-2xl transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Decrypt"}
              </Button>
            </motion.div>
          )}

          {step === "link_github" && (
            <motion.div
              key="github"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-[40px] p-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
                <GitBranch className="w-10 h-10 text-zinc-100" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-zinc-100 mb-4">Sequence Link</h2>
              <p className="text-[13px] text-zinc-500 mb-10 leading-relaxed font-medium">
                Identity verified. Now link your GitHub sequence to generate your structural DNA fingerprint.
              </p>

              <Button
                onClick={() => signIn("github")}
                className="w-full h-16 bg-zinc-100 text-black hover:bg-white rounded-2xl font-black uppercase tracking-[0.3em] text-[14px] flex items-center justify-center gap-4 transition-all"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Sync GitHub Profile
              </Button>

              <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Authorized Read-Only Analysis
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

