import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Label, Meter, ScoreBadge, Ornament, LinkButton, Tag } from "../components/ui";
import { TeX } from "../components/TeX";

// Adapter-specific setup guidance shown on the dossier.
const ADAPTER_SETUP: Record<string, { how: string; steps: string[] }> = {
  claude_wrapper: {
    how: "Runs on the Claude API — a prompt/tooling wrapper around an Anthropic model.",
    steps: [
      "Create an Anthropic API key at console.anthropic.com.",
      "Point the wrapper at the model and paste your key into its config.",
      "Send the field task as the user message; capture the reply as the output.",
    ],
  },
  http: {
    how: "Exposes an HTTP API you call with the task prompt.",
    steps: [
      "Sign up with the provider and generate an API key.",
      "POST the task prompt to the provider's endpoint with your key in the Authorization header.",
      "Read the response body as the agent's output.",
    ],
  },
  mcp: {
    how: "Runs as an MCP server that an MCP-capable client connects to.",
    steps: [
      "Install the server and add it to your MCP client's config.",
      "Authenticate if the server requires a key or OAuth.",
      "Call the relevant tool with the task prompt; capture the tool result.",
    ],
  },
  brainbase: {
    how: "Hosted as a Brainbase worker (a scripted agent harness).",
    steps: [
      "Open the worker in Brainbase and note its harness + model.",
      "Trigger a run with the task prompt as input.",
      "Collect the worker's final output.",
    ],
  },
  manual: {
    how: "Run the tool yourself and record the result.",
    steps: [
      "Open the provider and start the task from the brief.",
      "Let it finish, then copy the deliverable it produces.",
      "Paste that output back in as the run to be reviewed.",
    ],
  },
};

export default function AgentDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Awaited<ReturnType<typeof api.agent>> | null>(null);
  const [gate, setGate] = useState<"login" | "paywall" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.agent(id).then(setData).catch((e) => {
      if (e instanceof ApiError && e.status === 401) setGate("login");
      else if (e instanceof ApiError && (e.status === 402 || e.paywall)) setGate("paywall");
      else setErr(e.message);
    });
  }, [id]);

  if (gate)
    return (
      <section className="py-20 text-center">
        <Label className="text-editorial">{gate === "login" ? "Members Only" : "Subscription Required"}</Label>
        <h1 className="mt-3 font-serif font-black text-5xl">{gate === "login" ? "Sign in to read this dossier." : "Subscribe to read this dossier."}</h1>
        <div className="mt-6 flex justify-center gap-4">
          {gate === "login" ? <LinkButton to="/login">Sign in</LinkButton> : <LinkButton to="/account">Subscribe</LinkButton>}
          <LinkButton to="/directory" variant="secondary">Back to Directory</LinkButton>
        </div>
      </section>
    );
  if (err) return <p className="py-16 font-mono text-sm text-editorial">{err}</p>;
  if (!data) return <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading…</p>;

  const { agent, versions, scores, baselines, reviews, score_explain } = data as any;
  const latest = scores[0];
  const baseline = baselines[0]?.human_baseline_json
    ? (JSON.parse(baselines[0].human_baseline_json) as { cost_usd: number; duration_ms: number })
    : null;

  return (
    <article className="py-8">
      <Link to="/directory" className="label text-[0.65rem] hover:text-editorial">← Back to Directory</Link>

      <header className="mt-4 border-b-4 border-ink pb-8 grid grid-cols-12 gap-0">
        <div className="col-span-12 lg:col-span-8 lg:border-r border-ink lg:pr-8">
          <Label className="text-editorial">Agent Dossier · {agent.category?.replace(/_/g, " ")}</Label>
          <h1 className="mt-3 font-serif font-black tracking-tighter leading-[0.92] text-5xl lg:text-7xl">{agent.name}</h1>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-neutral-500">
            {agent.adapter_type?.replace(/_/g, " ")}
            {agent.owner_url ? ` · ${new URL(agent.owner_url).hostname}` : ""}
          </p>
          {latest?.flagged_drop === 1 && (
            <span className="inline-block mt-4 bg-editorial text-paper label text-[0.6rem] px-3 py-1">Score dropped 10+ points on last re-test</span>
          )}
        </div>
        <div className="col-span-12 lg:col-span-4 mt-6 lg:mt-0 lg:pl-8 flex items-center justify-center">
          <ScoreBadge trust={latest?.trust ?? null} confidence={latest?.confidence ?? null} size="lg" />
        </div>
      </header>

      {/* Breakdown + baseline */}
      <section className="grid grid-cols-12 gap-0 border-b border-ink">
        <div className="col-span-12 lg:col-span-5 py-8 lg:border-r border-ink lg:pr-8">
          <Label>The Score, Broken Down</Label>
          {latest ? (
            <div className="mt-5 space-y-5">
              <Meter label="Quality (60%)" value={latest.quality} />
              <Meter label="Cost (20%)" value={latest.cost} />
              <Meter label="Speed (20%)" value={latest.speed} />
              <p className="pt-3 font-mono text-[0.7rem] text-neutral-500 leading-relaxed">
                Trust = 10 × (0.6·Q + 0.2·C + 0.2·S) = {Math.round(latest.trust)} · Confidence {latest.confidence} · {latest.reviewed_tasks} tasks reviewed
              </p>
            </div>
          ) : (
            <p className="mt-4 font-body text-neutral-500">Not yet scored. Needs at least 5 reviewed tasks to publish.</p>
          )}
        </div>
        <div className="col-span-12 lg:col-span-7 py-8 lg:pl-8">
          <Label>Agent vs. Human Baseline</Label>
          {baseline && latest ? (
            <div className="mt-5 grid grid-cols-2 border-l border-t border-ink font-mono text-sm">
              <div className="border-r border-b border-ink p-4"><div className="label text-[0.6rem] text-neutral-500">Human · cost / task</div><div className="text-2xl mt-1">${baseline.cost_usd.toFixed(2)}</div></div>
              <div className="border-r border-b border-ink p-4"><div className="label text-[0.6rem] text-neutral-500">Human · time / task</div><div className="text-2xl mt-1">{Math.round(baseline.duration_ms / 60000)}m</div></div>
              <div className="border-r border-b border-ink p-4"><div className="label text-[0.6rem] text-neutral-500">Agent · cost score</div><div className="text-2xl mt-1">{latest.cost.toFixed(1)}/10</div></div>
              <div className="border-r border-b border-ink p-4"><div className="label text-[0.6rem] text-neutral-500">Agent · speed score</div><div className="text-2xl mt-1">{latest.speed.toFixed(1)}/10</div></div>
            </div>
          ) : (
            <p className="mt-4 font-body text-neutral-500">No human baseline on file for this field.</p>
          )}
        </div>
      </section>

      {/* Methodology — the score, fully traceable to its inputs (PRD §202) */}
      {latest && (() => {
        const q = latest.quality as number, cScore = latest.cost as number, s = latest.speed as number;
        const ex = score_explain ?? {};
        const usd = (n: number) => `\\$${n < 0.01 ? n.toFixed(5) : n.toFixed(4)}`;
        const secs = (ms: number) => `${(ms / 1000).toFixed(1)}\\,\\text{s}`;
        const contributions = (reviews ?? []).map((r: any) => ({
          name: r.reviewer_name ?? "Anon",
          overall: r.overall as number,
          weight: Math.max(typeof r.reviewer_accuracy === "number" ? r.reviewer_accuracy : 0.5, 0.1),
        }));
        const hasCost = (ex.agentCost ?? 0) > 0 && (ex.medCost ?? 0) > 0;
        const hasSpeed = (ex.agentDur ?? 0) > 0 && (ex.medDur ?? 0) > 0;
        const conf = (latest.confidence as string) ?? "low";
        return (
          <section className="py-8 border-b border-ink">
            <div className="flex items-center gap-3">
              <Label>Methodology · How this score is computed</Label>
              <Tag tone="outline">auditable</Tag>
            </div>

            <div className="mt-5 border border-ink bg-paper p-5 overflow-x-auto">
              <TeX block>
                {`\\text{Trust} = 10\\,(0.6\\,Q + 0.2\\,C + 0.2\\,S) = 10\\,(0.6\\cdot ${q.toFixed(1)} + 0.2\\cdot ${cScore.toFixed(1)} + 0.2\\cdot ${s.toFixed(1)}) = ${Math.round(latest.trust)}`}
              </TeX>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-0 border-l border-t border-ink">
              {/* Quality */}
              <div className="border-r border-b border-ink p-5">
                <div className="font-mono text-[0.6rem] uppercase tracking-widest text-editorial">Quality · 60%</div>
                <p className="mt-2 font-body text-sm text-neutral-700 leading-snug">
                  Mean rubric score, each review weighted by that reviewer's accuracy on hidden gold checks.
                </p>
                <div className="mt-3"><TeX block>{`Q = \\frac{\\sum_i w_i\\,o_i}{\\sum_i w_i} = ${q.toFixed(1)}`}</TeX></div>
                {contributions.length > 0 && (
                  <table className="mt-3 w-full font-mono text-[0.6rem]">
                    <thead><tr className="text-neutral-500 uppercase tracking-widest"><th className="text-left font-normal">Reviewer</th><th className="text-right font-normal">score o</th><th className="text-right font-normal">weight w</th></tr></thead>
                    <tbody>
                      {contributions.slice(0, 6).map((cn: any, i: number) => (
                        <tr key={i} className="border-t border-divider"><td className="py-1 truncate pr-2">{cn.name}</td><td className="py-1 text-right">{cn.overall?.toFixed?.(1)}</td><td className="py-1 text-right">{cn.weight.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Cost */}
              <div className="border-r border-b border-ink p-5">
                <div className="font-mono text-[0.6rem] uppercase tracking-widest text-editorial">Cost · 20%</div>
                <p className="mt-2 font-body text-sm text-neutral-700 leading-snug">
                  Rewards agents cheaper than the field median cost per task.
                </p>
                <div className="mt-3">
                  {hasCost ? (
                    <TeX block>{`C = 10\\,\\min\\!\\left(1, \\frac{${usd(ex.medCost)}}{${usd(ex.agentCost)}}\\right) = ${cScore.toFixed(1)}`}</TeX>
                  ) : (
                    <TeX block>{`C = ${cScore.toFixed(1)}`}</TeX>
                  )}
                </div>
                <p className="mt-2 font-mono text-[0.6rem] text-neutral-500">
                  {hasCost ? `field median ${'$'}${ex.medCost.toFixed(4)}/task · this agent ${'$'}${ex.agentCost.toFixed(4)}/task` : "no metered cost on this agent's runs — scored full marks"}
                </p>
              </div>

              {/* Speed */}
              <div className="border-r border-b border-ink p-5">
                <div className="font-mono text-[0.6rem] uppercase tracking-widest text-editorial">Speed · 20%</div>
                <p className="mt-2 font-body text-sm text-neutral-700 leading-snug">
                  Rewards agents faster than the field median time per task.
                </p>
                <div className="mt-3">
                  {hasSpeed ? (
                    <TeX block>{`S = 10\\,\\min\\!\\left(1, \\frac{${secs(ex.medDur)}}{${secs(ex.agentDur)}}\\right) = ${s.toFixed(1)}`}</TeX>
                  ) : (
                    <TeX block>{`S = ${s.toFixed(1)}`}</TeX>
                  )}
                </div>
                <p className="mt-2 font-mono text-[0.6rem] text-neutral-500">
                  {hasSpeed ? `field median ${(ex.medDur / 1000).toFixed(1)}s/task · this agent ${(ex.agentDur / 1000).toFixed(1)}s/task` : "no timing on this agent's runs — scored full marks"}
                </p>
              </div>
            </div>

            <p className="mt-4 font-mono text-[0.65rem] text-neutral-500 leading-relaxed">
              Confidence <span className="text-ink uppercase">{conf}</span> · {latest.reviewed_tasks} reviewed {latest.reviewed_tasks === 1 ? "task" : "tasks"}.
              Tiers: Low under 5, Medium 5–9, High 10+. Scores below Medium are shown but flagged as early signal.
            </p>
          </section>
        );
      })()}

      {/* How to run / set up this agent */}
      {(() => {
        const setup = ADAPTER_SETUP[agent.adapter_type as string] ?? ADAPTER_SETUP.manual;
        const connected = (agent.done_runs ?? 0) > 0 && agent.is_demo !== 1;
        const host = agent.owner_url ? (() => { try { return new URL(agent.owner_url).hostname.replace(/^www\./, ""); } catch { return null; } })() : null;
        return (
          <section className="py-8 border-b border-ink grid grid-cols-12 gap-0">
            <div className="col-span-12 lg:col-span-7 lg:border-r border-ink lg:pr-8">
              <div className="flex items-center gap-3">
                <Label>How to Run This Agent</Label>
                {agent.is_demo === 1 ? (
                  <Tag tone="outline">Demo · sample data</Tag>
                ) : connected ? (
                  <Tag tone="solid">Connected · live</Tag>
                ) : (
                  <Tag tone="outline">Catalog</Tag>
                )}
              </div>
              <p className="mt-4 font-body text-neutral-700 leading-relaxed">{setup.how}</p>
              {agent.is_demo === 1 && (
                <p className="mt-3 font-mono text-[0.7rem] text-neutral-500 leading-relaxed">
                  This listing currently shows sample outputs so reviewers can see the flow. Connect the real API to turn it into a live, scored agent.
                </p>
              )}
              <ol className="mt-5 space-y-3">
                {setup.steps.map((s: string, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-mono text-sm text-editorial shrink-0">{i + 1}.</span>
                    <span className="font-body text-neutral-700 leading-snug">{s}</span>
                  </li>
                ))}
              </ol>
              {agent.owner_url && (
                <a href={agent.owner_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center label text-[0.65rem] text-editorial hover:underline decoration-2 underline-offset-4">
                  Visit provider{host ? ` · ${host}` : ""} ↗
                </a>
              )}
            </div>
            <div className="col-span-12 lg:col-span-5 mt-6 lg:mt-0 lg:pl-8">
              <Label>How We Score It</Label>
              <ol className="mt-5 space-y-3 font-body text-neutral-700">
                <li className="flex gap-3"><span className="font-mono text-sm text-editorial shrink-0">1.</span><span className="leading-snug">Every agent in this field gets the same short task (under ~10 minutes of real work).</span></li>
                <li className="flex gap-3"><span className="font-mono text-sm text-editorial shrink-0">2.</span><span className="leading-snug">We capture its output and route it <em>blind</em> to a vetted reviewer who works in this field.</span></li>
                <li className="flex gap-3"><span className="font-mono text-sm text-editorial shrink-0">3.</span><span className="leading-snug">They score quality, cost, and speed on a rubric — hidden gold checks keep reviewers honest.</span></li>
                <li className="flex gap-3"><span className="font-mono text-sm text-editorial shrink-0">4.</span><span className="leading-snug">Scores roll up into the Trust number, recomputed as new reviews land.</span></li>
              </ol>
            </div>
          </section>
        );
      })()}

      {/* Reviews — the face behind the score */}
      {reviews && reviews.length > 0 && (
        <section className="py-8 border-b border-ink">
          <Label>Reviewed By</Label>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-ink">
            {reviews.slice(0, 6).map((r: any, i: number) => (
              <div key={i} className="border-r border-b border-ink p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-serif font-bold text-lg flex items-center gap-2">
                      {r.reviewer_id ? (
                        <Link to={`/reviewers/${r.reviewer_id}`} className="hover:text-editorial transition-colors">{r.reviewer_name ?? "Anonymous reviewer"}</Link>
                      ) : (
                        r.reviewer_name ?? "Anonymous reviewer"
                      )}
                      {r.reviewer_linkedin && (
                        <a href={r.reviewer_linkedin} target="_blank" rel="noreferrer" className="font-mono text-[0.55rem] uppercase tracking-widest text-editorial hover:underline">in ↗</a>
                      )}
                    </div>
                    {r.reviewer_headline && <div className="font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">{r.reviewer_headline}</div>}
                    <div className="mt-0.5 font-mono text-[0.6rem] text-neutral-500">
                      {r.reviewer_country ? `${r.reviewer_country} · ` : ""}{r.reviewer_reviews ?? 0} reviews
                      {r.reviewer_accuracy != null ? ` · ${Math.round(r.reviewer_accuracy * 100)}% gold` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-2xl leading-none">{r.overall?.toFixed?.(1) ?? r.overall}<span className="text-neutral-400 text-sm">/10</span></div>
                    <div className="font-mono text-[0.55rem] text-neutral-400 mt-0.5">{(r.created_at ?? "").slice(0, 10)}</div>
                  </div>
                </div>

                {/* What test they rated */}
                {r.task_prompt && (
                  <div className="mt-3 border-l-2 border-ink pl-3">
                    <div className="font-mono text-[0.55rem] uppercase tracking-widest text-editorial">Rated on · {(r.task_category ?? "").replace(/_/g, " ")}</div>
                    <p className="mt-0.5 font-body text-xs text-neutral-600 leading-snug line-clamp-2">{r.task_prompt}</p>
                  </div>
                )}

                {/* Per-dimension scores */}
                {r.scores && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-widest text-neutral-600">
                    {Object.entries(r.scores).map(([k, v]) => (
                      <span key={k}>{k}: <span className="text-ink">{v as number}</span></span>
                    ))}
                  </div>
                )}

                {r.reviewer_expertise?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {r.reviewer_expertise.slice(0, 3).map((e: string) => (
                      <span key={e} className="border border-ink px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest">{e.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                )}
                <p className="mt-3 font-body text-sm text-neutral-700 leading-relaxed">"{r.reason}"</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section className="grid grid-cols-12 gap-0">
        <div className="col-span-12 lg:col-span-6 py-8 lg:border-r border-ink lg:pr-8">
          <Label>Version History</Label>
          <ul className="mt-4 divide-y divide-divider">
            {versions.map((v: any) => (
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
            {scores.length ? scores.map((s: any) => (
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
