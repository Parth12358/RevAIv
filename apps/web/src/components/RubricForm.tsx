import { useState } from "react";
import type { RubricDim } from "../lib/api";
import { MdButton } from "./md";

// MD3 rubric scoring form: each dim 0-10 + optional required reason.
export function RubricForm({
  rubric,
  requireReason = true,
  submitLabel = "Submit review",
  onSubmit,
}: {
  rubric: RubricDim[];
  requireReason?: boolean;
  submitLabel?: string;
  onSubmit: (scores: Record<string, number>, reason: string) => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(rubric.map((d) => [d.key, 5])),
  );
  const [reason, setReason] = useState("");
  const overall = Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(1, Object.values(scores).length);
  const canSubmit = !requireReason || reason.trim().length >= 10;

  return (
    <div className="space-y-5">
      {rubric.map((d) => (
        <div key={d.key} className="bg-md-surface-low/60 rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <span className="font-roboto font-medium text-md-on">{d.label}</span>
            <span className="font-roboto text-md-primary text-lg font-medium">{scores[d.key]}<span className="text-md-on-variant text-sm">/10</span></span>
          </div>
          <p className="mt-1 font-roboto text-sm text-md-on-variant">{d.description}</p>
          <input
            type="range"
            min={0}
            max={10}
            value={scores[d.key]}
            onChange={(e) => setScores((s) => ({ ...s, [d.key]: Number(e.target.value) }))}
            className="w-full mt-3 accent-md-primary"
            aria-label={d.label}
          />
        </div>
      ))}

      {requireReason && (
        <div>
          <label className="block mb-1 ml-1 text-sm font-roboto text-md-on-variant">Reason (required, ≥ 10 chars)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain your scores in your own words."
            className="w-full rounded-t-lg bg-md-surface-low border-b-2 border-md-outline focus:border-md-primary focus:outline-none p-3 font-roboto text-md-on"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-roboto text-md-on-variant">
          Overall <span className="text-md-on text-lg font-medium">{overall.toFixed(1)}</span>/10
        </span>
        <MdButton onClick={() => onSubmit(scores, reason)} disabled={!canSubmit}>{submitLabel}</MdButton>
      </div>
    </div>
  );
}
