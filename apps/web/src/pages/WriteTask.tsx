import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Label, Button, Field, Select, TextArea, Tag, Ornament } from "../components/ui";

export default function WriteTask() {
  const { session } = useAuth();
  const isAdmin = session?.role === "admin";
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [form, setForm] = useState({ category: "lead_research", prompt: "", expected_answer: "", great_answer: "", common_mistakes: "", is_gold: false });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => api.myTasks().then((r) => setMine(r.tasks)).catch(() => {});
  useEffect(() => { api.categories().then((r) => setCats(r.categories)).catch(() => {}); load(); }, []);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.createTask({
        category: form.category,
        prompt: form.prompt,
        expected_answer: form.expected_answer || undefined,
        great_answer: form.great_answer || undefined,
        common_mistakes: form.common_mistakes || undefined,
        is_gold: isAdmin ? form.is_gold : undefined,
      });
      setMsg(r.status === "active" ? "Task published." : "Task submitted for review — an admin will approve it.");
      setForm({ category: form.category, prompt: "", expected_answer: "", great_answer: "", common_mistakes: "", is_gold: false });
      load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Label className="text-editorial">Write a task</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">A small job an agent should be able to do.</h1>
      <p className="mt-3 font-body text-lg text-neutral-700">Keep it answerable in <strong>under ten minutes</strong>, with a single checkable answer — a number, a named part, a verifiable fact.</p>

      <div className="mt-6 border-2 border-ink p-6 space-y-5">
        <Select label="Field" value={form.category} onChange={(e) => set("category", e.target.value)}>
          {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </Select>
        <TextArea label="The prompt (exactly what the AI is given)" rows={3} value={form.prompt} onChange={(e) => set("prompt", e.target.value)} placeholder="Daily demand averages 40 units, SD 12, lead time 9 days, 95% service level. Give safety stock and reorder point with working." />
        <TextArea label="The answer you'd expect" rows={2} value={form.expected_answer} onChange={(e) => set("expected_answer", e.target.value)} placeholder="Safety stock ≈ 59 units (z=1.645); reorder point ≈ 419 units." />
        <Field label="What a great answer includes" value={form.great_answer} onChange={(e) => set("great_answer", e.target.value)} placeholder="Shows the z-score and the formula." />
        <Field label="Common mistakes a weak answer makes" value={form.common_mistakes} onChange={(e) => set("common_mistakes", e.target.value)} placeholder="Uses the wrong z-score or forgets lead-time demand." />
        {isAdmin && (
          <label className="flex items-center gap-2 font-body">
            <input type="checkbox" checked={form.is_gold} onChange={(e) => set("is_gold", e.target.checked)} className="accent-[#111111] h-5 w-5" />
            Use as a hidden known-answer (gold) check
          </label>
        )}
        <div className="flex items-center gap-4">
          <Button onClick={submit} disabled={busy || form.prompt.trim().length < 20}>{busy ? "Submitting…" : isAdmin ? "Publish task" : "Submit for review"}</Button>
          {msg && <span className="font-mono text-xs text-editorial">{msg}</span>}
        </div>
      </div>

      <h2 className="mt-10 font-serif font-bold text-2xl">Your tasks</h2>
      <div className="mt-3 border-l border-t border-ink">
        {mine.length ? mine.map((t) => (
          <div key={t.id} className="border-r border-b border-ink p-4 flex items-center justify-between gap-3">
            <span className="font-body truncate">{t.prompt}</span>
            <Tag tone={t.status === "active" ? "solid" : t.status === "rejected" ? "editorial" : "outline"}>{t.status}</Tag>
          </div>
        )) : <p className="p-4 font-body text-neutral-500">No tasks yet.</p>}
      </div>
      <Ornament />
    </div>
  );
}
