import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Label, Ornament, Tag } from "../components/ui";

export default function ReviewerProfile() {
  const { id } = useParams();
  const [data, setData] = useState<{ profile: any; reviews: any[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.reviewerProfile(id).then(setData).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-editorial">{err}</p>
      <Link to="/reviewers" className="mt-4 inline-block label text-[0.65rem] hover:text-editorial">← Back to reviewers</Link>
    </div>
  );
  if (!data) return <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading…</p>;

  const { profile, reviews } = data;

  return (
    <article className="py-8">
      <Link to="/reviewers" className="label text-[0.65rem] hover:text-editorial">← Reviewers</Link>

      <header className="mt-4 border-b-4 border-ink pb-8">
        <Label className="text-editorial">Reviewer</Label>
        <div className="mt-3 flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-serif font-black tracking-tighter leading-[0.92] text-5xl lg:text-7xl">
            {profile.display_name ?? "Anonymous reviewer"}
          </h1>
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="label text-[0.7rem] border border-ink px-4 min-h-[40px] inline-flex items-center hover:bg-ink hover:text-paper transition-colors">
              LinkedIn ↗
            </a>
          )}
        </div>
        {profile.headline && <p className="mt-3 font-mono text-xs uppercase tracking-widest text-neutral-500">{profile.headline}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Tag tone="solid">{profile.reviews_count ?? reviews.length} reviews</Tag>
          {profile.country && <Tag tone="outline">{profile.country}</Tag>}
          {profile.gold_accuracy != null && <Tag tone="outline">{Math.round(profile.gold_accuracy * 100)}% accuracy</Tag>}
        </div>
        {(profile.expertise ?? []).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {profile.expertise.map((e: string) => (
              <span key={e} className="border border-ink px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest">{e.replace(/_/g, " ")}</span>
            ))}
          </div>
        )}
        {profile.bio && <p className="mt-5 font-body text-lg text-neutral-700 leading-relaxed max-w-2xl">{profile.bio}</p>}
      </header>

      <section className="py-8">
        <Label>Reviews · {reviews.length}</Label>
        {reviews.length === 0 ? (
          <p className="mt-4 font-body text-neutral-600">No reviews yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-t border-ink">
            {reviews.map((r) => (
              <div key={r.id} className="border-r border-b border-ink p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[0.55rem] uppercase tracking-widest text-editorial">
                      Rated on · {(r.task_category ?? "").replace(/_/g, " ")}
                    </div>
                    <Link to={`/agents/${r.agent_id}`} className="mt-1 block font-serif font-bold text-xl leading-tight hover:text-editorial transition-colors">
                      {r.agent_name}
                    </Link>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-2xl leading-none">{r.overall?.toFixed?.(1) ?? r.overall}<span className="text-neutral-400 text-sm">/10</span></div>
                    <div className="font-mono text-[0.55rem] text-neutral-400 mt-0.5">{(r.created_at ?? "").slice(0, 10)}</div>
                  </div>
                </div>

                {r.task_prompt && (
                  <p className="mt-2 font-body text-xs text-neutral-600 leading-snug line-clamp-2 border-l-2 border-divider pl-3">{r.task_prompt}</p>
                )}

                {r.scores && (
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-widest text-neutral-600">
                    {Object.entries(r.scores).map(([k, v]) => (
                      <span key={k}>{k}: <span className="text-ink">{v as number}</span></span>
                    ))}
                  </div>
                )}

                {r.reason && <p className="mt-3 font-body text-sm text-neutral-700 leading-relaxed">"{r.reason}"</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      <Ornament />
    </article>
  );
}
