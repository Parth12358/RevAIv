import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { api } from "../lib/api";
import { Button, Label, Ornament } from "../components/ui";

const inputCls =
  "border-b-2 border-ink bg-transparent px-3 py-2 font-mono text-sm focus-visible:bg-[#F0F0F0] focus-visible:outline-none";

// Admin console (P1, cut-first). Enqueue runs and recompute scores by version id.
export default function Admin() {
  const { session } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [versionId, setVersionId] = useState("");
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    api.directory("trust").then((r) => setAgents(r.agents)).catch(() => {});
  }, []);

  const append = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${s}`, ...l]);

  if (session?.role !== "admin") {
    return (
      <div className="py-16">
        <Label className="text-editorial">Restricted</Label>
        <h1 className="mt-2 font-serif font-black text-3xl">Admin credentials required.</h1>
        <p className="mt-2 font-body text-neutral-600">Sign in with an admin email (e.g. admin@example.com) via the Review Desk.</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Label className="text-editorial">The Back Office · Admin</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-4xl lg:text-5xl">Composing Room</h1>

      <section className="mt-8 grid grid-cols-12 gap-0 border-t border-l border-ink">
        <div className="col-span-12 lg:col-span-6 border-r border-b border-ink p-6">
          <Label>Enqueue Runs / Recompute Score</Label>
          <p className="mt-2 font-body text-sm text-neutral-600">Paste an agent_version_id.</p>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <input className={inputCls} placeholder="ver_..." value={versionId} onChange={(e) => setVersionId(e.target.value)} />
            <Button variant="secondary" onClick={async () => {
              try { const r = await api.enqueue(versionId); append(`enqueued ${r.enqueued} runs for ${versionId}`); }
              catch (e) { append(`error: ${(e as Error).message}`); }
            }}>Enqueue</Button>
            <Button onClick={async () => {
              try { const r = await api.recompute(versionId); append(`recomputed ${versionId}: trust ${Math.round(r.score.trust)} (${r.score.confidence})`); }
              catch (e) { append(`error: ${(e as Error).message}`); }
            }}>Recompute</Button>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6 border-r border-b border-ink p-6">
          <Label>Activity Log</Label>
          <ul className="mt-3 font-mono text-xs space-y-1 max-h-56 overflow-auto">
            {log.length ? log.map((l, i) => <li key={i} className="text-neutral-700">{l}</li>) : <li className="text-neutral-400">No activity yet.</li>}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <Label>Directory Snapshot</Label>
        <div className="mt-3 border-l border-t border-ink font-mono text-xs">
          {agents.map((a) => (
            <div key={a.id} className="grid grid-cols-3 border-r border-b border-ink">
              <span className="p-3 border-r border-ink">{a.name}</span>
              <span className="p-3 border-r border-ink">{a.trust != null ? `trust ${Math.round(a.trust)}` : "unscored"}</span>
              <span className="p-3 text-neutral-500">{a.confidence ?? "—"}</span>
            </div>
          ))}
        </div>
      </section>
      <Ornament />
    </div>
  );
}
