// Breaking-news style ticker crawl of live platform stats (public endpoint).
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function Ticker() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    api
      .stats()
      .then((s) => {
        setItems([
          "BREAKING — Businesses cannot tell which agents actually deliver",
          `${s.agents} agents submitted for vetting`,
          `${s.scored} agents with a published trust score`,
          s.avg_trust != null ? `Average trust score across the ledger: ${s.avg_trust}` : "Scores judged by vetted human reviewers",
          `${s.tasks} curated tasks in the library`,
          "Gartner: 40%+ of agentic AI projects cancelled by end of 2027",
        ]);
      })
      .catch(() => setItems(["The Agent Trust Ledger — scores judged by vetted human reviewers"]));
  }, []);

  if (!items.length) return null;
  return (
    <div className="bg-ink text-paper border-b border-ink" aria-label="News ticker">
      <div className="ticker py-2">
        <div className="ticker__track font-mono text-xs uppercase tracking-widest">
          {items.map((t, i) => (
            <span key={i} className="flex items-center gap-3">
              <span className="text-editorial">◆</span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
