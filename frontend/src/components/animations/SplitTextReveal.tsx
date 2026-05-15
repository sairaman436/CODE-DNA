"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  triggerOnScroll?: boolean;
}

export function SplitTextReveal({ text, className = "", delay = 0, triggerOnScroll = true }: SplitTextRevealProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);

  const words = text.split(/(\n| )/).filter(w => w !== " ");

  useGSAP(() => {
    if (!containerRef.current) return;

    const chars = containerRef.current.querySelectorAll('.char');

    // Set initial state via GSAP
    gsap.set(chars, { 
      opacity: 0, 
      y: 40, 
      rotateX: -40, 
      filter: "blur(12px)" 
    });

    const targetConfig = {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: "blur(0px)",
      stagger: 0.02,
      duration: 1,
      ease: "power3.out",
      delay: delay
    };

    if (triggerOnScroll) {
      gsap.to(chars, {
        ...targetConfig,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 90%",
          once: true,
        }
      });
    } else {
      gsap.to(chars, targetConfig);
    }
    
    ScrollTrigger.refresh();
  }, { scope: containerRef, dependencies: [delay, triggerOnScroll] });

  return (
    <h1 ref={containerRef} className={`${className} perspective-[1000px] relative`}>
      {words.map((word, wordIndex) => {
        if (word === '\n') {
          return <br key={wordIndex} />;
        }
        return (
          <span key={wordIndex} className="inline-block mr-[0.25em] whitespace-nowrap overflow-visible">
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="char inline-block transform-origin-bottom">
                {char}
              </span>
            ))}
          </span>
        );
      })}
    </h1>
  );
}
