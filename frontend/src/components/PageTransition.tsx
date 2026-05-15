"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
        transition={{ 
          duration: 0.4, 
          ease: [0.22, 1, 0.36, 1] // Quart Out - very smooth
        }}
        className="w-full origin-top"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
