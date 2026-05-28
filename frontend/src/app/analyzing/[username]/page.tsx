"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Star, ArrowRight, Loader2, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import Link from "next/link";

const STEPS = [
  { text: "Mapping repository graph" },
  { text: "Launching engine agents" },
  { text: "Tracing code structure" },
  { text: "Extracting behavior signals" },
  { text: "Forging DNA fingerprint" },
];

const FACTS = [
  "Signal agents ignore generated files and focus on source that carries intent.",
  "Naming, nesting, tests, error paths, and commit rhythm all leave a fingerprint.",
  "Large repositories are split into file lanes so one heavy project does not own the room.",
  "The engine reads code structure, not just language badges.",
  "Final synthesis weighs both breadth across repos and depth inside selected files.",
  "Slow tail repositories are watched and skipped if they stop the rest of the analysis.",
];

const SIGNALS = [
  "source graph",
  "agent lanes",
  "syntax traces",
  "test pulse",
  "error paths",
  "naming rhythm",
  "commit echo",
  "DNA merge",
];

export default function AnalyzingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const username = params.username as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serverStep, setServerStep] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Gateway states
  const [isGatewayBlocked, setIsGatewayBlocked] = useState(false);
  const [starredStatus, setStarredStatus] = useState(false);
  const [followedStatus, setFollowedStatus] = useState(false);
  const [isCheckingGateway, setIsCheckingGateway] = useState(false);

  const hasTriggered = useRef(false);

  const runAnalysis = async () => {
    setError(null);
    setIsCheckingGateway(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'GATEWAY_REQUIRED') {
          setIsGatewayBlocked(true);
          setStarredStatus(data.starred);
          setFollowedStatus(data.followed);
        } else {
          setError(data.message || data.error || 'Failed to start analysis');
        }
        return;
      }
      
      // Success! Clear gateway block and start polling
      setIsGatewayBlocked(false);
      setJobId(data.jobId);
    } catch (err) {
      setError('Could not connect to the backend. Make sure all services are running.');
    } finally {
      setIsCheckingGateway(false);
    }
  };

  // 1. Trigger analysis on mount once username is ready
  useEffect(() => {
    if (!username) return;
    if (hasTriggered.current) return;
    hasTriggered.current = true;
    runAnalysis();
  }, [username]);

  // 2. Poll for status
  useEffect(() => {
    if (!jobId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let pollCount = 0;
    const maxPolls = 300;

    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        setError('Analysis is taking longer than expected. Please try again.');
        return;
      }

      try {
        const res = await fetch(`${apiUrl}/api/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.current_step) setServerStep(data.current_step);
        if (data.progress >= 10) setCurrentStep(1);
        if (data.progress >= 30) setCurrentStep(2);
        if (data.progress >= 60) setCurrentStep(3);
        if (data.progress >= 90) setCurrentStep(4);

        if (data.status === 'completed') {
          setCurrentStep(STEPS.length - 1);
          setShowConfetti(true);
          clearInterval(interval);
          setTimeout(() => router.push(`/profile/${username}`), 2000);
        }

        if (data.status === 'failed') {
          clearInterval(interval);
          setError(data.error_message || 'Analysis failed. Please try again.');
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, username, router]);

  // 3. Rotate facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 4. Advance visual steps
  useEffect(() => {
    if (error || !jobId) return;
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 2 ? prev + 1 : prev));
    }, 8000);
    return () => clearInterval(timer);
  }, [error, jobId]);

  const progress = Math.round(((currentStep + 1) / STEPS.length) * 100);
  const visibleSignals = SIGNALS.slice(0, Math.min(SIGNALS.length, currentStep + 4));

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col items-center justify-center selection:bg-white/20 relative noise">
      <div className="fixed inset-0 dot-grid pointer-events-none z-0" />
      {showConfetti && <Confetti />}

      {/* Back to home */}
      <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-2.5 text-[13px] text-zinc-600 hover:text-zinc-100 transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Code DNA
      </Link>

      <div className="relative z-10 max-w-lg w-full px-6 flex flex-col items-center text-center">

        {/* Animated Orb */}
        {!isGatewayBlocked && (
          <div className="w-24 h-24 mb-12 relative flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-white/20"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  rotate: { duration: 6 + i * 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3 + i, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{
                  borderRadius: i % 2 === 0 ? '40% 60% 60% 40% / 40% 50% 50% 60%' : '60% 40% 40% 60% / 50% 40% 60% 50%'
                }}
              />
            ))}
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          </div>
        )}

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-1">
          {isGatewayBlocked ? (
            "Gateway Unlock"
          ) : (
            <>Analyzing <span className="text-zinc-500">@{username}</span></>
          )}
        </h1>
        <p className="text-[13px] text-zinc-600 mb-10">
          {isGatewayBlocked ? (
            "Complete verification steps to analyze your repositories"
          ) : (
            "Orchestrating engine agents across your code graph"
          )}
        </p>

        {isGatewayBlocked ? (
          <div className="w-full rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-xl p-6 mb-8 text-left relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -right-24 -top-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
            <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px]" />

            <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-white/[0.04]">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-[14px] font-semibold text-zinc-200">Gateway Validation Required</h3>
                <p className="text-[11px] text-zinc-500">Perform the following tasks to begin analysis</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Task 1: Star Repo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-all hover:bg-white/[0.04] hover:border-white/[0.08]">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Star className={`w-4 h-4 ${starredStatus ? 'text-amber-400 fill-amber-400/20 animate-pulse' : 'text-zinc-500'}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                      Star CODE-DNA Repository
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider bg-white/[0.04] px-1.5 py-0.5 rounded">Required</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Support the open-source blueprint</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {starredStatus ? (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                    </span>
                  ) : (
                    <a
                      href="https://github.com/sairaman436/CODE-DNA"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-400 hover:text-sky-300 transition-colors bg-sky-500/[0.08] hover:bg-sky-500/[0.12] border border-sky-500/25 px-2.5 py-1 rounded-md"
                    >
                      Star Repo <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                onClick={runAnalysis}
                disabled={isCheckingGateway}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-black rounded-lg h-9 text-xs font-semibold shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_16px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-1.5"
              >
                {isCheckingGateway ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying Status...
                  </>
                ) : (
                  <>
                    Verify & Proceed <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
              <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                Note: Caching may delay GitHub API updates. Please wait 5-10 seconds before verifying.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <div className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-5 mb-8 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-zinc-300" />
                  <h3 className="text-[13px] font-semibold text-zinc-300">Analysis Error</h3>
                </div>
                <p className="text-[12px] text-zinc-500 mb-4">{error}</p>
                <Button
                  variant="outline"
                  className="border-white/15 text-zinc-300 hover:bg-white/10 rounded-lg h-8 text-xs font-medium"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Progress */}
            {!error && (
              <>
                {/* Progress bar */}
                <div className="w-full h-1 bg-white/[0.04] rounded-full mb-8 overflow-hidden">
                  <motion.div
                    className="h-full bg-white/60 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                {/* Signal Console */}
                <div className="w-full mb-8 grid grid-cols-2 gap-2">
                  {visibleSignals.map((signal, idx) => {
                    const isHot = idx % STEPS.length === currentStep % STEPS.length;
                    return (
                      <motion.div
                        key={signal}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: isHot ? 1 : 0.55, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`h-9 rounded-md border px-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.12em] ${
                          isHot
                            ? 'border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-200'
                            : 'border-white/[0.06] bg-white/[0.03] text-zinc-600'
                        }`}
                      >
                        <span>{signal}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${isHot ? 'bg-emerald-300 animate-pulse' : 'bg-zinc-700'}`} />
                      </motion.div>
                    );
                  })}
                </div>

                {/* Steps */}
                <div className="w-full text-left space-y-0 mb-10">
                  {STEPS.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isPast = idx < currentStep;
                    return (
                      <div key={idx} className={`flex items-center gap-4 py-3 border-b border-white/[0.03] transition-all duration-500 ${isPast || isActive ? 'opacity-100' : 'opacity-20'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                          isPast ? 'bg-white/10 text-zinc-400' :
                          isActive ? 'bg-white text-black' :
                          'bg-white/[0.03] text-zinc-700'
                        }`}>
                          {isPast ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span>{String(idx + 1).padStart(2, '0')}</span>
                          )}
                        </div>
                        <span className={`text-[13px] font-medium ${isActive ? 'text-zinc-100' : isPast ? 'text-zinc-500' : 'text-zinc-700'}`}>
                          {step.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Server status */}
                {serverStep && (
                  <div className="text-[11px] text-emerald-200/80 font-mono mb-6 px-3 py-2 rounded-md bg-emerald-400/[0.06] border border-emerald-400/[0.14] backdrop-blur-md max-w-full leading-relaxed">
                    {serverStep}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="w-full h-px bg-white/[0.04] my-6" />
        <p className="text-[10px] text-zinc-500 max-w-sm mx-auto leading-normal mb-6">
          Note: Make sure the GitHub account is yours only, because our community checks the gateway, which may not allow you to analyze other users' repositories.
        </p>

        {/* Rotating Facts */}
        <div className="h-12 relative w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={factIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-zinc-700 text-[12px] absolute inset-0 flex items-center justify-center leading-relaxed"
            >
              {FACTS[factIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
