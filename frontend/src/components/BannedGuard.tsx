"use client";

import { useSession, signOut } from "next-auth/react";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

/**
 * BannedGuard: Prevents restricted users from accessing any community services.
 * Shows a professional "Access Revoked" screen with an explanation.
 */
export function BannedGuard() {
  const { data: session, status: sessionStatus, update } = useSession();
  const [isVerifying, setIsVerifying] = useState(false);
  
  useEffect(() => {
    // If the session claims to be BANNED, we MUST verify with the server
    // in case they were recently "Wiped" or "Restored".
    if (session?.status === 'BANNED' || (session?.user as any)?.status === 'BANNED') {
      const verifyStatus = async () => {
        setIsVerifying(true);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const userId = (session?.user as any)?.id;
          if (!userId) return;

          const res = await fetch(`${apiUrl}/api/profile/status/${userId}`);
          
          if (!res.ok) {
            // If user is 404, they were WIPED. Clear session silently.
            signOut({ callbackUrl: '/' });
            window.location.href = '/'; // Fallback redirect
          } else {
            const data = await res.json();
            if (data.status === 'ACTIVE') {
              // If user is ACTIVE, they were RESTORED. Refresh session silently.
              update(); // Try NextAuth session update
              window.location.reload(); // Hard reload to clear banned state
            }
          }
        } catch (err) {
          // Silent fail-closed: If the verification API is unreachable (network error),
          // we catch the error but do not log it to avoid exposing internals.
          // The isVerifying state will revert to false, keeping the ban screen active.
        } finally {
          setIsVerifying(false);
        }
      };

      verifyStatus();
    }
  }, [session, sessionStatus]);

  // Only trigger if explicitly BANNED and not in the middle of a positive verification
  if ((session?.status !== 'BANNED' && (session?.user as any)?.status !== 'BANNED') || isVerifying) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-md w-full">
        <div className="w-24 h-24 rounded-[40px] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-10 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        
        <h1 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
          No More Service <br/>Is Available To You
        </h1>
        
        <p className="text-zinc-500 text-[16px] leading-relaxed mb-10">
          We are sorry, but your technical identity has been revoked from the Code DNA community by an administrator. This decision is final and all services have been suspended.
        </p>
        
        <div className="pt-8 border-t border-white/[0.05]">
          <Button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-xl active:scale-95 flex items-center gap-2 mx-auto"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </Button>
        </div>
        
        <div className="mt-12 text-[10px] text-zinc-800 font-black uppercase tracking-[0.3em]">
          Protocol Status: IDENTITY_REVOKED
        </div>
      </div>
    </div>
  );
}
