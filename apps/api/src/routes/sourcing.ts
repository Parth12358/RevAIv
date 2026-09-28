// Expert sourcing: search Fiverr for freelancers/experts a member could hire.
// SEARCH ONLY for now — outreach/messaging is intentionally not implemented.
import { Hono } from "hono";
import type { Env } from "../types";
import type { Session } from "../lib/auth";
import { requireAuth } from "../lib/auth";

type Vars = { Variables: { session: Session }; Bindings: Env };
const app = new Hono<Vars>();

// URL path segments that are Fiverr sections, not usernames.
const NON_USER = new Set([
  "categories", "gigs", "search", "pro", "business", "resources", "logo-maker",
  "help", "support", "cp", "start_selling", "inbox", "users", "share", "invite",
  "hire", "cat", "blog", "sellers", "buyers", "career", "careers", "community",
  "become-a-seller", "checkout", "mediawiki", "partnerships", "affiliates",
  "terms", "privacy", "about", "news", "studios", "learn", "gig",
]);

// Fiverr profile/gig URLs are fiverr.com/<username>[/<gig-slug>]. Pull the handle.
function extractHandle(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (!u.hostname.endsWith("fiverr.com")) return null;
    const seg = u.pathname.split("/").filter(Boolean);
    if (seg.length === 0) return null;
    // Locale-prefixed paths e.g. /en/<username>
    let first = seg[0];
    if (/^[a-z]{2}(-[a-z]{2})?$/i.test(first) && seg.length > 1) first = seg[1];
    if (NON_USER.has(first.toLowerCase())) return null;
    if (!/^[a-z0-9_]{3,40}$/i.test(first)) return null;
    return first;
  } catch {
    return null;
  }
}

function cleanTitle(t: string): string {
  return (t || "").replace(/\s*[|\-–]\s*Fiverr.*$/i, "").replace(/^Fiverr\s*[|\-–]\s*/i, "").trim();
}

// GET /sourcing/fiverr?q=...  — search Fiverr for people in a field.
app.get("/fiverr", requireAuth(["member", "admin"]), async (c) => {
  const q = (c.req.query("q") || "").trim();
  if (!q) return c.json({ error: "a search query (q) is required" }, 400);
  if (!c.env.TAVILY_API_KEY) return c.json({ error: "sourcing search is not configured" }, 503);

  let data: { results?: { title: string; url: string; content?: string; score?: number }[] };
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: c.env.TAVILY_API_KEY,
        query: `${q} freelancer expert`,
        include_domains: ["fiverr.com"],
        max_results: 20,
        search_depth: "basic",
      }),
    });
    if (!res.ok) return c.json({ error: `search upstream ${res.status}` }, 502);
    data = await res.json();
  } catch (e) {
    return c.json({ error: "search request failed" }, 502);
  }

  const seen = new Set<string>();
  const people = (data.results || [])
    .map((r) => {
      const handle = extractHandle(r.url);
      return {
        handle,
        name: handle ?? cleanTitle(r.title) ?? "Fiverr seller",
        title: cleanTitle(r.title),
        url: r.url,
        snippet: (r.content || "").slice(0, 220),
        relevance: typeof r.score === "number" ? Math.round(r.score * 100) : null,
      };
    })
    // Keep only genuine seller profiles/gigs (a real handle) — not Fiverr's blog,
    // category, or "hire the best…" landing pages. This is a people search.
    .filter((p) => {
      if (!p.url || !p.handle) return false;
      if (seen.has(p.handle)) return false;
      seen.add(p.handle);
      return true;
    });

  return c.json({ query: q, count: people.length, people });
});

export default app;
