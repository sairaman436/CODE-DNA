"use client";

import { useEffect, useRef } from "react";

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#ffffff", "#818cf8"];
    const particles: {
      x: number; y: number; r: number; d: number;
      color: string; tilt: number; tiltAngle: number;
      tiltAngleInc: number; vx: number; vy: number;
    }[] = [];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 2,
        d: Math.random() * 120,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleInc: Math.random() * 0.07 + 0.05,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 3 + 2,
      });
    }

    let frame = 0;
    const maxFrames = 180;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
        ctx.moveTo(p.x + p.tilt + p.r, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
      }

      for (const p of particles) {
        p.tiltAngle += p.tiltAngleInc;
        p.y += p.vy;
        p.x += p.vx;
        p.tilt = Math.sin(p.tiltAngle) * 12;
      }

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(draw);
      }
    }

    draw();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
