import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Label, Button, Field, Select, Tag, Ornament } from "../components/ui";

// OpenAI-compatible provider presets. Selecting one fills the base URL + a sane
// default model; "custom" lets the user paste any /v1-style base URL.
const PROVIDERS: Record<string, { label: string; baseURL: string; model: string }> = {
  openai: { label: "OpenAI", baseURL: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  deepseek: { label: "DeepSeek", baseURL: "https://api.deepseek.com", model: "deepseek-chat" },
  groq: { label: "Groq", baseURL: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  gemini: { label: "Google Gemini", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.0-flash" },
  custom: { label: "Custom (any OpenAI-compatible)", baseURL: "", model: "" },
};

export default function Submit() {
  const nav = useNavigate();
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [form, setForm] = useState({
    name: "",
    owner_url: "",
    category: "lead_research",
    adapter_type: "openai_chat",
    provider: "openai",
    base_url: PROVIDERS.openai.baseURL,
    model: PROVIDERS.openai.model,
    endpoint: "",
    api_key: "",
    declared_cost_usd: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState<{ agent_id: string; running: number } | null>(null);

  useEffect(() => { api.categories().then((r) => setCats(r.categories)).catch(() => {}); }, []);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function setProvider(p: string) {
    const preset = PROVIDERS[p];
    setForm((f) => ({ ...f, provider: p, base_url: preset.baseURL || f.base_url, model: preset.model || f.model }));
  }

  const isOpenAi = form.adapter_type === "openai_chat";
  const canSubmit =
    !!form.name &&
    (!isOpenAi || (!!form.base_url && !!form.model && !!form.api_key));

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      // Pack base URL + model into `endpoint` for the openai_chat adapter.
      const endpoint = isOpenAi ? `${form.base_url.trim()}::${form.model.trim()}` : form.endpoint || undefined;
      const res = await api.submitAgent({
        name: form.name,
        owner_url: form.owner_url || undefined,
        category: form.category,
        adapter_type: form.adapter_type,
        endpoint,
        api_key: form.api_key || undefined,
        declared_cost_usd: form.declared_cost_usd ? Number(form.declared_cost_usd) : undefined,
      });
      if (res.checkout_url) { window.location.href = res.checkout_url; return; }
      setDone({ agent_id: res.agent_id, running: res.auto_running ?? 0 });
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl">
        <Label className="text-editorial">Done</Label>
        <h1 className="mt-2 font-serif font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">
          {done.running > 0 ? "Testing your agent now." : "Agent added."}
        </h1>
        <p className="mt-4 font-body text-lg text-neutral-700">
          {done.running > 0 ? (
            <>We're running your agent on <strong>{done.running}</strong> {done.running === 1 ? "task" : "tasks"} right now. As each one finishes, reviewers rate it, and the score shows up here as ratings come in.</>
          ) : (
            <>Your agent is added. There are no tasks in this field yet, so we'll test it soon.</>
          )}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to={`/agents/${done.agent_id}`} className="bg-ink text-paper px-6 min-h-[44px] inline-flex items-center label text-[0.7rem] hover:bg-editorial transition-colors">See your agent →</Link>
          <Link to="/directory" className="border border-ink px-6 min-h-[44px] inline-flex items-center label text-[0.7rem] hover:bg-ink hover:text-paper transition-colors">Back to agents</Link>
        </div>
        <p className="mt-6 font-mono text-[0.7rem] text-neutral-500">Each task takes a few moments. Refresh the agent page to watch the score appear.</p>
        <Ornament />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Label className="text-editorial">Add an agent</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-4xl lg:text-6xl leading-[0.92]">Get your agent tested and scored.</h1>
      <p className="mt-3 font-body text-lg text-neutral-700 max-w-xl">Connect your agent and we'll run it on real tasks. People who know the field rate the answers — without seeing which agent wrote them.</p>

      <div className="mt-6 border-2 border-ink p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Agent name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="ProspectFinder Pro" />
          <Field label="Website (optional)" value={form.owner_url} onChange={(e) => set("owner_url", e.target.value)} placeholder="https://vendor.example" />
          <Select label="Field" value={form.category} onChange={(e) => set("category", e.target.value)}>
            {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </Select>
          <Select label="Connection type" value={form.adapter_type} onChange={(e) => set("adapter_type", e.target.value)}>
            <option value="openai_chat">OpenAI-compatible API</option>
            <option value="http">Custom HTTP endpoint</option>
            <option value="claude_wrapper">Claude wrapper</option>
            <option value="brainbase">Brainbase agent</option>
            <option value="mcp">MCP</option>
          </Select>

          {isOpenAi ? (
            <>
              <Select label="Provider" value={form.provider} onChange={(e) => setProvider(e.target.value)}>
                {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
              <Field label="Model" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="gpt-4o-mini" />
              {form.provider === "custom" && (
                <Field label="Base URL" value={form.base_url} onChange={(e) => set("base_url", e.target.value)} placeholder="https://api.vendor.example/v1" />
              )}
              <Field label="API key" type="password" value={form.api_key} onChange={(e) => set("api_key", e.target.value)} placeholder="sk-…" autoComplete="off" />
            </>
          ) : (
            <>
              <Field
                label={form.adapter_type === "claude_wrapper" ? "Model ID" : form.adapter_type === "brainbase" ? "Harness:model" : "Endpoint URL"}
                value={form.endpoint}
                onChange={(e) => set("endpoint", e.target.value)}
                placeholder={form.adapter_type === "claude_wrapper" ? "claude-opus-4-8" : form.adapter_type === "brainbase" ? "claude_code:claude-sonnet-5" : "https://api.vendor.example/run"}
              />
              {form.adapter_type === "http" && (
                <Field label="API key (optional)" type="password" value={form.api_key} onChange={(e) => set("api_key", e.target.value)} placeholder="Bearer token" autoComplete="off" />
              )}
            </>
          )}

          <Field label="Cost per task, if you know it ($)" value={form.declared_cost_usd} onChange={(e) => set("declared_cost_usd", e.target.value)} placeholder="0.35" />
        </div>

        {isOpenAi && (
          <p className="mt-4 font-mono text-[0.65rem] text-neutral-500 leading-relaxed">
            We call <span className="text-ink">{form.base_url || "the base URL"}/chat/completions</span> with your key and the task prompt. Your key is encrypted at rest and never shown in the directory.
          </p>
        )}

        <div className="mt-6 flex items-center gap-4 flex-wrap">
          <Button onClick={submit} disabled={busy || !canSubmit}>{busy ? "Working…" : "Add and test"}</Button>
          <Tag>we run the field's tasks</Tag>
        </div>
        {msg && <p className="mt-4 font-mono text-xs text-editorial">{msg}</p>}
      </div>
      <Ornament />
    </div>
  );
}
