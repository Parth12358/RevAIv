import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type DirectoryAgent } from "../lib/api";
import { Label, LinkButton, ScoreBadge, Ornament } from "../components/ui";

const SORTS = [
  { key: "trust", label: "Trust" },
  { key: "cost", label: "Cost" },
  { key: "speed", label: "Speed" },
];

export default function Directory() {
  const [agents, setAgents] = useState<DirectoryAgent[]>([]);
  const [sort, setSort] = useState("trust");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.directory(sort).then((r) => setAgents(r.agents)).finally(() => setLoading(false));
  }, [sort]);

  const lead = agents[0];

  return (
    <div>
      {/* Hero */}
      <section className="newsprint-texture border-b-4 border-ink py-10 lg:py-16">
        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-12 lg:col-span-8 lg:border-r border-ink lg:pr-10">
            <Label className="text-editorial">Breaking · The Trust Problem</Label>
            <h1 className="mt-4 font-serif font-black tracking-tighter leading-[0.9] text-5xl sm:text-6xl lg:text-8xl">
              A Costco membership for AI agents.
            </h1>
            <p className="drop-cap mt-6 font-body text-lg leading-relaxed text-neutral-700 max-w-2xl text-justify">
              Businesses cannot tell which agents actually deliver. We publish a single trust
              score — quality, cost and speed — for a specific kind of task, grounded in the
              judgment of vetted human reviewers and re-tested on every agent update. Browse
              agents we have already vetted, or submit one you are considering.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LinkButton to="/submit">Submit an Agent</LinkButton>
              <LinkButton to="/reviewer" variant="secondary">Become a Reviewer</LinkButton>
            </div>
          </div>
          {/* Lead story: top-ranked agent */}
          <div className="col-span-12 lg:col-span-4 mt-8 lg:mt-0 lg:pl-10">
            <Label>Top of the Ledger</Label>
            {lead ? (
              <Link to={`/agents/${lead.id}`} className="block mt-4 group">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-serif font-bold text-3xl leading-tight group-hover:text-editorial transition-colors">
                    {lead.name}
                  </h2>
                  <ScoreBadge trust={lead.trust} confidence={lead.confidence} size="md" />
                </div>
                <p className="mt-3 font-mono text-xs uppercase tracking-widest text-neutral-500">
                  {lead.adapter_type.replace("_", " ")} · {lead.category.replace("_", " ")}
                </p>
              </Link>
            ) : (
              <p className="mt-4 font-body text-neutral-500">No agents scored yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* Sort controls */}
      <div className="flex items-center justify-between py-6 border-b border-ink">
        <Label>The Directory · Lead Research</Label>
        <div className="flex items-center gap-4">
          <span className="label text-[0.6rem] text-neutral-500">Rank by</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`label text-[0.7rem] transition-colors ${
                sort === s.key ? "text-editorial underline decoration-2 decoration-editorial underline-offset-4" : "hover:text-editorial"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Agent grid — collapsed borders */}
      {loading ? (
        <p className="py-16 text-center font-mono text-sm text-neutral-500">Setting type…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-ink">
          {agents.map((a) => (
            <Link
              key={a.id}
              to={`/agents/${a.id}`}
              className="group border-r border-b border-ink p-6 hover:bg-neutral-100 transition-colors flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="font-serif font-bold text-2xl leading-tight group-hover:text-editorial transition-colors">
                    {a.name}
                  </h3>
                  <ScoreBadge trust={a.trust} confidence={a.confidence} size="sm" />
                </div>
                {a.flagged_drop === 1 && (
                  <span className="inline-block mt-3 bg-editorial text-paper label text-[0.55rem] px-2 py-1">
                    Score dropped 10+
                  </span>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
                <span>{a.adapter_type.replace("_", " ")}</span>
                <span className="group-hover:text-editorial">Read →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Ornament />
    </div>
  );
}
