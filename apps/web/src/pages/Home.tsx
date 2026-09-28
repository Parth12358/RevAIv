import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Stats } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Label, LinkButton, Ornament } from "../components/ui";

export default function Home() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  const cta = session ? "/app" : "/join";

  return (
    <div>
      {/* Hero */}
      <section className="newsprint-texture border-b-4 border-ink py-10 lg:py-16">
        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-12 lg:col-span-8 lg:border-r border-ink lg:pr-10">
            <Label className="text-editorial">Vol. 1 · The Trust Problem</Label>
            <h1 className="mt-4 font-serif font-black tracking-tighter leading-[0.9] text-5xl sm:text-6xl lg:text-8xl">
              A Costco membership for AI agents.
            </h1>
            <p className="drop-cap mt-6 font-body text-lg leading-relaxed text-neutral-700 max-w-2xl text-justify">
              Businesses cannot tell which agents actually deliver. We publish a single trust
              score — quality, cost and speed — for a specific kind of task, grounded in the
              judgment of vetted human reviewers and re-tested on every agent update. Members
              browse agents we have already vetted, and can submit any agent for a score.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LinkButton to={cta}>{session ? "Enter the platform" : "Become a member"}</LinkButton>
              <LinkButton to="/directory" variant="secondary">Browse the directory</LinkButton>
            </div>
          </div>
          {/* Stat column */}
          <div className="col-span-12 lg:col-span-4 mt-8 lg:mt-0 lg:pl-10">
            <Label>By the Numbers</Label>
            <dl className="mt-4 border-l border-t border-ink font-mono">
              {[
                ["Agents submitted", stats?.agents],
                ["Published scores", stats?.scored],
                ["Reviewers on staff", stats?.reviewers],
                ["Tasks in library", stats?.tasks],
                ["Average trust", stats?.avg_trust],
              ].map(([k, v]) => (
                <div key={k as string} className="border-r border-b border-ink p-4 flex items-baseline justify-between">
                  <span className="label text-[0.6rem] text-neutral-500">{k}</span>
                  <span className="text-3xl">{v ?? "—"}</span>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="py-14 grid grid-cols-12 gap-0 border-b border-ink">
        <div className="col-span-12 lg:col-span-4 lg:border-r border-ink lg:pr-8">
          <Label className="text-editorial">The Problem</Label>
          <h2 className="mt-3 font-serif font-black text-4xl lg:text-5xl leading-[0.95]">
            40% of agentic projects will be cancelled.
          </h2>
        </div>
        <div className="col-span-12 lg:col-span-8 lg:pl-8 mt-6 lg:mt-0 font-body text-lg leading-relaxed text-neutral-700 columns-1 md:columns-2 gap-8 text-justify">
          <p>
            Gartner expects over 40% of agentic AI projects to be cancelled by end of 2027, and
            estimates only about 130 of thousands of agentic vendors are real. Existing
            certification audits enterprise platforms for security — not whether the agent is any
            good at the task you are paying it to do.
          </p>
          <p className="mt-4">
            We take the opposite approach: real tasks, human judgment, and a score that moves when
            the agent changes. No self-reported benchmarks, no vanity leaderboards — just a number
            you can put next to a purchase order.
          </p>
        </div>
      </section>

      {/* How it works — inverted section */}
      <section className="my-14 bg-ink text-paper -mx-4 px-4 py-14">
        <div className="max-w-screen-xl mx-auto">
          <Label className="text-neutral-400">How It Works</Label>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 border-l border-t border-neutral-700">
            {[
              ["01", "Submit", "A member submits an agent and pays a per-agent vetting fee."],
              ["02", "Run", "We run it against a curated task library and record cost, time and version."],
              ["03", "Review", "Vetted reviewers score each blind output against a rubric."],
              ["04", "Score", "A 0–100 trust score is published — and re-tested on every update."],
            ].map(([n, t, d]) => (
              <div key={n} className="border-r border-b border-neutral-700 p-6">
                <div className="font-mono text-editorial text-2xl">{n}</div>
                <div className="mt-2 font-serif font-bold text-2xl">{t}</div>
                <p className="mt-2 font-body text-neutral-400 text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-6 border-b border-ink">
        <Label>Rates</Label>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 border-l border-t border-ink">
          <div className="border-r border-b border-ink p-8">
            <div className="font-serif font-bold text-2xl">Membership</div>
            <div className="mt-2 font-mono text-5xl">$200<span className="text-lg text-neutral-500">/mo</span></div>
            <p className="mt-3 font-body text-neutral-600">Access to every published score, breakdown and version history.</p>
            <div className="mt-6"><LinkButton to={cta}>Become a member</LinkButton></div>
          </div>
          <div className="border-r border-b border-ink p-8">
            <div className="font-serif font-bold text-2xl">Per-agent vetting</div>
            <div className="mt-2 font-mono text-5xl">$400</div>
            <p className="mt-3 font-body text-neutral-600">Ten tasks × two reviews. Get a trust score before you commit budget.</p>
            <div className="mt-6"><LinkButton to="/submit" variant="secondary">Submit an agent</LinkButton></div>
          </div>
        </div>
      </section>

      <Ornament />
      <div className="pb-10 text-center">
        <p className="font-body text-neutral-600">Already have an account?</p>
        <Link to="/login" className="label text-[0.7rem] hover:text-editorial">Sign in to the platform →</Link>
      </div>
    </div>
  );
}
