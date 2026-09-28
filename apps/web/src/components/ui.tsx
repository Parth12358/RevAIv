// Newsprint UI atoms.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`label text-ink/70 ${className}`}>{children}</span>;
}

// Primary/secondary buttons with color-inversion hover.
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "font-sans uppercase tracking-widest text-xs font-semibold px-6 min-h-[44px] inline-flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-ink text-paper border border-transparent hover:bg-paper hover:text-ink hover:border-ink",
    secondary: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
    ghost: "text-ink hover:bg-divider",
  }[variant];
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function LinkButton({
  to,
  children,
  variant = "primary",
}: {
  to: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "font-sans uppercase tracking-widest text-xs font-semibold px-6 min-h-[44px] inline-flex items-center justify-center transition-all duration-200";
  const styles = {
    primary: "bg-ink text-paper border border-transparent hover:bg-paper hover:text-ink hover:border-ink",
    secondary: "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
  }[variant];
  return (
    <Link to={to} className={`${base} ${styles}`}>
      {children}
    </Link>
  );
}

// Trust score badge — big monospace number in a bordered box, with confidence.
export function ScoreBadge({
  trust,
  confidence,
  size = "md",
}: {
  trust: number | null;
  confidence: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dims = {
    sm: "h-14 w-14 text-xl",
    md: "h-20 w-20 text-3xl",
    lg: "h-28 w-28 text-5xl",
  }[size];
  if (trust == null) {
    return (
      <div className={`${dims} border border-ink/30 flex items-center justify-center font-mono text-ink/40`}>
        —
      </div>
    );
  }
  const tone = trust >= 70 ? "bg-ink text-paper" : trust >= 50 ? "bg-transparent text-ink border-ink" : "bg-transparent text-editorial border-editorial";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${dims} ${tone} border-2 flex items-center justify-center font-mono font-medium`}>
        {Math.round(trust)}
      </div>
      {confidence && <span className="label text-[0.6rem] text-neutral-500">{confidence}</span>}
    </div>
  );
}

export function Ornament() {
  return (
    <div className="py-8 text-center font-serif text-2xl text-neutral-400 tracking-[1em]" aria-hidden>
      ✧ ✧ ✧
    </div>
  );
}

export function Meter({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : (value / 10) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label className="text-[0.6rem]">{label}</Label>
        <span className="font-mono text-sm">{value == null ? "—" : value.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-2 border border-ink">
        <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
