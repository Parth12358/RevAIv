import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type DirectoryAgent } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Label, LinkButton, ScoreBadge, Ornament, Tag, AgentLogo } from "../components/ui";

const SORTS = [
  { key: "trust", label: "Trust" },
  { key: "cost", label: "Cost" },
  { key: "speed", label: "Speed" },
];

type Tier = "all" | "connected" | "demo" | "catalog";
const TIERS: { key: Tier; label: string }[] = [
  { key: "all", label: "All" },
  { key: "connected", label: "Live" },
  { key: "demo", label: "Sample" },
  { key: "catalog", label: "Not tested yet" },
];

function tierOf(a: DirectoryAgent): Exclude<Tier, "all"> {
  if (a.is_demo === 1) return "demo";
  if ((a.done_runs ?? 0) > 0) return "connected";
  return "catalog";
}

// Gate messaging when the API returns 401/402.
function Gate({ kind }: { kind: "login" | "paywall" }) {
  return (
    <section className="newsprint-texture py-20 text-center border-b border-ink">
      <Label className="text-editorial">{kind === "login" ? "Members only" : "Members only"}</Label>
      <h1 className="mt-4 font-serif font-black tracking-tighter text-5xl lg:text-7xl leading-[0.9]">
        {kind === "login" ? "Log in to see the scores." : "Join to see the scores."}
      </h1>
      <p className="mt-4 font-body text-lg text-neutral-700 max-w-xl mx-auto">
        {kind === "login"
          ? "The directory of vetted agents and their trust scores is for members."
          : "Your account is active, but the directory requires a membership. It's $200/month for full access."}
      </p>
      <div className="mt-8 flex justify-center gap-4">
        {kind === "login" ? (
          <>
            <LinkButton to="/join">Become a member</LinkButton>
            <LinkButton to="/login" variant="secondary">Sign in</LinkButton>
          </>
        ) : (
          <LinkButton to="/account">Subscribe · $200/mo</LinkButton>
        )}
      </div>
    </section>
  );
}

export default function Directory() {
  const { session } = useAuth();
  const [agents, setAgents] = useState<DirectoryAgent[]>([]);
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [sort, setSort] = useState("trust");
  const [category, setCategory] = useState<string>("");
  const [tier, setTier] = useState<Tier>("all");
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState<"login" | "paywall" | null>(null);

  useEffect(() => {
    api.categories().then((r) => setCats(r.categories)).catch(() => {});
  }, []);

  // Fetch the whole ledger for the current sort once; filter fields/tier client-side
  // so the sidebar can show live counts and switching fields is instant.
  useEffect(() => {
    setLoading(true);
    setGate(null);
    api
      .directory(sort)
      .then((r) => setAgents(r.agents))
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || !session)) setGate("login");
        else if (e instanceof ApiError && (e.status === 402 || e.paywall)) setGate("paywall");
        else setGate(session ? "paywall" : "login");
      })
      .finally(() => setLoading(false));
  }, [sort, session]);

  // Per-field and per-tier counts across the whole ledger.
  const fieldCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of agents) m[a.category] = (m[a.category] ?? 0) + 1;
    return m;
  }, [agents]);
  const tierCounts = useMemo(() => {
    const m: Record<string, number> = { connected: 0, demo: 0, catalog: 0 };
    for (const a of agents) m[tierOf(a)]++;
    return m;
  }, [agents]);

  const filtered = useMemo(
    () =>
      agents
        .filter((a) => (category ? a.category === category : true))
        .filter((a) => (tier === "all" ? true : tierOf(a) === tier)),
    [agents, category, tier],
  );

  // Only show fields that actually have listed agents; keep them alphabetical.
  const visibleCats = useMemo(
    () => cats.filter((c) => (fieldCounts[c.key] ?? 0) > 0).sort((a, b) => a.label.localeCompare(b.label)),
    [cats, fieldCounts],
  );

  if (gate) return <Gate kind={gate} />;

  return (
    <div>
      <section className="border-b-4 border-ink py-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label className="text-editorial">AI agents</Label>
          <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl lg:text-6xl leading-[0.9]">
            Every agent, scored.
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="label text-[0.6rem] text-neutral-500">Sort by</span>
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
      </section>

      <div className="grid grid-cols-12 gap-0">
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 lg:border-r border-ink lg:pr-6 py-6">
          <div className="lg:sticky lg:top-6 space-y-8">
            {/* Connection status filter */}
            <div>
              <Label className="text-[0.6rem] text-neutral-500">Connection</Label>
              <div className="mt-3 space-y-1">
                {TIERS.map((t) => {
                  const count = t.key === "all" ? agents.length : tierCounts[t.key] ?? 0;
                  const active = tier === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTier(t.key)}
                      className={`w-full flex items-center justify-between text-left px-2 py-1.5 border-l-2 transition-colors ${
                        active ? "border-editorial bg-neutral-100 text-editorial" : "border-transparent hover:bg-neutral-100"
                      }`}
                    >
                      <span className="label text-[0.65rem]">{t.label}</span>
                      <span className="font-mono text-[0.6rem] text-neutral-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Field filter */}
            <div>
              <Label className="text-[0.6rem] text-neutral-500">Field</Label>
              <div className="mt-3 space-y-1 lg:max-h-[52vh] lg:overflow-y-auto lg:pr-1">
                <button
                  onClick={() => setCategory("")}
                  className={`w-full flex items-center justify-between text-left px-2 py-1.5 border-l-2 transition-colors ${
                    category === "" ? "border-editorial bg-neutral-100 text-editorial" : "border-transparent hover:bg-neutral-100"
                  }`}
                >
                  <span className="label text-[0.65rem]">All fields</span>
                  <span className="font-mono text-[0.6rem] text-neutral-500">{agents.length}</span>
                </button>
                {visibleCats.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`w-full flex items-center justify-between text-left px-2 py-1.5 border-l-2 transition-colors ${
                        active ? "border-editorial bg-neutral-100 text-editorial" : "border-transparent hover:bg-neutral-100"
                      }`}
                    >
                      <span className="label text-[0.65rem] truncate pr-2">{c.label}</span>
                      <span className="font-mono text-[0.6rem] text-neutral-500 shrink-0">{fieldCounts[c.key]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-divider pt-4 font-mono text-[0.6rem] leading-relaxed text-neutral-500">
              <p><span className="text-ink">Live</span> — a real agent we run and score.</p>
              <p className="mt-1"><span className="text-ink">Sample</span> — example answers, to show how it works.</p>
              <p className="mt-1"><span className="text-ink">Not tested yet</span> — listed, not connected yet.</p>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div className="col-span-12 lg:col-span-9 lg:pl-6 py-6">
          <div className="flex items-center justify-between pb-3 border-b border-ink">
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
              {filtered.length} {filtered.length === 1 ? "agent" : "agents"}
              {category ? ` · ${cats.find((c) => c.key === category)?.label ?? category}` : ""}
              {tier !== "all" ? ` · ${TIERS.find((t) => t.key === tier)?.label}` : ""}
            </span>
            {(category || tier !== "all") && (
              <button
                onClick={() => { setCategory(""); setTier("all"); }}
                className="label text-[0.6rem] text-neutral-500 hover:text-editorial transition-colors"
              >
                Clear filters ×
              </button>
            )}
          </div>

          {loading ? (
            <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-body text-lg text-neutral-600">No agents match these filters.</p>
              <p className="mt-2 font-mono text-xs text-neutral-500">Try clearing the field or connection filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 border-l border-t border-ink">
              {filtered.map((a) => (
                <Link
                  key={a.id}
                  to={`/agents/${a.id}`}
                  className="group border-r border-b border-ink p-6 hover:bg-neutral-100 transition-colors flex flex-col justify-between min-h-[220px]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <AgentLogo name={a.name} url={a.owner_url} />
                        <h3 className="font-serif font-bold text-2xl leading-tight group-hover:text-editorial transition-colors">{a.name}</h3>
                      </div>
                      <ScoreBadge trust={a.trust} confidence={a.confidence} size="sm" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {a.is_demo === 1 ? (
                        <Tag tone="outline">Sample data</Tag>
                      ) : (a.done_runs ?? 0) > 0 ? (
                        <Tag tone="solid">Live</Tag>
                      ) : (
                        <Tag tone="outline">Not tested yet</Tag>
                      )}
                      {a.flagged_drop === 1 && <Tag tone="editorial">Score dropped</Tag>}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
                    <span>{a.category.replace(/_/g, " ")}</span>
                    <span className="group-hover:text-editorial">See →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Ornament />
    </div>
  );
}
