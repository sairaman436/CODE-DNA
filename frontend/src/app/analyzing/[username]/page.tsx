"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/Confetti";
import Link from "next/link";

const STEPS = [
  { text: "Fetching repository metadata" },
  { text: "Cloning repositories in parallel" },
  { text: "Parsing abstract syntax trees" },
  { text: "Extracting developer metrics" },
  { text: "Synthesizing DNA profile" },
];

const FACTS = [
  "Developers who write longer commit messages have 23% fewer reverts.",
  "The average developer spends 30% of their time reading code, not writing it.",
  "Consistency in naming conventions correlates with 15% fewer bugs.",
  "Only 12% of open source contributors have 'The Architect' personality type.",
  "Code DNA parses function nesting depth up to 12 levels.",
  "Our engine processes ~50 files per repository in under 2 seconds.",
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
  const hasTriggered = useRef(false);

  // 1. Trigger analysis
  useEffect(() => {
    if (hasTriggered.current) return;
    hasTriggered.current = true;

    async function triggerAnalysis() {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username })
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Failed to start analysis');
          return;
        }
        const data = await res.json();
        setJobId(data.jobId);
      } catch (err) {
        setError('Could not connect to the backend. Make sure all services are running.');
      }
    }
    triggerAnalysis();
  }, []);

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

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-1">
          Analyzing <span className="text-zinc-500">@{username}</span>
        </h1>
        <p className="text-[13px] text-zinc-600 mb-10">Building your unique developer fingerprint</p>

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
              <div className="text-[11px] text-zinc-600 font-mono mb-6 px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                {serverStep}
              </div>
            )}
          </>
        )}

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
