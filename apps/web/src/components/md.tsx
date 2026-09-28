// Material You (MD3) UI atoms — pill buttons, tonal cards, filled fields,
// chips, and atmospheric blur shapes. Used across the internal platform.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type BtnVariant = "filled" | "tonal" | "outlined" | "text" | "tertiary";
const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-roboto font-medium text-sm tracking-[0.01em] px-6 h-10 md-ease transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
const btnStyles: Record<BtnVariant, string> = {
  filled: "bg-md-primary text-md-on-primary hover:bg-md-primary/90 hover:shadow-md",
  tertiary: "bg-md-tertiary text-white hover:bg-md-tertiary/90 hover:shadow-md",
  tonal: "bg-md-secondary-container text-md-on-secondary-container hover:shadow-md hover:brightness-[0.98]",
  outlined: "border border-md-outline text-md-primary hover:bg-md-primary/5",
  text: "text-md-primary hover:bg-md-primary/10",
};

export function MdButton({
  children,
  variant = "filled",
  className = "",
  ...props
}: { children: ReactNode; variant?: BtnVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${btnBase} ${btnStyles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function MdLinkButton({
  to,
  children,
  variant = "filled",
  className = "",
}: {
  to: string;
  children: ReactNode;
  variant?: BtnVariant;
  className?: string;
}) {
  return (
    <Link to={to} className={`${btnBase} ${btnStyles[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function MdCard({
  children,
  className = "",
  interactive = false,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "section";
}) {
  const Cmp = as;
  return (
    <Cmp
      className={`bg-md-surface rounded-3xl p-6 shadow-sm md-ease transition-all duration-300 ${
        interactive ? "hover:shadow-md hover:scale-[1.02] cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </Cmp>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "primary" | "success" | "error" }) {
  const styles = {
    neutral: "bg-md-surface-low text-md-on-variant",
    primary: "bg-md-primary-container text-md-on-primary-container",
    success: "bg-[#DCEFDD] text-md-success",
    error: "bg-md-error-container text-md-error",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-roboto font-medium ${styles}`}>
      {children}
    </span>
  );
}

export function FilledField({
  label,
  ...props
}: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <span className="block mb-1 ml-1 text-sm font-roboto text-md-on-variant">{label}</span>}
      <input className="md-field" {...props} />
    </label>
  );
}

export function FilledSelect({
  label,
  children,
  ...props
}: { label?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      {label && <span className="block mb-1 ml-1 text-sm font-roboto text-md-on-variant">{label}</span>}
      <select className="md-field" {...props}>
        {children}
      </select>
    </label>
  );
}

// Decorative atmospheric background (signature MD3 blur shapes).
export function Blobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="md-blob bg-md-primary w-[28rem] h-[28rem] -top-32 -left-24" />
      <div className="md-blob bg-md-tertiary w-[24rem] h-[24rem] top-40 -right-24" />
      <div className="md-blob bg-md-secondary-container w-[20rem] h-[20rem] bottom-0 left-1/3 opacity-40" />
    </div>
  );
}

// Circular MD3 score ring for the internal platform.
export function MdScore({ trust, confidence }: { trust: number | null; confidence?: string | null }) {
  if (trust == null)
    return <div className="h-16 w-16 rounded-full bg-md-surface-low flex items-center justify-center font-roboto text-md-on-variant">—</div>;
  const tone = trust >= 70 ? "bg-md-primary text-white" : trust >= 50 ? "bg-md-tertiary-container text-md-tertiary" : "bg-md-error-container text-md-error";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-16 w-16 rounded-full ${tone} flex items-center justify-center font-roboto font-medium text-2xl shadow-sm`}>
        {Math.round(trust)}
      </div>
      {confidence && <span className="text-[0.65rem] font-roboto text-md-on-variant capitalize">{confidence}</span>}
    </div>
  );
}
