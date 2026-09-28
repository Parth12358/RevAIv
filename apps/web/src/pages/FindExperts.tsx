import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Label, Button, Field, Ornament, Tag } from "../components/ui";

type Person = { handle: string | null; name: string; title: string; url: string; snippet: string; relevance: number | null };

export default function FindExperts() {
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api.categories().then((r) => setCats(r.categories)).catch(() => {}); }, []);

  async function search(query: string) {
    const term = query.trim();
    if (!term) return;
    setBusy(true);
    setErr(null);
    setPeople(null);
    try {
      const r = await api.sourceFiverr(term);
      setPeople(r.people);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="border-b-4 border-ink pb-6">
        <Label className="text-editorial">Sourcing · Find Experts</Label>
        <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl lg:text-6xl leading-[0.9]">Find experts on Fiverr.</h1>
        <p className="mt-4 font-body text-lg text-neutral-700 max-w-2xl">
          Search Fiverr for freelancers in a field — for hiring, or to invite as reviewers.
          Outreach is coming soon; for now this finds people and links you straight to their Fiverr profile.
        </p>
      </div>

      <div className="mt-6 border-2 border-ink p-6">
        <form
          onSubmit={(e) => { e.preventDefault(); search(q); }}
          className="flex flex-col md:flex-row gap-4 md:items-end"
        >
          <div className="flex-1">
            <Field
              label="What kind of expert?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. mechanical engineer, agronomist, patent lawyer"
            />
          </div>
          <Button type="submit" disabled={busy || !q.trim()}>{busy ? "Searching…" : "Search Fiverr"}</Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="label text-[0.6rem] text-neutral-500 self-center">Quick fields:</span>
          {cats.slice(0, 10).map((c) => (
            <button
              key={c.key}
              onClick={() => { setQ(c.label); search(c.label); }}
              className="label text-[0.6rem] border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="mt-6 font-mono text-xs text-editorial">{err}</p>}

      {people && (
        <div className="mt-8">
          <div className="flex items-center justify-between pb-3 border-b border-ink">
            <span className="font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
              {people.length} {people.length === 1 ? "person" : "people"} found
            </span>
            <Tag tone="outline">Messaging · coming soon</Tag>
          </div>

          {people.length === 0 ? (
            <p className="py-12 text-center font-body text-lg text-neutral-600">No Fiverr sellers matched. Try a broader term.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 border-l border-t border-ink">
              {people.map((p, i) => (
                <div key={i} className="border-r border-b border-ink p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-serif font-bold text-xl leading-tight truncate">{p.handle ? `@${p.handle}` : p.name}</div>
                      {p.title && <div className="mt-1 font-body text-sm text-neutral-700 leading-snug line-clamp-2">{p.title}</div>}
                    </div>
                    {p.relevance != null && (
                      <span className="font-mono text-[0.55rem] uppercase tracking-widest text-neutral-500 shrink-0">{p.relevance}% match</span>
                    )}
                  </div>

                  {p.snippet && <p className="mt-2 font-body text-xs text-neutral-500 leading-snug line-clamp-3">{p.snippet}</p>}

                  <div className="mt-auto pt-4 flex items-center gap-3">
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="label text-[0.65rem] bg-ink text-paper px-4 min-h-[38px] inline-flex items-center hover:bg-editorial transition-colors"
                    >
                      View on Fiverr ↗
                    </a>
                    <button
                      disabled
                      title="Automated outreach is coming soon"
                      className="label text-[0.65rem] border border-neutral-300 text-neutral-400 px-4 min-h-[38px] inline-flex items-center cursor-not-allowed"
                    >
                      Message · soon
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Ornament />
    </div>
  );
}
