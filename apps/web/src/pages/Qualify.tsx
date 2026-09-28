import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { api } from "../lib/api";
import { Label, Ornament } from "../components/ui";
import { RubricForm } from "../components/RubricForm";

export default function Qualify() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [task, setTask] = useState<Awaited<ReturnType<typeof api.qualifyTask>> | null>(null);
  const [result, setResult] = useState<{ qualified: boolean; delta: number } | null>(null);

  useEffect(() => {
    if (!session) { nav("/reviewer"); return; }
    api.qualifyTask().then(setTask).catch(() => {});
  }, [session]);

  if (!task) return <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="py-8 max-w-3xl">
      <Label className="text-editorial">Examination · Qualification Task</Label>
      <h1 className="mt-3 font-serif font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">
        Score within one point of the known answer.
      </h1>
      <p className="mt-4 font-body text-neutral-700 leading-relaxed">
        This is a known-answer task. Score it against the rubric as you would any review. If your
        overall lands within one point of the reference answer, you qualify to review paid work.
      </p>

      <div className="mt-8 border border-ink p-6">
        <Label>Brief</Label>
        <p className="mt-2 font-body text-lg">{task.prompt}</p>
      </div>

      {result ? (
        <div className={`mt-8 p-6 border-2 ${result.qualified ? "border-ink bg-ink text-paper" : "border-editorial text-editorial"}`}>
          <div className="font-serif font-black text-3xl">
            {result.qualified ? "Qualified." : "Not qualified — try again."}
          </div>
          <p className="mt-2 font-mono text-sm">Delta from reference: {result.delta.toFixed(1)} points.</p>
          {result.qualified && (
            <button onClick={() => nav("/reviewer")} className="mt-4 underline label text-[0.7rem]">
              Go to the Review Desk →
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <RubricForm
            rubric={task.rubric}
            requireReason={false}
            submitLabel="Submit Qualification"
            onSubmit={async (scores) => {
              const r = await api.submitQualification(task.task_id, scores);
              setResult(r);
            }}
          />
        </div>
      )}
      <Ornament />
    </div>
  );
}
