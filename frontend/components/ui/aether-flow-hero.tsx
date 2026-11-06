"use client";

/**
 * Aether Flow-inspired interactive particle hero, adapted for KMITL Marketplace.
 * Uses a Hero-scoped canvas and respects reduced-motion preferences.
 */
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

type Particle = { x: number; y: number; vx: number; vy: number; radius: number };

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    if (!canvas || !hero) return;

    // Reduced motion should not skip setup: show a still particle field instead.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let particles: Particle[] = [];
    let width = 1;
    let height = 1;
    let visible = true;
    let lastFrameTime = 0;
    const pointer = { x: -10000, y: -10000 };

    function setup() {
      if (!canvas || !hero || !ctx) return;
      const bounds = hero.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(105, Math.max(30, Math.round(width * height / 13500)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.85,
        vy: (Math.random() - 0.5) * 0.85,
        radius: 1.2 + Math.random() * 1.45,
      }));
    }

    function draw(now: number) {
      if (!ctx) return;
      if (!reduceMotion) frameId = window.requestAnimationFrame(draw);
      if (!visible || (!reduceMotion && now - lastFrameTime < 1000 / 45)) return;
      const step = lastFrameTime ? Math.min((now - lastFrameTime) / 16.67, 2) : 1;
      lastFrameTime = now;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (!reduceMotion) {
          p.x += p.vx * step;
          p.y += p.vy * step;
          if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
          if (p.x > width) { p.x = width; p.vx = -Math.abs(p.vx); }
          if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
          if (p.y > height) { p.y = height; p.vy = -Math.abs(p.vy); }
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0.01 && distance < 160) {
            const force = (1 - distance / 160) * 2.4 * step;
            p.x -= (dx / distance) * force;
            p.y -= (dy / distance) * force;
          }
        }
      }

      // Lines are intentionally more visible than the original version.
      const connectionRadius = width < 640 ? 130 : 175;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > connectionRadius * connectionRadius) continue;
          const proximity = 1 - Math.sqrt(distanceSq) / connectionRadius;
          const hover = Math.hypot(a.x - pointer.x, a.y - pointer.y) < 180;
          ctx.strokeStyle = hover
            ? `rgba(255,228,196,${(proximity * 0.85).toFixed(3)})`
            : `rgba(255,140,66,${(proximity * 0.65).toFixed(3)})`;
          ctx.lineWidth = hover ? 1.2 : 0.85;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of particles) {
        ctx.fillStyle = "rgba(255,183,77,0.95)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }
    function onPointerLeave() { pointer.x = -10000; pointer.y = -10000; }
    function onVisibilityChange() {
      visible = !document.hidden;
      lastFrameTime = 0;
      if (reduceMotion && visible) draw(performance.now());
    }

    const resizeObserver = new ResizeObserver(() => {
      setup();
      if (reduceMotion) draw(performance.now());
    });
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && !document.hidden;
      lastFrameTime = 0;
      if (reduceMotion && visible) draw(performance.now());
    });
    resizeObserver.observe(hero);
    intersectionObserver.observe(hero);
    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibilityChange);
    setup();
    if (reduceMotion) {
      draw(performance.now()); // static drawing, no animation loop
    } else {
      frameId = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] h-full w-full" />;
}

export default function AetherFlowHero() {
  const reducedMotion = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.75, delay, ease: "easeOut" as const },
  });

  return <section className="relative isolate overflow-hidden bg-[#140d08] text-white">
    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_5%,rgba(255,140,66,.28),transparent_57%)]" />
    <ParticleField />
    <div className="relative z-10 mx-auto flex min-h-[550px] max-w-[1240px] flex-col items-center justify-center px-5 py-24 text-center md:min-h-[620px]">
      <motion.div {...rise(0.05)} className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-white/[.06] px-4 py-2 text-xs font-medium tracking-wide text-orange-100 backdrop-blur-xl">
        <Sparkles size={14} className="text-orange-300" /> CAMPUS MARKETPLACE · KMITL
      </motion.div>
      <motion.h1 {...rise(0.17)} className="max-w-[940px] text-[clamp(3.2rem,8vw,7.25rem)] font-semibold leading-[1.08] tracking-[-.07em]">
        Good things. <span className="bg-gradient-to-r from-[#ffd1a1] via-[#ff9a57] to-[#ffe3c2] bg-clip-text text-transparent">New stories.</span>
      </motion.h1>
      <motion.p {...rise(0.29)} className="mt-8 max-w-[620px] text-base leading-8 text-[#e6c7ad] md:text-lg">
        ส่งต่อของดีให้คนใกล้ตัว ซื้อขายหนังสือ ไอเท็ม และของใช้ในรั้ว สจล. อย่างง่ายดาย ผ่านชุมชนที่ยืนยันตัวตนได้
      </motion.p>
      <motion.div {...rise(0.41)} className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <a href="#browse" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#2a1608] shadow-[0_12px_35px_rgba(0,0,0,.2)] transition hover:bg-orange-100">เลือกดูสินค้า <ArrowUpRight size={18} /></a>
        <Link href="/sell" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[.06] px-7 py-3.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/15">เริ่มลงขาย <ArrowUpRight size={17} /></Link>
      </motion.div>
      <motion.div {...rise(0.5)} className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs tracking-wide text-orange-100/65">
        <span className="inline-flex items-center gap-2"><ShieldCheck size={15} /> ยืนยันตัวตนด้วยอีเมลสถาบัน</span>
        <span>• นัดรับสะดวกใน KMITL</span><span>• ส่งต่ออย่างคุ้มค่า</span>
      </motion.div>
      <a href="#browse" aria-label="เลื่อนลงไปดูสินค้า" className="absolute bottom-7 rounded-full border border-white/15 p-2 text-white/60 hover:text-white"><ArrowDownRight size={17} /></a>
    </div>
  </section>;
}
