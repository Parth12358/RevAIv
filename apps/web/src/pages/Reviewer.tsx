import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ReviewTarget } from "../lib/api";
import { MdCard, MdButton, MdLinkButton, Chip } from "../components/md";
import { RubricForm } from "../components/RubricForm";

export default function Reviewer() {
  const [target, setTarget] = useState<ReviewTarget | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [needQual, setNeedQual] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  async function claim() {
    setMessage(null);
    setNeedQual(false);
    setToast(null);
    try {
      const r = await api.reviewsNext();
      setTarget(r.review_target);
      if (!r.review_target) setMessage(r.message ?? "The queue is empty.");
    } catch (e) {
      const m = (e as Error).message;
      if (m.includes("qualified")) setNeedQual(true);
      else setMessage(m);
    }
  }

  useEffect(() => {
    claim();
    api.reviewerStats().then((r) => setStats(r.stats)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-roboto text-4xl font-medium text-md-on">Review Desk</h1>
          <p className="mt-1 font-roboto text-md-on-variant">Claim a blind output and score it against the rubric.</p>
        </div>
        {stats && (
          <div className="flex gap-2">
            <Chip tone={stats.paused ? "error" : "success"}>{stats.paused ? "Paused" : "Active"}</Chip>
            <Chip>{Math.round((stats.gold_accuracy ?? 0) * 100)}% gold</Chip>
            <Chip>{stats.reviews_count ?? 0} reviews</Chip>
          </div>
        )}
      </div>

      {needQual && (
        <MdCard className="mt-8 bg-md-primary text-white">
          <div className="font-roboto text-xl font-medium">Qualification required</div>
          <p className="mt-1 opacity-90 font-roboto">Pass a known-answer task before reviewing paid work.</p>
          <div className="mt-4"><MdLinkButton to="/qualify" variant="tonal">Take qualification</MdLinkButton></div>
        </MdCard>
      )}

      {message && !needQual && (
        <MdCard className="mt-8 text-center">
          <p className="font-roboto text-md-on-variant">{message}</p>
          <div className="mt-4"><MdButton variant="outlined" onClick={claim}>Refresh queue</MdButton></div>
        </MdCard>
      )}

      {toast && (
        <MdCard className="mt-8 bg-md-secondary-container">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <span className="font-roboto text-md-on-secondary-container">{toast}</span>
            <MdButton onClick={claim}>Claim next</MdButton>
          </div>
        </MdCard>
      )}

      {target && !toast && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MdCard>
            <div className="flex items-center gap-2">
              <Chip tone="primary">Brief</Chip>
              {target.kind === "gold" && <Chip>hidden check</Chip>}
            </div>
            <p className="mt-3 font-roboto text-lg text-md-on">{target.prompt}</p>
            <div className="mt-5">
              <div className="font-roboto text-sm text-md-on-variant mb-2">Agent output</div>
              <pre className="bg-md-surface-low rounded-2xl p-4 font-mono text-xs whitespace-pre-wrap max-h-96 overflow-auto text-md-on">
                {typeof target.output === "string" ? target.output : JSON.stringify(target.output, null, 2)}
              </pre>
              <p className="mt-2 font-roboto text-xs text-md-on-variant">You cannot see which agent produced this output.</p>
            </div>
          </MdCard>
          <MdCard>
            <div className="font-roboto text-lg font-medium text-md-on mb-4">Score the rubric</div>
            <RubricForm
              rubric={target.rubric}
              onSubmit={async (scores, reason) => {
                const r = await api.submitReview({ run_id: target.run_id, task_id: target.task_id, scores, reason });
                setTarget(null);
                setToast(`Review recorded · overall ${r.overall.toFixed(1)}${r.is_gold_check ? " · (gold check)" : ""}.`);
                api.reviewerStats().then((s) => setStats(s.stats)).catch(() => {});
              }}
            />
          </MdCard>
        </div>
      )}

      <p className="mt-8 font-roboto text-sm text-md-on-variant">
        Want to contribute a task from your field? <Link to="/write-task" className="text-md-primary hover:underline">Write a task →</Link>
      </p>
    </div>
  );
}
