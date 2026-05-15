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

    // 2. Anti-Debugging Detection (Industrial Standard)
    // This script detects if DevTools is open and can trigger a 'debugger' trap.
    if (process.env.NODE_ENV === 'production') {
      const devtools: { isOpen: boolean; orientation: "vertical" | "horizontal" | undefined } = {
        isOpen: false,
        orientation: undefined,
      };

      const threshold = 160;
      const emitEvent = (isOpen: boolean, orientation: any) => {
        if (isOpen) {
          // If DevTools is open, we can run a debugger trap to make logic analysis harder
          // This doesn't stop the user, but it makes the 'Sources' tab chaotic.
          (function() {
            (function a() {
              try {
                (function b(i: number) {
                  if (("" + i / i).length !== 1 || i % 20 === 0) {
                    (function() {}.constructor("debugger")());
                  } else {
                    (function() {}.constructor("debugger")());
                  }
                  b(++i);
                })(0);
              } catch (e) {
                setTimeout(a, 5000);
              }
            })();
          })();
        }
      };

      const check = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        const orientation = widthThreshold ? 'vertical' : 'horizontal';

        if (!(heightThreshold && widthThreshold) && 
            ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) || widthThreshold || heightThreshold)) {
          if (!devtools.isOpen || devtools.orientation !== orientation) {
            emitEvent(true, orientation);
          }
          devtools.isOpen = true;
          devtools.orientation = orientation;
        } else {
          if (devtools.isOpen) {
            emitEvent(false, undefined);
          }
          devtools.isOpen = false;
          devtools.orientation = undefined;
        }
      };

      setInterval(check, 1000);
    }

    // 3. Prevent 'view-source' is handled by browser, but we can make it unreadable
    // through minification (automatic in Next.js).
  }, []);

  return null;
}

declare global {
  interface Window {
    Firebug: any;
  }
}
