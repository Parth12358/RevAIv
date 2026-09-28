import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Label, Button, Field, Select, TextArea, Tag, Ornament } from "../components/ui";

type Tab = "tasks" | "manual" | "agents" | "users" | "reviews";
const TABS: { key: Tab; label: string }[] = [
  { key: "tasks", label: "Tasks & Approvals" },
  { key: "manual", label: "Manual Run" },
  { key: "agents", label: "Agents" },
  { key: "users", label: "Users" },
  { key: "reviews", label: "Reviews" },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("tasks");
  return (
    <div>
      <Label className="text-editorial">The Back Office · Admin</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">Composing Room</h1>
      <p className="mt-3 font-body text-lg text-neutral-700">Control listings, approve tasks, paste manual runs, and inspect the database.</p>

      <div className="mt-6 flex flex-wrap border-b border-ink">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`label text-[0.7rem] py-3 pr-8 transition-colors ${tab === t.key ? "text-editorial" : "hover:text-editorial"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "tasks" && <TasksTab />}
        {tab === "manual" && <ManualRunTab />}
        {tab === "agents" && <AgentsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "reviews" && <ReviewsTab />}
      </div>
      <Ornament />
    </div>
  );
}

function TasksTab() {
  const [tasks, setTasks] = useState<any[]>([]);
  const load = () => api.adminTasks().then((r) => setTasks(r.tasks)).catch(() => {});
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: string) => { await api.setTaskStatus(id, status); load(); };
  return (
    <div className="border-l border-t border-ink">
      {tasks.map((t) => (
        <div key={t.id} className="border-r border-b border-ink p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Tag>{t.category.replace(/_/g, " ")}</Tag>
              <Tag tone={t.status === "active" ? "solid" : t.status === "rejected" ? "editorial" : "outline"}>{t.status}</Tag>
              {t.is_gold === 1 && <Tag>gold</Tag>}
            </div>
            <p className="mt-2 font-body truncate max-w-2xl">{t.prompt}</p>
          </div>
          <div className="flex gap-2">
            {t.status === "pending" && <><Button onClick={() => setStatus(t.id, "active")}>Approve</Button><Button variant="secondary" onClick={() => setStatus(t.id, "rejected")}>Reject</Button></>}
            {t.status === "active" && <Button variant="ghost" onClick={() => setStatus(t.id, "rejected")}>Unlist</Button>}
            {t.status === "rejected" && <Button variant="ghost" onClick={() => setStatus(t.id, "active")}>Restore</Button>}
          </div>
        </div>
      ))}
      {!tasks.length && <p className="p-4 font-body text-neutral-500">No tasks.</p>}
    </div>
  );
}

function ManualRunTab() {
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [form, setForm] = useState({ agent_name: "", category: "lead_research", task_id: "", output: "", cost_usd: "", duration_ms: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.categories().then((r) => setCats(r.categories)).catch(() => {});
    api.adminTasks().then((r) => setTasks(r.tasks.filter((t: any) => t.active === 1))).catch(() => {});
  }, []);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  async function submit() {
    setBusy(true); setMsg(null);
    try {
      const r = await api.manualRun({
        agent_name: form.agent_name, category: form.category, task_id: form.task_id, output: form.output,
        cost_usd: form.cost_usd ? Number(form.cost_usd) : undefined,
        duration_ms: form.duration_ms ? Number(form.duration_ms) * 1000 : undefined,
      });
      setMsg(`Run ${r.run_id} added to the review queue.`);
      setForm({ ...form, output: "" });
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="border-2 border-ink p-6">
      <p className="font-body text-neutral-600 mb-4">Paste a web-app agent's output for a task. It enters the review queue indistinguishable from an API run.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Agent name" value={form.agent_name} onChange={(e) => set("agent_name", e.target.value)} placeholder="Juicebox (PeopleGPT)" />
        <Select label="Field" value={form.category} onChange={(e) => set("category", e.target.value)}>{cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</Select>
        <Select label="Task" value={form.task_id} onChange={(e) => set("task_id", e.target.value)}>
          <option value="">Select a task…</option>
          {tasks.map((t) => <option key={t.id} value={t.id}>{t.prompt.slice(0, 60)}…</option>)}
        </Select>
        <Field label="Time taken (seconds)" value={form.duration_ms} onChange={(e) => set("duration_ms", e.target.value)} placeholder="120" />
        <Field label="Cost ($, optional)" value={form.cost_usd} onChange={(e) => set("cost_usd", e.target.value)} placeholder="0.00" />
      </div>
      <div className="mt-5"><TextArea label="Pasted output" rows={6} value={form.output} onChange={(e) => set("output", e.target.value)} /></div>
      <div className="mt-5 flex items-center gap-4">
        <Button onClick={submit} disabled={busy || !form.agent_name || !form.task_id || !form.output}>{busy ? "Adding…" : "Add to review queue"}</Button>
        {msg && <span className="font-mono text-xs text-editorial">{msg}</span>}
      </div>
    </div>
  );
}

function AgentsTab() {
  const [agents, setAgents] = useState<any[]>([]);
  const [log, setLog] = useState<string[]>([]);
  useEffect(() => { api.adminAgents().then((r) => setAgents(r.agents)).catch(() => {}); }, []);
  const append = (s: string) => setLog((l) => [s, ...l]);
  return (
    <div>
      {log.length > 0 && <div className="mb-4 bg-ink text-paper p-4 font-mono text-xs space-y-1">{log.map((l, i) => <div key={i}>{l}</div>)}</div>}
      <div className="border-l border-t border-ink">
        {agents.map((a) => (
          <div key={a.id} className="border-r border-b border-ink p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-serif font-bold text-xl">{a.name}</div>
              <div className="mt-1 flex gap-2 items-center">
                <Tag>{a.category?.replace(/_/g, " ")}</Tag>
                <Tag>{a.adapter_type}</Tag>
                <Tag tone={a.trust != null ? "solid" : "outline"}>{a.trust != null ? `trust ${Math.round(a.trust)}` : "unscored"}</Tag>
              </div>
            </div>
            {a.version_id && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={async () => { try { const r = await api.enqueue(a.version_id); append(`enqueued ${r.enqueued} runs for ${a.name}`); } catch (e) { append(`error: ${(e as Error).message}`); } }}>Enqueue</Button>
                <Button onClick={async () => { try { const r = await api.recompute(a.version_id); append(`${a.name}: trust ${Math.round(r.score.trust)} (${r.score.confidence})`); } catch (e) { append(`error: ${(e as Error).message}`); } }}>Recompute</Button>
              </div>
            )}
          </div>
        ))}
        {!agents.length && <p className="p-4 font-body text-neutral-500">No agents yet.</p>}
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => { api.adminUsers().then((r) => setUsers(r.users)).catch(() => {}); }, []);
  return (
    <div className="overflow-x-auto border border-ink">
      <table className="w-full text-left font-mono text-xs">
        <thead className="border-b border-ink"><tr>{["Email", "Role", "Name", "Member", "Onboarded"].map((h) => <th key={h} className="p-3 label text-[0.55rem]">{h}</th>)}</tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-divider">
              <td className="p-3">{u.email}</td>
              <td className="p-3"><Tag>{u.role}</Tag></td>
              <td className="p-3 text-neutral-500">{u.display_name ?? "—"}</td>
              <td className="p-3">{u.membership_active ? "✓" : "—"}</td>
              <td className="p-3">{u.onboarded ? "✓" : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!users.length && <p className="p-4 font-body text-neutral-500">No users yet.</p>}
    </div>
  );
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => { api.adminReviews().then((r) => setReviews(r.reviews)).catch(() => {}); }, []);
  return (
    <div className="border-l border-t border-ink">
      {reviews.map((r) => (
        <div key={r.id} className="border-r border-b border-ink p-4 flex items-center justify-between gap-3">
          <div>
            <span className="font-mono text-lg">{r.overall?.toFixed?.(1) ?? r.overall}/10</span>
            <span className="ml-3 font-body">{r.reason}</span>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs text-neutral-500">{r.reviewer ?? r.email}</div>
            {r.is_gold_check === 1 && <Tag>gold check</Tag>}
          </div>
        </div>
      ))}
      {!reviews.length && <p className="p-4 font-body text-neutral-500">No reviews yet.</p>}
    </div>
  );
}
