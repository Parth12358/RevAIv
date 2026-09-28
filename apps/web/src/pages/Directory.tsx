import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError, type DirectoryAgent } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Label, LinkButton, ScoreBadge, Ornament, Tag } from "../components/ui";

const SORTS = [
  { key: "trust", label: "Trust" },
  { key: "cost", label: "Cost" },
  { key: "speed", label: "Speed" },
];

// Gate messaging when the API returns 401/402.
function Gate({ kind }: { kind: "login" | "paywall" }) {
  return (
    <section className="newsprint-texture py-20 text-center border-b border-ink">
      <Label className="text-editorial">{kind === "login" ? "Members Only" : "Subscription Required"}</Label>
      <h1 className="mt-4 font-serif font-black tracking-tighter text-5xl lg:text-7xl leading-[0.9]">
        {kind === "login" ? "Sign in to read the ledger." : "Subscribe to read the ledger."}
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
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState<"login" | "paywall" | null>(null);

  useEffect(() => {
    api.categories().then((r) => setCats(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setGate(null);
    api
      .directory(sort, category || undefined)
      .then((r) => setAgents(r.agents))
      .catch((e) => {
        if (e instanceof ApiError && (e.status === 401 || !session)) setGate("login");
        else if (e instanceof ApiError && (e.status === 402 || e.paywall)) setGate("paywall");
        else setGate(session ? "paywall" : "login");
      })
      .finally(() => setLoading(false));
  }, [sort, category, session]);

  if (gate) return <Gate kind={gate} />;

  return (
    <div>
      <section className="border-b-4 border-ink py-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label className="text-editorial">The Directory</Label>
          <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl lg:text-6xl leading-[0.9]">
            Vetted agents, ranked.
          </h1>
        </div>
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
      </section>

      {/* Field filter */}
      <div className="py-4 border-b border-ink flex flex-wrap gap-x-6 gap-y-2">
        <button onClick={() => setCategory("")} className={`label text-[0.65rem] ${category === "" ? "text-editorial" : "hover:text-editorial"}`}>All fields</button>
        {cats.map((c) => (
          <button key={c.key} onClick={() => setCategory(c.key)} className={`label text-[0.65rem] ${category === c.key ? "text-editorial" : "hover:text-editorial"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <p className="py-3 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
        <span className="text-ink">Connected · live</span> = a real API we run and score · <span className="text-ink">Catalog</span> = listed service, run manually or awaiting connection
      </p>

      {loading ? (
        <p className="py-16 text-center font-mono text-sm text-neutral-500">Setting type…</p>
      ) : agents.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-body text-lg text-neutral-600">No agents scored in this field yet.</p>
          <p className="mt-2 font-mono text-xs text-neutral-500">Submit one, or check back after the next review round.</p>
        </div>
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
                  <h3 className="font-serif font-bold text-2xl leading-tight group-hover:text-editorial transition-colors">{a.name}</h3>
                  <ScoreBadge trust={a.trust} confidence={a.confidence} size="sm" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(a.done_runs ?? 0) > 0 ? <Tag tone="solid">Connected · live</Tag> : <Tag tone="outline">Catalog</Tag>}
                  {a.flagged_drop === 1 && <Tag tone="editorial">Score dropped 10+</Tag>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
                <span>{a.category.replace(/_/g, " ")}</span>
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
