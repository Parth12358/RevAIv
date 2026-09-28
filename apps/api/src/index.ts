// Agent Trust Layer API — single Worker hosting HTTP routes, the Queue
// consumer, and the Cron scheduled handler.
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import agents from "./routes/agents";
import runs from "./routes/runs";
import reviews from "./routes/reviews";
import reviewers from "./routes/reviewers";
import scores from "./routes/scores";
import webhooks from "./routes/webhooks";
import auth from "./routes/auth";
import billing from "./routes/billing";
import stats from "./routes/stats";
import tasks from "./routes/tasks";
import admin from "./routes/admin";
import ingest from "./routes/ingest";
import { runScheduled } from "./cron";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

app.get("/", (c) => c.json({ service: "agent-trust-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true }));

app.route("/auth", auth);
app.route("/billing", billing);
app.route("/stats", stats);
app.route("/tasks", tasks);
app.route("/admin", admin);
app.route("/ingest", ingest);
app.route("/agents", agents);
app.route("/runs", runs);
app.route("/reviews", reviews);
app.route("/reviewers", reviewers);
app.route("/scores", scores);
app.route("/webhooks", webhooks);

export default {
  fetch: app.fetch,

  // Cron: re-tests + score recompute.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduled(env));
  },
};
