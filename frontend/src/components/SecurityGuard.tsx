"use client";

import { useEffect } from "react";

export function SecurityGuard() {
  useEffect(() => {
    // 1. Industrial Console Warning (Facebook/Discord style)
    const warningTitle = "color: #10b981; font-size: 50px; font-weight: bold; text-shadow: 0 0 20px rgba(16,185,129,0.5);";
    const warningText = "color: #ffffff; font-size: 18px;";
    
    console.log("%cSTOP!", warningTitle);
    console.log(
      "%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or 'hack' someone, it is a scam and will give them access to your account.",
      warningText
    );
    console.log("%cCode DNA Protection Active.", "color: #10b981; font-weight: bold;");

    // 2. Keyboard Shortcut Blocking (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
    const handleKeydown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U') ||
        (e.metaKey && e.altKey && e.key === 'i') // Mac
      ) {
        e.preventDefault();
        console.warn("%c[SECURITY] Unauthorized inspection shortcut blocked.", "color: #ef4444; font-weight: bold;");
        return false;
      }
    };
    window.addEventListener('keydown', handleKeydown);

    // 3. Right-Click Prevention (with context menu warning)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      console.warn("%c[SECURITY] Context menu disabled for data protection.", "color: #ef4444; font-weight: bold;");
    };
    window.addEventListener('contextmenu', handleContextMenu);

    // 4. Anti-Debugging Detection (Industrial Standard)
    if (process.env.NODE_ENV === 'production') {
      const threshold = 160;
      const check = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
          // Visual Lockdown: Blur the UI if tools are open
          document.body.style.filter = "blur(20px)";
          document.body.style.pointerEvents = "none";
          // We can also trigger a debugger loop
          (function() {}.constructor("debugger")());
        } else {
          document.body.style.filter = "none";
          document.body.style.pointerEvents = "auto";
        }
      };

      const interval = setInterval(check, 1000);
      return () => {
        clearInterval(interval);
        window.removeEventListener('keydown', handleKeydown);
        window.removeEventListener('contextmenu', handleContextMenu);
      };
    }

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return null;
}

declare global {
  interface Window {
    Firebug: any;
  }
}
