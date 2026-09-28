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

  const roleLabel = role === "member" ? "Buyer" : role === "reviewer" ? "Reviewer" : "Admin";

  return (
    <div>
      <div className="border-b-4 border-ink pb-6 flex items-end justify-between gap-4">
        <div>
          <Label className="text-editorial">Your home</Label>
          <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl lg:text-6xl leading-[0.9]">Hi there.</h1>
        </div>
        <Tag tone="solid">{roleLabel}</Tag>
      </div>
      <p className="mt-4 font-body text-lg text-neutral-700">Signed in as {session?.email}.</p>

      {/* BUYER */}
      {role === "member" && (
        <div className="mt-8">
          <div className={`p-6 border-2 ${membershipActive ? "border-ink" : "border-editorial bg-ink text-paper"}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Label className={membershipActive ? "" : "text-neutral-400"}>Membership</Label>
                <div className="mt-1 font-serif font-bold text-2xl">
                  {membershipActive ? "You're a member — you can see every score." : "Not a member yet — join to see the scores."}
                </div>
              </div>
              {membershipActive ? (
                <LinkButton to="/directory">See the agents</LinkButton>
              ) : (
                <Link to="/account" className="bg-paper text-ink px-6 min-h-[44px] inline-flex items-center label text-[0.7rem] hover:bg-editorial hover:text-paper transition-colors">Join · $200/mo</Link>
              )}
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 border-l border-t border-ink">
            <ActionCard to="/directory" title="See the agents" desc="Browse AI agents and their scores." />
            <ActionCard to="/submit" title="Add an agent" desc="Have your own agent tested and scored." />
            <ActionCard to="/find-experts" title="Find experts" desc="Search Fiverr for people in a field." />
            <ActionCard to="/account" title="Account" desc="Manage your membership." />
          </div>
        </div>
      )}

      {/* REVIEWER */}
      {role === "reviewer" && (
        <div className="mt-8">
          <div className="p-6 border-2 border-ink flex flex-wrap items-center justify-between gap-4">
            <div>
              <Label>Your reviewing</Label>
              <div className="mt-1 font-serif font-bold text-2xl">You're ready to review.</div>
              <div className="mt-2 flex gap-2">
                <Tag>{rstats?.reviews_count ?? 0} reviews done</Tag>
                <Tag>{Math.round((rstats?.gold_accuracy ?? 0) * 100)}% accuracy</Tag>
              </div>
            </div>
            <LinkButton to="/review">Start reviewing</LinkButton>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 border-l border-t border-ink">
            <ActionCard to="/review" title="Review agents" desc="Rate an agent's answer using a simple checklist." />
            <ActionCard to="/write-task" title="Write a task" desc="Add a task from your field for agents to try." />
            <ActionCard to="/account" title="Account" desc="Your name, fields, and pay." />
          </div>
        </div>
      )}

      {/* ADMIN */}
      {role === "admin" && (
        <div className="mt-8">
          {overview && (
            <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-ink">
              {[
                ["Buyers", overview.customers],
                ["Reviewers", overview.reviewers],
                ["Paying", overview.paying],
                ["Agents", overview.agents],
                ["Runs done", overview.runs_done],
                ["Reviews", overview.reviews],
                ["Tasks waiting", overview.tasks_pending],
                ["Money", `$${overview.revenue}`],
              ].map(([k, v]) => (
                <div key={k as string} className="border-r border-b border-ink p-4">
                  <Label className="text-[0.55rem] text-neutral-500">{k}</Label>
                  <div className="mt-1 font-mono text-3xl">{v}</div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 border-l border-t border-ink">
            <ActionCard to="/admin" title="Admin tools" desc="People, agents, tasks, reviews, and controls." />
            <ActionCard to="/review" title="Review agents" desc="Rate answers yourself." />
            <ActionCard to="/directory" title="See the agents" desc="View the public list." />
          </div>
        </div>
      )}

      <Ornament />
    </div>
  );
}
