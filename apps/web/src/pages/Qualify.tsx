import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Label, Tag, Ornament } from "../components/ui";
import { RubricForm } from "../components/RubricForm";

export default function Qualify() {
  const nav = useNavigate();
  const [task, setTask] = useState<Awaited<ReturnType<typeof api.qualifyTask>> | null>(null);
  const [result, setResult] = useState<{ qualified: boolean; delta: number } | null>(null);

  useEffect(() => { api.qualifyTask().then(setTask).catch(() => {}); }, []);
  if (!task) return <p className="py-16 text-center font-mono text-sm text-neutral-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <Label className="text-editorial">Examination · Qualification Task</Label>
      <h1 className="mt-3 font-serif font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">Score within one point of the answer.</h1>
      <p className="mt-3 font-body text-lg text-neutral-700">
        Grade this known-answer task against the rubric. Land within one point of the reference and you qualify.
      </p>

      <div className="mt-6 border border-ink p-6">
        <Label>Brief</Label>
        <p className="mt-2 font-body text-lg">{task.prompt}</p>
      </div>

      {result ? (
        <div className={`mt-6 p-6 border-2 ${result.qualified ? "border-ink bg-ink text-paper" : "border-editorial text-editorial"}`}>
          <div className="font-serif font-black text-3xl">{result.qualified ? "Qualified." : "Not qualified — try again."}</div>
          <p className="mt-2 font-mono text-sm">Delta from reference: {result.delta.toFixed(1)} points.</p>
          {result.qualified && <button onClick={() => nav("/review")} className="mt-4 underline decoration-2 decoration-editorial underline-offset-4 label text-[0.7rem]">Go to the Review Desk →</button>}
        </div>
      ) : (
        <div data-tour="qualify-form" className="mt-6 border border-ink p-6">
          <RubricForm rubric={task.rubric} requireReason={false} submitLabel="Submit qualification" onSubmit={async (scores) => setResult(await api.submitQualification(task.task_id, scores))} />
        </div>
      )}
      <Ornament />
    </div>
  );
}
