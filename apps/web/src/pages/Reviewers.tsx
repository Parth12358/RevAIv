import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Label, Ornament } from "../components/ui";

export default function Reviewers() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.reviewersPublic().then((r) => setReviewers(r.reviewers)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="border-b-4 border-ink py-8">
        <Label className="text-editorial">The Reviewers</Label>
        <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl lg:text-6xl leading-[0.9]">
          The people who rate the agents.
        </h1>
        <p className="mt-4 font-body text-lg text-neutral-700 max-w-2xl">
          Every score comes from a real person who knows the field. Click anyone to see what they've rated.
        </p>
      </section>

      {loading ? (
        <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading the roster…</p>
      ) : reviewers.length === 0 ? (
        <p className="py-16 text-center font-body text-lg text-neutral-600">No reviewers yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-ink">
          {reviewers.map((r) => (
            <Link
              key={r.id}
              to={`/reviewers/${r.id}`}
              className="group border-r border-b border-ink p-6 hover:bg-neutral-100 transition-colors flex flex-col min-h-[200px]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-2xl leading-tight group-hover:text-editorial transition-colors">
                    {r.display_name ?? "Anonymous reviewer"}
                  </h3>
                  {r.headline && <div className="mt-1 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">{r.headline}</div>}
                </div>
                {r.linkedin_url && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-widest text-editorial shrink-0">in ↗</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {(r.expertise ?? []).slice(0, 3).map((e: string) => (
                  <span key={e} className="border border-ink px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest">{e.replace(/_/g, " ")}</span>
                ))}
              </div>

              {r.bio && <p className="mt-3 font-body text-sm text-neutral-700 leading-snug line-clamp-3">{r.bio}</p>}

              <div className="mt-auto pt-4 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-widest text-neutral-500">
                <span>{r.country ? `${r.country} · ` : ""}{r.reviews_count ?? 0} reviews</span>
                <span className="group-hover:text-editorial">Profile →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 border-2 border-ink p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Label className="text-editorial">Join us</Label>
          <p className="mt-1 font-body text-lg">Know a field well? Get paid to rate AI agents.</p>
        </div>
        <Link to="/join" className="bg-ink text-paper px-6 min-h-[44px] inline-flex items-center label text-[0.7rem] hover:bg-editorial transition-colors">Become a reviewer</Link>
      </div>

      <Ornament />
    </div>
  );
}
