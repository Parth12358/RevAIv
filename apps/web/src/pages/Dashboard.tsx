import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Label, LinkButton, Tag, Ornament } from "../components/ui";

function ActionCard({ to, title, desc }: { to: string; title: string; desc: string }) {
  return (
    <Link to={to} className="group border-r border-b border-ink p-6 hover:bg-neutral-100 transition-colors block hard-shadow-hover">
      <div className="font-serif font-bold text-2xl group-hover:text-editorial transition-colors">{title}</div>
      <p className="mt-1 font-body text-neutral-600">{desc}</p>
      <div className="mt-4 label text-[0.6rem] text-neutral-500 group-hover:text-editorial">Open →</div>
    </Link>
  );
}

export default function Dashboard() {
  const { session, membershipActive } = useAuth();
  const role = session?.role;
  const [rstats, setRstats] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    if (role === "reviewer" || role === "admin") api.reviewerStats().then((r) => setRstats(r.stats)).catch(() => {});
    if (role === "admin") api.adminOverview().then((r) => setOverview(r.overview)).catch(() => {});
  }, [role]);

  return (
    <div>
      <div className="border-b-4 border-ink pb-6 flex items-end justify-between gap-4">
        <div>
          <Label className="text-editorial">The Working Desk</Label>
          <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl lg:text-6xl leading-[0.9]">Dashboard</h1>
        </div>
        <Tag tone="solid">{role}</Tag>
      </div>
      <p className="mt-4 font-body text-lg text-neutral-700">Welcome back, {session?.email}.</p>

      {/* CUSTOMER */}
      {role === "member" && (
        <div className="mt-8">
          <div className={`p-6 border-2 ${membershipActive ? "border-ink" : "border-editorial bg-ink text-paper"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Label className={membershipActive ? "" : "text-neutral-400"}>Membership</Label>
                <div className="mt-1 font-serif font-bold text-2xl">
                  {membershipActive ? "Active — full directory access" : "Not active — subscribe to browse"}
                </div>
              </div>
              {membershipActive ? (
                <LinkButton to="/directory">Browse the directory</LinkButton>
              ) : (
                <Link to="/account" className="bg-paper text-ink px-6 min-h-[44px] inline-flex items-center label text-[0.7rem] hover:bg-editorial hover:text-paper transition-colors">Subscribe · $200/mo</Link>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 border-l border-t border-ink">
            <ActionCard to="/directory" title="The Directory" desc="Browse vetted agents and their trust scores." />
            <ActionCard to="/submit" title="Submit an Agent" desc="Get a trust score for an agent you're considering." />
            <ActionCard to="/account" title="Account & Billing" desc="Manage your membership." />
          </div>
        </div>
      )}

      {/* REVIEWER */}
      {role === "reviewer" && (
        <div className="mt-8">
          <div className="p-6 border-2 border-ink flex flex-wrap items-center justify-between gap-4">
            <div>
              <Label>Reviewer Status</Label>
              <div className="mt-1 font-serif font-bold text-2xl">{rstats?.qualified ? "Qualified" : "Not yet qualified"}</div>
              <div className="mt-2 flex gap-2">
                <Tag tone={rstats?.paused ? "editorial" : "outline"}>{rstats?.paused ? "Paused" : "Active"}</Tag>
                <Tag>{Math.round((rstats?.gold_accuracy ?? 0) * 100)}% gold</Tag>
                <Tag>{rstats?.reviews_count ?? 0} reviews</Tag>
              </div>
            </div>
            {rstats?.qualified ? <LinkButton to="/review">Go to the Review Desk</LinkButton> : <LinkButton to="/qualify">Take qualification</LinkButton>}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 border-l border-t border-ink">
            <ActionCard to="/review" title="Review Desk" desc="Claim blind outputs and score them against the rubric." />
            <ActionCard to="/write-task" title="Write a Task" desc="Author tasks from your field with the answer you'd expect." />
            <ActionCard to="/account" title="Your Profile" desc="See your expertise and public bio." />
          </div>
        </div>
      )}

      {/* ADMIN */}
      {role === "admin" && (
        <div className="mt-8">
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-ink">
              {[
                ["Customers", overview.customers],
                ["Reviewers", overview.reviewers],
                ["Paying", overview.paying],
                ["Agents", overview.agents],
                ["Runs done", overview.runs_done],
                ["Reviews", overview.reviews],
                ["Tasks pending", overview.tasks_pending],
                ["Revenue", `$${overview.revenue}`],
              ].map(([k, v]) => (
                <div key={k as string} className="border-r border-b border-ink p-4">
                  <Label className="text-[0.55rem] text-neutral-500">{k}</Label>
                  <div className="mt-1 font-mono text-3xl">{v}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 border-l border-t border-ink">
            <ActionCard to="/admin" title="Admin Console" desc="Users, agents, tasks, reviews, listing controls, manual runs." />
            <ActionCard to="/review" title="Review Desk" desc="Review outputs yourself." />
            <ActionCard to="/directory" title="The Directory" desc="See the public-facing ledger." />
          </div>
        </div>
      )}

      <Ornament />
    </div>
  );
}
