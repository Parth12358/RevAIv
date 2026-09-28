// Newsprint UI atoms.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

// Bare registrable domain from a full URL (drops protocol, www, path).
function domainFrom(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Agent logo pulled from the company's own domain, in a bordered newsprint
// frame. Tries the company logo, then the site favicon, then a serif monogram —
// so the frame is never empty, even if a source is blocked or slow to load.
export function AgentLogo({
  name,
  url,
  size = 44,
}: {
  name: string;
  url: string | null | undefined;
  size?: number;
}) {
  const domain = domainFrom(url);
  const sources = useMemo(
    () =>
      domain
        ? [
            `https://logo.clearbit.com/${domain}`,
            `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
          ]
        : [],
    [domain],
  );
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // If the current source stalls (never loads and never errors), move on.
  useEffect(() => {
    if (loaded || idx >= sources.length) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 4000);
    return () => clearTimeout(t);
  }, [idx, loaded, sources.length]);

  const box = "shrink-0 border border-ink bg-paper flex items-center justify-center overflow-hidden";
  const dims = { height: size, width: size };

  if (idx >= sources.length) {
    return (
      <div className={box} style={dims} aria-hidden>
        <span className="font-serif font-black leading-none text-ink" style={{ fontSize: size * 0.5 }}>
          {name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      </div>
    );
  }
  return (
    <div className={box} style={dims}>
      <img
        key={sources[idx]}
        src={sources[idx]}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="object-contain p-1.5"
        onLoad={() => setLoaded(true)}
        onError={() => setIdx((i) => i + 1)}
      />
    </div>
  );
}

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
    "font-sans uppercase tracking-widest text-xs font-semibold px-6 min-h-[44px] inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-40 disabled:cursor-not-allowed";
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
    "font-sans uppercase tracking-widest text-xs font-semibold px-6 min-h-[44px] inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial focus-visible:ring-offset-2 focus-visible:ring-offset-paper";
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

// ---- Newsprint form atoms ----
const fieldCls =
  "w-full border-b-2 border-ink bg-transparent px-3 py-2 font-mono text-sm focus:bg-[#F0F0F0] focus:outline-none";

export function Field({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <Label className="block mb-1">{label}</Label>}
      <input className={fieldCls} {...props} />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && <Label className="block mb-1">{label}</Label>}
      <select className={fieldCls} {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextArea({ label, ...props }: { label?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <Label className="block mb-1">{label}</Label>}
      <textarea className="w-full border-2 border-ink bg-transparent px-3 py-2 font-body text-sm focus:bg-[#F0F0F0] focus:outline-none" {...props} />
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`border border-ink bg-paper p-6 ${className}`}>{children}</div>;
}

// Small bordered/inverted tag (uppercase mono).
export function Tag({
  children,
  tone = "outline",
}: {
  children: ReactNode;
  tone?: "outline" | "solid" | "editorial";
}) {
  const styles = {
    outline: "border border-ink text-ink",
    solid: "bg-ink text-paper",
    editorial: "bg-editorial text-paper",
  }[tone];
  return (
    <span className={`inline-flex items-center px-2 py-1 font-mono text-[0.55rem] uppercase tracking-widest ${styles}`}>
      {children}
    </span>
  );
}
