// Demo-fill: give every catalog agent (0 real runs) a plausible sample output
// in its field so it's reviewable in the flow. Outputs come from a cheap model,
// styled as the tool. These agents are then tagged "Demo · sample data".
//   node scripts/demofill.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_BASE = process.env.API_BASE || "https://agent-trust-api.parth-kshirsagar1410.workers.dev";
const OPERATOR_TOKEN = process.env.OPERATOR_TOKEN || "MNbcKzYgmL1zF3KeX4uVrzXtbLHu8j8";
const OPENAI = "https://api.openai.com/v1";

function loadKey(file, name) {
  if (process.env[name]) return process.env[name];
  try {
    for (const line of readFileSync(join(ROOT, file), "utf8").split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const m = t.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (m) { if (m[1] === name) return m[2].replace(/^["']|["']$/g, ""); }
      else if (/^sk-\S+$/.test(t)) return t;
    }
  } catch { /* no file */ }
}

const KEY = loadKey(".openai.env", "OPENAI_API_KEY");
if (!KEY) { console.error("Missing OPENAI_API_KEY (.openai.env)"); process.exit(1); }

async function model() {
  try {
    const r = await fetch(`${OPENAI}/models`, { headers: { authorization: `Bearer ${KEY}` } });
    const ids = ((await r.json()).data || []).map((m) => m.id);
    return ids.find((i) => /nano/i.test(i)) || ids.find((i) => /mini/i.test(i)) || "gpt-4o-mini";
  } catch { return "gpt-4o-mini"; }
}

async function chat(mdl, sys, user) {
  const r = await fetch(`${OPENAI}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: mdl, messages: [{ role: "system", content: sys }, { role: "user", content: user }] }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(d).slice(0, 150)}`);
  return d?.choices?.[0]?.message?.content?.trim();
}

async function main() {
  const mdl = await model();
  console.log(`Demo-fill using ${mdl}`);

  const agents = (await (await fetch(`${API_BASE}/agents?sort=trust`)).json()).agents;
  const tasks = (await (await fetch(`${API_BASE}/ingest/tasks`, { headers: { authorization: `Bearer ${OPERATOR_TOKEN}` } })).json()).tasks;
  const firstTaskByCat = {};
  for (const t of tasks) if (!firstTaskByCat[t.category]) firstTaskByCat[t.category] = t;

  const fillable = agents.filter((a) => (a.done_runs ?? 0) === 0 && firstTaskByCat[a.category]);
  console.log(`${fillable.length} catalog agents to demo-fill (fields with tasks)\n`);

  const filled = [];
  for (const a of fillable) {
    const task = firstTaskByCat[a.category];
    const field = a.category.replace(/_/g, " ");
    const sys = `You are ${a.name}, an AI product specialized in ${field}. Complete the task the way your product would for a customer — specific and usable. Do not fabricate real people, companies, or citations; keep any specifics clearly illustrative.`;
    try {
      const output = await chat(mdl, sys, task.prompt);
      if (!output) throw new Error("empty");
      const post = await fetch(`${API_BASE}/ingest/run`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${OPERATOR_TOKEN}` },
        body: JSON.stringify({ agent_name: a.name, category: a.category, task_id: task.id, output }),
      });
      if (!post.ok) throw new Error(`ingest ${post.status}`);
      filled.push(a.name);
      console.log(`  ✓ ${a.category.padEnd(22)} ${a.name}`);
    } catch (e) {
      console.log(`  ✗ ${a.category.padEnd(22)} ${a.name} — ${e.message}`);
    }
  }
  console.log(`\nFilled ${filled.length} agents. Mark them demo with:`);
  console.log(`  names: ${filled.map((n) => `'${n.replace(/'/g, "''")}'`).join(", ")}`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
