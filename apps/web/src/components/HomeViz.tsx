// Small, honest data visuals for the home page, in the Newsprint style.
// Forms chosen by job: a 0–100 hero scale for the average score (a number only
// means something against its range), and a 10×10 waffle for the "most projects
// fail" proportion (40 out of 100 reads instantly). Colors validated with the
// dataviz palette script; ink hairlines + direct labels supply the legibility
// relief the neutral fill needs.

// Average trust score as a number plus a 0–100 bar, so "90" clearly means 90/100.
export function TrustScale({ value }: { value: number | null | undefined }) {
  const v = value == null ? null : Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="label text-[0.6rem] text-neutral-500">Average trust score</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-6xl lg:text-7xl leading-none">{v ?? "—"}</span>
        <span className="font-mono text-2xl text-neutral-400">/100</span>
      </div>
      <div className="mt-3 h-3 border border-ink bg-neutral-100 relative" role="img" aria-label={v == null ? "no score yet" : `${v} out of 100`}>
        {v != null && <div className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${v}%` }} />}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.55rem] text-neutral-500">
        <span>0</span>
        <span>100 = perfect</span>
      </div>
      <p className="mt-2 font-body text-xs text-neutral-600 leading-snug">Average across every agent that has a score. Higher is better.</p>
    </div>
  );
}

// One number with a plain caption.
export function StatTile({ label, value, hint }: { label: string; value: number | null | undefined; hint: string }) {
  return (
    <div className="border-r border-b border-ink p-4">
      <div className="label text-[0.55rem] text-neutral-500">{label}</div>
      <div className="mt-1 font-mono text-4xl">{value ?? "—"}</div>
      <div className="mt-1 font-body text-xs text-neutral-500 leading-snug">{hint}</div>
    </div>
  );
}

// 10×10 grid: `filled` of 100 cells emphasized in editorial red.
export function Waffle({ filled }: { filled: number }) {
  const n = Math.max(0, Math.min(100, Math.round(filled)));
  return (
    <div>
      <div
        className="grid grid-cols-10 gap-[2px] w-max"
        role="img"
        aria-label={`${n} out of every 100`}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border ${i < n ? "bg-editorial border-editorial" : "bg-neutral-200 border-neutral-400"}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[0.62rem] uppercase tracking-widest">
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-editorial inline-block" /> Get cancelled ({n})</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-neutral-200 border border-neutral-400 inline-block" /> The rest ({100 - n})</span>
      </div>
    </div>
  );
}
