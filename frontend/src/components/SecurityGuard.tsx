"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * SecurityGuard: Technical Identity Protection System
 * Transitions from aggressive blocking to professional diagnostic mode.
 * Allows right-click and DevTools for mobile responsiveness testing.
 */
export function SecurityGuard() {
  const [blocked, setBlocked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 1. Industrial Console Warning (Facebook/Discord style)
    const warningTitle = "color: #10b981; font-size: 50px; font-weight: bold; text-shadow: 0 0 20px rgba(16,185,129,0.5);";
    const warningText = "color: #ffffff; font-size: 14px; font-family: sans-serif;";
    
    console.log("%cCODE DNA", warningTitle);
    console.log(
      "%c[SYSTEM INFO] Technical Identity Protection is ACTIVE.\n" +
      "This console is for authorized system diagnostics only. If you are here to 'inspect' the DNA structure, " +
      "note that the Abstract Syntax Tree mappings are proprietary and secured.\n\n" +
      "Security Mode: Diagnostic (Allow Inspect)",
      warningText
    );

    // 2. View Source Deception (Ctrl+U / Cmd+U)
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        setBlocked(true);
        setTimeout(() => {
          setBlocked(false);
          router.push('/');
        }, 3000);
        return false;
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [router]);

  if (blocked) {
    return (
      <div 
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#000', color: '#fff',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', textAlign: 'center', padding: '20px'
        }}
      >
        <h1 style={{ fontSize: 40, marginBottom: 10, color: '#ef4444' }}>404 NOT FOUND</h1>
        <p style={{ color: '#666', fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>
          The requested resource [CODE_DNA_SOURCE] is protected by structural encryption and is not available for public inspection.
        </p>
        <div style={{ marginTop: 40, color: '#333', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const }}>
          Security Protocol Alpha-6 Active
        </div>
      </div>
    );
  }

  return null;
}
