// Spotlight overlay for the reviewer tour: dims the page, cuts a clickable hole
// around the current step's target, and shows a Newsprint tooltip. Advances
// reactively (never intercepts clicks) as the user performs the real action.
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTour } from "../lib/tour";
import { Button } from "./ui";

interface Rect { top: number; left: number; width: number; height: number; }
const DIM = "rgba(17,17,17,0.6)";
const PAD = 8;
const CARD_W = 320;

// Continuously tracks the target element (handles scroll, resize, DOM swaps).
function useTourTarget(target?: string): { rect: Rect | null; found: boolean | null } {
  const [rect, setRect] = useState<Rect | null>(null);
  const [found, setFound] = useState<boolean | null>(null);

  useEffect(() => {
    if (!target) { setRect(null); setFound(null); return; }
    let raf = 0;
    let cancelled = false;
    let scrolled = false;
    let ok = false;
    const start = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const loop = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement | null;
      if (el) {
        if (!scrolled) { el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); scrolled = true; }
        const r = el.getBoundingClientRect();
        setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
        if (!ok) { ok = true; setFound(true); }
      } else if (!ok && performance.now() - start > 3000) {
        setFound(false);
        setRect(null);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [target]);

  return { rect, found };
}

const strip = (s: CSSProperties): CSSProperties => ({ position: "fixed", background: DIM, pointerEvents: "auto", transition: "all 180ms ease-out", ...s });

export function TourOverlay() {
  const { step, active, total, skip, finish } = useTour();
  const { rect, found } = useTourTarget(step?.target);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") skip(); };
    if (active && step) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, step, skip]);

  useEffect(() => { if (step) cardRef.current?.focus(); }, [step?.id]);

  if (!active || !step) return null;

  const hasHole = !!rect && found === true;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Position the tooltip card near the hole (or centered as a fallback).
  let cardPos: CSSProperties;
  if (hasHole && rect) {
    const below = vh - (rect.top + rect.height) > 220 || rect.top < 160;
    const left = Math.min(Math.max(rect.left, 16), vw - CARD_W - 16);
    cardPos = below
      ? { top: rect.top + rect.height + 14, left }
      : { top: Math.max(16, rect.top - 14 - 180), left };
  } else {
    cardPos = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }

  const last = step.index === total;

  return createPortal(
    <div className="newsprint" style={{ position: "fixed", inset: 0, zIndex: 60 }}>
      {hasHole && rect ? (
        <>
          <div style={strip({ top: 0, left: 0, width: vw, height: Math.max(0, rect.top) })} onMouseDown={(e) => e.preventDefault()} />
          <div style={strip({ top: rect.top + rect.height, left: 0, width: vw, height: Math.max(0, vh - (rect.top + rect.height)) })} onMouseDown={(e) => e.preventDefault()} />
          <div style={strip({ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height })} onMouseDown={(e) => e.preventDefault()} />
          <div style={strip({ top: rect.top, left: rect.left + rect.width, width: Math.max(0, vw - (rect.left + rect.width)), height: rect.height })} onMouseDown={(e) => e.preventDefault()} />
          <div style={{ position: "fixed", top: rect.top, left: rect.left, width: rect.width, height: rect.height, border: "2px solid #CC0000", pointerEvents: "none", transition: "all 180ms ease-out" }} />
        </>
      ) : (
        <div style={{ position: "fixed", inset: 0, background: DIM }} />
      )}

      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="false"
        aria-label={`Tour step ${step.index} of ${total}`}
        className="border border-ink bg-paper p-5 shadow-[6px_6px_0_0_#111] focus:outline-none"
        style={{ position: "fixed", width: Math.min(CARD_W, vw - 32), pointerEvents: "auto", zIndex: 61, ...cardPos }}
      >
        <span className="label text-editorial text-[0.6rem]">Step {step.index} of {total}</span>
        <div className="mt-1 font-serif font-bold text-xl leading-tight">{step.title}</div>
        <p className="mt-2 font-body text-sm text-neutral-700 leading-relaxed" aria-live="polite">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button onClick={skip} className="label text-[0.6rem] text-neutral-500 hover:text-editorial transition-colors">Skip tour</button>
          {last ? (
            <Button onClick={finish}>Done</Button>
          ) : (
            <span className="font-mono text-[0.6rem] text-neutral-400 uppercase tracking-widest">Do the highlighted step →</span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
