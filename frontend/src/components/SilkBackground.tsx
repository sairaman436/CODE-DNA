"use client";

import React, { useEffect, useRef } from "react";

interface SilkBackgroundProps {
  color?: string;
}

export const SilkBackground: React.FC<SilkBackgroundProps> = ({ color = "#1c1c22" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const threads: Thread[] = [];
    const threadCount = 40;

    class Thread {
      x: number;
      y: number;
      phase: number;
      speed: number;
      amplitude: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 0.002 + Math.random() * 0.005;
        this.amplitude = 50 + Math.random() * 100;
        this.color = `rgba(161, 161, 170, ${0.12 + Math.random() * 0.18})`; // Use zinc-400 color with higher opacity
      }

      draw() {
        this.phase += this.speed;
        const xOffset = Math.sin(this.phase) * this.amplitude;

        ctx!.beginPath();
        ctx!.strokeStyle = this.color;
        ctx!.lineWidth = 1.6;
        
        // Draw a long, flowing curve
        ctx!.moveTo(this.x + xOffset, -100);
        ctx!.bezierCurveTo(
          this.x - xOffset * 2, height * 0.3,
          this.x + xOffset * 2, height * 0.6,
          this.x - xOffset, height + 100
        );
        ctx!.stroke();
      }
    }

    for (let i = 0; i < threadCount; i++) {
      threads.push(new Thread());
    }

    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);

      threads.forEach((t) => t.draw());
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: color }}
    />
  );
};
