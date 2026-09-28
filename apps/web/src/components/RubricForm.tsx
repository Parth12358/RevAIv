import { useState } from "react";
import type { RubricDim } from "../lib/api";
import { Button, Label } from "./ui";

// Newsprint rubric scoring form: each dim 0-10 + optional required reason.
export function RubricForm({
  rubric,
  requireReason = true,
  submitLabel = "Submit Review",
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
    <div className="space-y-6">
      {rubric.map((d) => (
        <div key={d.key} className="border-b border-divider pb-4">
          <div className="flex items-baseline justify-between">
            <Label>{d.label}</Label>
            <span className="font-mono text-lg">{scores[d.key]}<span className="text-neutral-400 text-sm">/10</span></span>
          </div>
          <p className="mt-1 font-body text-sm text-neutral-600">{d.description}</p>
          <input
            type="range"
            min={0}
            max={10}
            value={scores[d.key]}
            onChange={(e) => setScores((s) => ({ ...s, [d.key]: Number(e.target.value) }))}
            className="w-full mt-3 accent-[#111111]"
            aria-label={d.label}
          />
        </div>
      ))}

      {requireReason && (
        <div>
          <Label>Reason (required, ≥ 10 chars)</Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain your scores in your own words. Copy-paste and empty reasons are rejected."
            className="w-full mt-2 border-2 border-ink bg-transparent px-3 py-2 font-body text-sm focus:bg-[#F0F0F0] focus:outline-none"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-neutral-600">
          Overall: <span className="text-ink text-lg">{overall.toFixed(1)}</span>/10
        </span>
        <Button onClick={() => onSubmit(scores, reason)} disabled={!canSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
