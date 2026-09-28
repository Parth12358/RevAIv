import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ReviewTarget } from "../lib/api";
import { Label, Button, LinkButton, Tag, Ornament } from "../components/ui";
import { RubricForm } from "../components/RubricForm";
import { MarkdownView } from "../components/MarkdownView";

export default function Reviewer() {
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needQual, setNeedQual] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [skipped, setSkipped] = useState<string[]>([]);

  async function claim(exclude: string[] = skipped) {
    setMessage(null);
    setNeedQual(false);
    setToast(null);
    try {
      const r = await api.reviewsNext(exclude);
      setTarget(r.review_target);
      if (!r.review_target) setMessage(r.message ?? "You've reviewed everything in your fields. Thank you!");
    } catch (e) {
      const m = (e as Error).message;
      if (m.includes("qualified")) setNeedQual(true);
      else setMessage(m);
    }
  }

  function skip() {
    if (!target?.run_id) { claim(); return; }
    const next = [...skipped, target.run_id];
    setSkipped(next);
    claim(next);
  }

  useEffect(() => {
    claim();
    api.reviewerStats().then((r) => setStats(r.stats)).catch(() => {});
  }, []);

  return (
    <div>
      <div data-tour="review-desk" className="border-b-4 border-ink pb-4 flex items-end justify-between flex-wrap gap-4">
        <div>
          <Label className="text-editorial">The Review Desk</Label>
          <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl leading-[0.9]">Claim &amp; Judge</h1>
        </div>
        {stats && (
          <div className="flex gap-2">
            <Tag tone={stats.paused ? "editorial" : "outline"}>{stats.paused ? "Paused" : "Active"}</Tag>
            <Tag>{Math.round((stats.gold_accuracy ?? 0) * 100)}% gold</Tag>
            <Tag>{stats.reviews_count ?? 0} reviews</Tag>
          </div>
        )}
      </div>

      {needQual && (
        <div className="mt-8 border-2 border-editorial bg-ink text-paper p-6">
          <Label className="text-neutral-400">Qualification Required</Label>
          <p className="mt-2 font-body text-lg">Pass a known-answer task before reviewing paid work.</p>
          <div className="mt-4"><Link to="/qualify" className="bg-paper text-ink px-6 min-h-[44px] inline-flex items-center label text-[0.7rem] hover:bg-editorial hover:text-paper transition-colors">Take qualification</Link></div>
        </div>
      )}

      {message && !needQual && (
        <div className="mt-12 text-center">
          <p className="font-mono text-sm text-neutral-500">{message}</p>
          <div className="mt-4"><Button variant="secondary" onClick={() => claim()}>Refresh queue</Button></div>
        </div>
      )}

      {toast && (
        <div className="mt-8 bg-ink text-paper p-4 flex items-center justify-between gap-4 flex-wrap">
          <span className="font-mono text-sm">{toast}</span>
          <Button onClick={() => claim()}>Claim next</Button>
        </div>
      )}

      {target && !toast && (
        <div className="mt-8 grid grid-cols-12 gap-0">
          <div className="col-span-12 lg:col-span-7 lg:border-r border-ink lg:pr-8">
            <div className="flex items-center gap-2">
              <Label>Brief</Label>
              {target.kind === "gold" && <Tag>hidden check</Tag>}
            </div>
            <p className="mt-2 font-body text-lg leading-relaxed">{target.prompt}</p>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Label>Agent Output · Fig. 1.1</Label>
                {target.kind === "run" && (
                  <button onClick={skip} className="label text-[0.6rem] text-neutral-500 hover:text-editorial transition-colors">Skip this one →</button>
                )}
              </div>
              <MarkdownView value={target.output} className="mt-2 max-h-[32rem]" />
              <p className="mt-2 font-mono text-[0.65rem] text-neutral-500 uppercase tracking-widest">Reviewer is blind to which agent produced this output. Skip if it's outside your expertise.</p>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 mt-8 lg:mt-0 lg:pl-8">
            <Label>Score the Rubric</Label>
            <div className="mt-4">
              <RubricForm
                rubric={target.rubric}
                onSubmit={async (scores, reason) => {
                  const r = await api.submitReview({ run_id: target.run_id, task_id: target.task_id, scores, reason });
                  setTarget(null);
                  setToast(`Review recorded · overall ${r.overall.toFixed(1)}${r.is_gold_check ? " · (gold check)" : ""}.`);
                  api.reviewerStats().then((s) => setStats(s.stats)).catch(() => {});
                }}
              />
            </div>
            {target.kind === "run" && (
              <div className="mt-4 pt-4 border-t border-divider flex items-center justify-between gap-3">
                <span className="font-mono text-[0.65rem] text-neutral-500">Outside your expertise, or can't judge fairly?</span>
                <button
                  onClick={skip}
                  className="label text-[0.65rem] px-4 min-h-[40px] inline-flex items-center border border-ink text-neutral-600 hover:bg-ink hover:text-paper transition-colors"
                >
                  Skip &amp; get next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 font-body text-neutral-600">
        Want to contribute a task from your field? <Link to="/write-task" className="underline decoration-2 decoration-editorial underline-offset-4">Write a task →</Link>
      </p>
      <Ornament />
    </div>
  );
}
