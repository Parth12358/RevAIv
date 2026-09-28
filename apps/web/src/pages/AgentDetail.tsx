import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Label, Meter, ScoreBadge, Ornament } from "../components/ui";

export default function AgentDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.agent>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.agent(id).then(setData).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <p className="py-16 font-mono text-sm text-editorial">{err}</p>;
  if (!data) return <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading…</p>;

  const { agent, versions, scores, baselines } = data;
  const latest = scores[0];
  const baseline = baselines[0]?.human_baseline_json
    ? (JSON.parse(baselines[0].human_baseline_json) as { cost_usd: number; duration_ms: number })
    : null;

  return (
    <article className="py-8">
      <Link to="/" className="label text-[0.65rem] hover:text-editorial">← Back to Directory</Link>

      {/* Headline block */}
      <header className="mt-4 border-b-4 border-ink pb-8 grid grid-cols-12 gap-0">
        <div className="col-span-12 lg:col-span-8 lg:border-r border-ink lg:pr-8">
          <Label className="text-editorial">Agent Dossier · {agent.category?.replace("_", " ")}</Label>
          <h1 className="mt-3 font-serif font-black tracking-tighter leading-[0.92] text-5xl lg:text-7xl">
            {agent.name}
          </h1>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-neutral-500">
            {agent.adapter_type?.replace("_", " ")}
            {agent.owner_url ? ` · ${new URL(agent.owner_url).hostname}` : ""}
          </p>
          {latest?.flagged_drop === 1 && (
            <span className="inline-block mt-4 bg-editorial text-paper label text-[0.6rem] px-3 py-1">
              Score dropped 10+ points on last re-test
            </span>
          )}
        </div>
        <div className="col-span-12 lg:col-span-4 mt-6 lg:mt-0 lg:pl-8 flex items-center justify-center">
          <ScoreBadge trust={latest?.trust ?? null} confidence={latest?.confidence ?? null} size="lg" />
        </div>
      </header>

      {/* Breakdown */}
      <section className="grid grid-cols-12 gap-0 border-b border-ink">
        <div className="col-span-12 lg:col-span-5 py-8 lg:border-r border-ink lg:pr-8">
          <Label>The Score, Broken Down</Label>
          {latest ? (
            <div className="mt-5 space-y-5">
              <Meter label="Quality (60%)" value={latest.quality} />
              <Meter label="Cost (20%)" value={latest.cost} />
              <Meter label="Speed (20%)" value={latest.speed} />
              <p className="pt-3 font-mono text-[0.7rem] text-neutral-500 leading-relaxed">
                Trust = 10 × (0.6·Q + 0.2·C + 0.2·S) = {Math.round(latest.trust)} ·
                Confidence {latest.confidence} · {latest.reviewed_tasks} tasks reviewed
              </p>
            </div>
          ) : (
            <p className="mt-4 font-body text-neutral-500">
              Not yet scored — needs at least 5 reviewed tasks to publish.
            </p>
          )}
        </div>

        {/* Human baseline (P1) */}
        <div className="col-span-12 lg:col-span-7 py-8 lg:pl-8">
          <Label>Agent vs. Human Baseline</Label>
          {baseline && latest ? (
            <div className="mt-5 grid grid-cols-2 border-l border-t border-ink font-mono text-sm">
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.6rem] text-neutral-500">Human · cost / task</div>
                <div className="text-2xl mt-1">${baseline.cost_usd.toFixed(2)}</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.6rem] text-neutral-500">Human · time / task</div>
                <div className="text-2xl mt-1">{Math.round(baseline.duration_ms / 60000)}m</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.6rem] text-neutral-500">Agent · cost score</div>
                <div className="text-2xl mt-1">{latest.cost.toFixed(1)}/10</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.6rem] text-neutral-500">Agent · speed score</div>
                <div className="text-2xl mt-1">{latest.speed.toFixed(1)}/10</div>
              </div>
            </div>
          ) : (
            <p className="mt-4 font-body text-neutral-500">No human baseline on file for this category.</p>
          )}
        </div>
      </section>

      {/* History: versions + score history */}
      <section className="grid grid-cols-12 gap-0">
        <div className="col-span-12 lg:col-span-6 py-8 lg:border-r border-ink lg:pr-8">
          <Label>Version History</Label>
          <ul className="mt-4 divide-y divide-divider">
            {versions.map((v) => (
              <li key={v.id} className="py-3 flex items-center justify-between font-mono text-xs">
                <span className="uppercase tracking-widest">{v.version_label ?? "—"}</span>
                <span className="text-neutral-500">{v.config_hash?.slice(0, 10)}</span>
                <span className="text-neutral-500">{(v.detected_at ?? "").slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-12 lg:col-span-6 py-8 lg:pl-8">
          <Label>Score History</Label>
          <ul className="mt-4 divide-y divide-divider">
            {scores.length ? scores.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between font-mono text-xs">
                <span className="text-2xl font-medium">{Math.round(s.trust)}</span>
                <span className="uppercase tracking-widest text-neutral-500">{s.confidence}</span>
                {s.flagged_drop === 1 && <span className="text-editorial">▼ drop</span>}
                <span className="text-neutral-500">{(s.computed_at ?? "").slice(0, 10)}</span>
              </li>
            )) : <li className="py-3 font-body text-neutral-500">No scores recorded.</li>}
          </ul>
        </div>
      </section>

      <Ornament />
    </article>
  );
}
