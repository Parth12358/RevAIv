import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Label, Button, Field, Select, Tag, Ornament } from "../components/ui";

export default function Submit() {
  const nav = useNavigate();
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [form, setForm] = useState({ name: "", owner_url: "", category: "lead_research", adapter_type: "http", endpoint: "", declared_cost_usd: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { api.categories().then((r) => setCats(r.categories)).catch(() => {}); }, []);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await api.submitAgent({
        name: form.name,
        owner_url: form.owner_url || undefined,
        category: form.category,
        adapter_type: form.adapter_type,
        endpoint: form.endpoint || undefined,
        declared_cost_usd: form.declared_cost_usd ? Number(form.declared_cost_usd) : undefined,
      });
      if (res.checkout_url) window.location.href = res.checkout_url;
      else { setMsg(`Agent submitted (${res.agent_id}). An operator will run the vetting tasks.`); setTimeout(() => nav("/app"), 1600); }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Label className="text-editorial">Classifieds · Submit for Vetting</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-4xl lg:text-6xl leading-[0.92]">Get a trust score before you commit budget.</h1>
      <p className="mt-3 font-body text-lg text-neutral-700 max-w-xl">The vetting fee covers ten tasks × two reviews each.</p>

      <div className="mt-6 border-2 border-ink p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Agent name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ProspectFinder Pro" />
          <Field label="Owner URL" value={form.owner_url} onChange={(e) => set("owner_url", e.target.value)} placeholder="https://vendor.example" />
          <Select label="Field" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </Select>
          <Select label="Adapter" value={form.adapter_type} onChange={(e) => set("adapter_type", e.target.value)}>
            <option value="http">HTTP</option>
            <option value="claude_wrapper">Claude wrapper</option>
            <option value="brainbase">Brainbase agent</option>
            <option value="mcp">MCP</option>
          </Select>
          <Field
            label={form.adapter_type === "claude_wrapper" ? "Model ID" : form.adapter_type === "brainbase" ? "Harness:model" : "Endpoint URL"}
            value={form.endpoint}
            onChange={(e) => set("endpoint", e.target.value)}
            placeholder={form.adapter_type === "claude_wrapper" ? "claude-opus-4-8" : form.adapter_type === "brainbase" ? "claude_code:claude-sonnet-5" : "https://api.vendor.example/run"}
          />
          <Field label="Declared cost / task ($)" value={form.declared_cost_usd} onChange={(e) => set("declared_cost_usd", e.target.value)} placeholder="0.35" />
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Button onClick={submit} disabled={busy || !form.name}>{busy ? "Submitting…" : "Pay vetting fee · $400"}</Button>
          <Tag>10 tasks × 2 reviews</Tag>
        </div>
        {msg && <p className="mt-4 font-mono text-xs text-editorial">{msg}</p>}
      </div>
      <Ornament />
    </div>
  );
}
