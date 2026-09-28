// Multi-provider agent runner: generate real outputs for the live task library
// from any provider whose key is present, and push them into production via the
// operator-ingest endpoint.
//
//   node scripts/generate.mjs               # run every provider with a key
//   node scripts/generate.mjs gemini tavily # run only these
//   TASK_IDS=tsk_01 node scripts/generate.mjs deepseek   # one task
//
// Keys: put each provider's key in its own file at the project root, e.g.
//   .deepseek.env  .gemini.env  .groq.env  .tavily.env  .exa.env
// (a bare key on one line, or KEY=value). Env vars also work.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = process.env.API_BASE || "https://agent-trust-api.parth-kshirsagar1410.workers.dev";
const OPERATOR_TOKEN = process.env.OPERATOR_TOKEN || "MNbcKzYgmL1zF3KeX4uVrzXtbLHu8j8";
const TASK_LIMIT = Number(process.env.TASK_LIMIT || 0);

const SYSTEM =
  "You are an expert completing a real work task for evaluation. Read the task and return the best possible answer, showing any working or sources. Be specific and concrete. Do not fabricate facts, names, numbers, or citations; where you are uncertain, say so explicitly.";

// ---- provider registry ----
const PROVIDERS = {
  deepseek: { label: "DeepSeek", keyEnv: "DEEPSEEK_API_KEY", keyFile: ".deepseek.env", type: "openai", baseURL: "https://api.deepseek.com", modelPref: /flash/i, fallbackModel: "deepseek-chat" },
  // OpenAI — small models only (nano/mini) to stay cheap.
  openai:   { label: "OpenAI",   keyEnv: "OPENAI_API_KEY",   keyFile: ".openai.env",   type: "openai", baseURL: "https://api.openai.com/v1", modelPref: /(4o|4\.1|5)-(mini|nano)|nano/i, fallbackModel: "gpt-4o-mini" },
  gemini:   { label: "Gemini",   keyEnv: "GEMINI_API_KEY",   keyFile: ".gemini.env",   type: "openai", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", modelPref: /flash/i, fallbackModel: "gemini-2.5-flash" },
  groq:     { label: "Groq",     keyEnv: "GROQ_API_KEY",     keyFile: ".groq.env",     type: "openai", baseURL: "https://api.groq.com/openai/v1", modelPref: /llama.*(70b|instant|versatile)/i, fallbackModel: "llama-3.3-70b-versatile" },
  tavily:   { label: "Tavily",   keyEnv: "TAVILY_API_KEY",   keyFile: ".tavily.env",   type: "tavily" },
  exa:      { label: "Exa",      keyEnv: "EXA_API_KEY",      keyFile: ".exa.env",      type: "exa" },
};

function loadKey(p) {
  if (process.env[p.keyEnv]) return process.env[p.keyEnv];
  try {
    for (const line of readFileSync(join(ROOT, p.keyFile), "utf8").split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const m = t.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (m) { if (m[1] === p.keyEnv) return m[2].replace(/^["']|["']$/g, ""); }
      else if (!/\s/.test(t)) return t; // bare key on its own line
    }
  } catch { /* no file */ }
  return undefined;
}

// ---- OpenAI-compatible chat providers (deepseek, gemini, groq) ----
async function openaiModel(p, key) {
  const envModel = process.env[`${p.label.toUpperCase()}_MODEL`];
  if (envModel) return envModel;
  try {
    const res = await fetch(`${p.baseURL}/models`, { headers: { authorization: `Bearer ${key}` } });
    const data = await res.json();
    const ids = (data.data || []).map((m) => m.id).filter(Boolean);
    const ver = (s) => { const m = s.match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
    // Prefer the highest-version model matching the preference (e.g. newest flash).
    const matches = ids.filter((i) => p.modelPref.test(i)).sort((a, b) => ver(b) - ver(a));
    return matches[0] || ids.find((i) => i === p.fallbackModel) || ids[0] || p.fallbackModel;
  } catch { return p.fallbackModel; }
}
async function openaiRun(p, key, model, prompt) {
  const res = await fetch(`${p.baseURL}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }], stream: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error("empty completion");
  return out;
}

// ---- Tavily (search + synthesized answer) ----
async function tavilyRun(key, prompt) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, query: prompt, include_answer: "advanced", max_results: 8, search_depth: "advanced" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  const answer = data.answer || "(no synthesized answer)";
  const sources = (data.results || []).map((r) => `- [${r.title}](${r.url})`).join("\n");
  return `${answer}\n\n**Sources**\n${sources}`;
}

// ---- Exa (/answer with citations) ----
async function exaRun(key, prompt) {
  const res = await fetch("https://api.exa.ai/answer", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key },
    body: JSON.stringify({ query: prompt, text: false }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  const answer = data.answer || "(no answer)";
  const cites = (data.citations || []).map((c) => `- [${c.title || c.url}](${c.url})`).join("\n");
  return `${answer}${cites ? `\n\n**Citations**\n${cites}` : ""}`;
}

// Retry transient overload / rate-limit errors with backoff.
async function withRetry(fn, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      last = e;
      if (!/50\d|429|UNAVAILABLE|high demand|rate.?limit|overload|timeout/i.test(e.message)) break;
      await new Promise((r) => setTimeout(r, 5000 * (i + 1)));
    }
  }
  throw last;
}

function friendly(label, model) {
  if (!model) return label;
  let m = model.replace(/^models\//i, "");
  m = m.replace(/-?\d{4}-\d{2}-\d{2}$/, ""); // strip dated snapshot suffix
  // Strip the provider's own name token so we don't double it (e.g. "gemini-3.8-flash" → "3.8-flash").
  const key = label.toLowerCase().replace(/\s+/g, "");
  m = m.replace(new RegExp(`^${key}[-_]?`, "i"), "");
  let clean = m.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  clean = clean.replace(/\bGpt\b/g, "GPT");
  return `${label} ${clean}`.replace(/\s+/g, " ").trim();
}

async function fetchTasks() {
  const res = await fetch(`${API_BASE}/ingest/tasks`, { headers: { authorization: `Bearer ${OPERATOR_TOKEN}` } });
  if (!res.ok) throw new Error(`ingest/tasks ${res.status}: ${await res.text()}`);
  let { tasks } = await res.json();
  const only = (process.env.TASK_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (only.length) tasks = tasks.filter((t) => only.includes(t.id));
  const excl = (process.env.TASK_EXCLUDE || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (excl.length) tasks = tasks.filter((t) => !excl.includes(t.id));
  if (TASK_LIMIT > 0) tasks = tasks.slice(0, TASK_LIMIT);
  return tasks;
}

async function runProvider(id, tasks) {
  const p = PROVIDERS[id];
  const key = loadKey(p);
  if (!key) { console.log(`\n[${id}] no key (looked for env ${p.keyEnv} and ${p.keyFile}) — skipping`); return; }

  let model = null, agentName = p.label, run;
  if (p.type === "openai") {
    model = await openaiModel(p, key);
    agentName = friendly(p.label, model);
    run = (prompt) => openaiRun(p, key, model, prompt);
  } else if (p.type === "tavily") {
    run = (prompt) => tavilyRun(key, prompt);
  } else if (p.type === "exa") {
    run = (prompt) => exaRun(key, prompt);
  }

  console.log(`\n[${id}] agent "${agentName}"${model ? ` (model ${model})` : ""} → ${tasks.length} tasks`);
  let ok = 0, fail = 0;
  for (const t of tasks) {
    const started = Date.now();
    try {
      const output = await withRetry(() => run(t.prompt));
      const durationMs = Date.now() - started;
      const post = await fetch(`${API_BASE}/ingest/run`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${OPERATOR_TOKEN}` },
        body: JSON.stringify({ agent_name: agentName, category: t.category, task_id: t.id, output, duration_ms: durationMs }),
      });
      if (!post.ok) throw new Error(`ingest/run ${post.status}: ${await post.text()}`);
      ok++;
      console.log(`  ✓ ${t.category.padEnd(20)} ${t.id}  (${Math.round(durationMs / 1000)}s, ${output.length} chars)`);
    } catch (e) {
      fail++;
      console.log(`  ✗ ${t.category.padEnd(20)} ${t.id}  — ${e.message}`);
    }
  }
  console.log(`[${id}] done: ${ok} pushed, ${fail} failed. Agent "${agentName}" is in the review queue.`);
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  let selected = args.length ? args : Object.keys(PROVIDERS).filter((id) => loadKey(PROVIDERS[id]));
  selected = selected.filter((id) => PROVIDERS[id]);
  if (!selected.length) {
    console.error("No providers to run. Add a key file (.deepseek.env / .gemini.env / .tavily.env / .exa.env) or pass a provider name.");
    process.exit(1);
  }
  const tasks = await fetchTasks();
  console.log(`Providers: ${selected.join(", ")}  |  Tasks: ${tasks.length}`);
  for (const id of selected) await runProvider(id, tasks);
  console.log(`\nAll done. Reviewers score them at https://agent-trust-web.pages.dev (Join as reviewer → qualify → Review Desk).`);
}

main().catch((e) => { console.error("\nFatal:", e.message); process.exit(1); });
