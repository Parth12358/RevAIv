import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { MdCard, MdButton, MdLinkButton, Chip } from "../components/md";

function ActionCard({ to, title, desc, external }: { to: string; title: string; desc: string; external?: boolean }) {
  return (
    <Link to={to}>
      <MdCard interactive className="h-full">
        <div className="font-roboto font-medium text-lg text-md-on">{title} {external && "↗"}</div>
        <p className="mt-1 font-roboto text-sm text-md-on-variant">{desc}</p>
      </MdCard>
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
      <div className="flex items-center gap-3">
        <h1 className="font-roboto text-4xl font-medium text-md-on">Dashboard</h1>
        <Chip tone="primary">{role}</Chip>
      </div>
      <p className="mt-1 font-roboto text-md-on-variant">Welcome back, {session?.email}.</p>

      {/* CUSTOMER */}
      {role === "member" && (
        <div className="mt-8 space-y-6">
          <MdCard className={membershipActive ? "" : "bg-md-primary text-white"}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-roboto text-sm opacity-80">Membership</div>
                <div className="font-roboto text-2xl font-medium">
                  {membershipActive ? "Active — full directory access" : "Not active — subscribe to browse"}
                </div>
              </div>
              {membershipActive ? (
                <MdLinkButton to="/directory" variant="tonal">Browse the directory ↗</MdLinkButton>
              ) : (
                <MdLinkButton to="/account" variant="tonal">Subscribe · $200/mo</MdLinkButton>
              )}
            </div>
          </MdCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard to="/directory" external title="The Directory" desc="Browse vetted agents and their trust scores." />
            <ActionCard to="/submit" title="Submit an agent" desc="Get a trust score for an agent you're considering." />
            <ActionCard to="/account" title="Account & billing" desc="Manage your membership." />
          </div>
        </div>
      )}

      {/* REVIEWER */}
      {role === "reviewer" && (
        <div className="mt-8 space-y-6">
          <MdCard>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-roboto text-sm text-md-on-variant">Reviewer status</div>
                <div className="font-roboto text-2xl font-medium text-md-on">
                  {rstats?.qualified ? "Qualified" : "Not yet qualified"}
                </div>
                <div className="mt-1 flex gap-2">
                  <Chip tone={rstats?.paused ? "error" : "success"}>{rstats?.paused ? "Paused" : "Active"}</Chip>
                  <Chip>{Math.round((rstats?.gold_accuracy ?? 0) * 100)}% gold accuracy</Chip>
                  <Chip>{rstats?.reviews_count ?? 0} reviews</Chip>
                </div>
              </div>
              {rstats?.qualified ? (
                <MdLinkButton to="/review">Go to the Review Desk</MdLinkButton>
              ) : (
                <MdLinkButton to="/qualify">Take qualification</MdLinkButton>
              )}
            </div>
          </MdCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard to="/review" title="Review Desk" desc="Claim blind outputs and score them against the rubric." />
            <ActionCard to="/write-task" title="Write a task" desc="Author tasks from your field with the answer you'd expect." />
            <ActionCard to="/account" title="Your profile" desc="Update your expertise and public bio." />
          </div>
        </div>
      )}

      {/* ADMIN */}
      {role === "admin" && (
        <div className="mt-8 space-y-6">
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Customers", overview.customers],
                ["Reviewers", overview.reviewers],
                ["Paying members", overview.paying],
                ["Agents", overview.agents],
                ["Runs done", overview.runs_done],
                ["Reviews", overview.reviews],
                ["Tasks pending", overview.tasks_pending],
                ["Revenue (demo)", `$${overview.revenue}`],
              ].map(([k, v]) => (
                <MdCard key={k as string}>
                  <div className="font-roboto text-sm text-md-on-variant">{k}</div>
                  <div className="mt-1 font-roboto text-3xl font-medium text-md-on">{v}</div>
                </MdCard>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard to="/admin" title="Admin console" desc="Users, agents, tasks, reviews, listing controls, manual runs." />
            <ActionCard to="/review" title="Review Desk" desc="Review outputs yourself." />
            <ActionCard to="/directory" external title="The Directory" desc="See the public-facing ledger." />
          </div>
        </div>
      )}
    </div>
  );
}
