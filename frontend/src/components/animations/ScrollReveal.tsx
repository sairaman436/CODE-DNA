"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  stagger?: number;
}

export function ScrollReveal({ 
  children, 
  className = "", 
  delay = 0, 
  y = 40,
  duration = 1,
  stagger = 0.1
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // We can either animate the container itself, or its immediate children
    const elements = containerRef.current.children.length > 1 
      ? containerRef.current.children 
      : containerRef.current;

    // Set initial state
    gsap.set(elements, { opacity: 0, y: y });

    gsap.to(elements, {
      y: 0,
      opacity: 1,
      duration: duration,
      stagger: stagger,
      ease: "power3.out",
      delay: delay,
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top bottom-=100px", 
        once: true,
      }
    });

    ScrollTrigger.refresh();
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
