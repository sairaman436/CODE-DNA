"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

const COMMANDS = [
  { label: "Home", href: "/" },
  { label: "Discover Developers", href: "/discover" },
  { label: "Compare DNA", href: "/compare" },
  { label: "How it Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Settings", href: "/settings" },
  { label: "The Architect", href: "/archetype/the-architect" },
  { label: "The Hacker", href: "/archetype/the-hacker" },
  { label: "The Perfectionist", href: "/archetype/the-perfectionist" },
  { label: "The Debugger", href: "/archetype/the-debugger" },
  { label: "The Polyglot", href: "/archetype/the-polyglot" },
  { label: "The Pragmatist", href: "/archetype/the-pragmatist" },
  { label: "The Scientist", href: "/archetype/the-scientist" },
  { label: "The Mentor", href: "/archetype/the-mentor" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
            onClick={() => setOpen(false)}
          />
          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[91]"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-zinc-950 shadow-2xl overflow-hidden">
              {/* Input */}
              <div className="flex items-center gap-3 px-5 h-14 border-b border-white/[0.04]">
                <Search className="w-4 h-4 text-zinc-600" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, archetypes..."
                  className="flex-1 bg-transparent text-[14px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filtered.length > 0) {
                      navigate(filtered[0].href);
                    }
                  }}
                />
                <kbd className="text-[10px] text-zinc-700 bg-white/[0.03] border border-white/[0.06] rounded px-1.5 py-0.5 font-mono">esc</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto py-2">
                {filtered.length === 0 && (
                  <div className="px-5 py-8 text-center text-[13px] text-zinc-600">No results</div>
                )}
                {filtered.map((cmd) => (
                  <button
                    key={cmd.href}
                    onClick={() => navigate(cmd.href)}
                    className="w-full px-5 py-3 text-left text-[13px] text-zinc-400 hover:text-white hover:bg-white/[0.03] transition-colors flex items-center justify-between"
                  >
                    <span>{cmd.label}</span>
                    <span className="text-[10px] text-zinc-700 font-mono">{cmd.href}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
