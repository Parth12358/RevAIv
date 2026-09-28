// Headline crawl of real reporting on AI-agent trust, mixed with one live
// platform stat. Headlines link to the source articles.
import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Item {
  text: string;
  url?: string;
}

// Curated from current reporting on AI-agent trust & enterprise adoption.
const ARTICLES: Item[] = [
  { text: "HBR: To adopt AI at scale, employees need to trust agents", url: "https://hbr.org/2026/09/to-adopt-ai-at-scale-employees-need-to-trust-agents" },
  { text: "88% of organizations hit at least one AI-agent security breach in the past year", url: "https://enterprisedna.co/resources/news/temporal-2026-state-development-ai-agents-engineers-daily-use/" },
  { text: "AI-agent daily use hits 80% as enterprise reliability lags", url: "https://enterprisedna.co/resources/news/temporal-2026-state-development-ai-agents-engineers-daily-use/" },
  { text: "AvePoint — State of AI 2026: Trust, Control, and the Rise of AI Agents", url: "https://www.avepoint.com/blog/manage/state-of-ai-2026-report" },
  { text: "Research names trust a critical barrier to agentic AI in the enterprise", url: "https://www.prnewswire.com/news-releases/chapsvision-research-identifies-agentic-knowledge-layer-and-trust-as-critical-barriers-to-agentic-ai-adoption-in-the-enterprise-302778708.html" },
  { text: "Only ~10% of enterprises have moved agentic AI past pilot into production", url: "https://writer.com/blog/enterprise-ai-adoption-2026/" },
  { text: "Gartner: 40%+ of agentic AI projects will be cancelled by end of 2027", url: "https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027" },
];

export function Ticker() {
  const [items, setItems] = useState<Item[]>(ARTICLES);

  useEffect(() => {
    api
      .stats()
      .then((s) => {
        const live: Item[] = [{ text: `${s.scored} agents with a published trust score on this ledger` }];
        // interleave one live stat near the front
        setItems([ARTICLES[0], ...live, ...ARTICLES.slice(1)]);
      })
      .catch(() => setItems(ARTICLES));
  }, []);

  return (
    <div className="bg-ink text-paper border-b border-ink" aria-label="Headlines on AI-agent trust">
      <div className="ticker py-2">
        <div className="ticker__track font-mono text-xs uppercase tracking-widest">
          {items.map((it, i) =>
            it.url ? (
              <a key={i} href={it.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-editorial transition-colors">
                <span className="text-editorial">◆</span>
                {it.text}
              </a>
            ) : (
              <span key={i} className="flex items-center gap-3">
                <span className="text-editorial">◆</span>
                {it.text}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
