"use client";

import { useEffect } from "react";

/**
 * SecurityGuard: Technical Identity Protection System
 * Transitions from aggressive blocking to professional diagnostic mode.
 * Allows right-click and DevTools for mobile responsiveness testing.
 */
export function SecurityGuard() {
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
        // Deceptive Redirect: Make it look like the source is inaccessible
        document.body.innerHTML = `
          <div style="background:#000;color:#fff;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:monospace;text-align:center;padding:20px;">
            <h1 style="font-size:40px;margin-bottom:10px;color:#ef4444;">404 NOT FOUND</h1>
            <p style="color:#666;font-size:14px;max-width:400px;line-height:1.6;">
              The requested resource [CODE_DNA_SOURCE] is protected by structural encryption and is not available for public inspection.
            </p>
            <div style="margin-top:40px;color:#333;font-size:10px;letter-spacing:2px;text-transform:uppercase;">
              Security Protocol Alpha-6 Active
            </div>
          </div>
        `;
        // Optional: Redirect after a delay
        setTimeout(() => window.location.href = '/', 3000);
        return false;
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  return null;
}
