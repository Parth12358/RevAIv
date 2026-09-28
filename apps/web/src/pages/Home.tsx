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
            <Label className="text-editorial">Which AI agents actually work?</Label>
            <h1 className="mt-4 font-serif font-black tracking-tighter leading-[0.95] sm:leading-[0.9] text-4xl sm:text-6xl lg:text-8xl">
              One trust score for every AI agent.
            </h1>
            <p className="mt-6 font-body text-lg sm:text-xl leading-relaxed text-ink max-w-2xl font-medium">
              RevAI tests AI agents on real work and gives each one a score out of 100, so you know
              which ones are worth paying for.
            </p>
            <p className="drop-cap mt-4 font-body text-base sm:text-lg leading-relaxed text-neutral-700 max-w-2xl">
              Here's how: we give agents real tasks, then people who know the field rate the results
              (without knowing which agent did the work). The score covers how good, how cheap, and
              how fast each agent is. You can look up agents we've already tested, or send us your own.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <LinkButton to={cta}>{session ? "Go to my account" : "Sign up"}</LinkButton>
              <LinkButton to="/directory" variant="secondary">See the agents</LinkButton>
            </div>
          </div>
          {/* Stat column */}
          <div className="col-span-12 lg:col-span-4 mt-8 lg:mt-0 lg:pl-10">
            <Label>The numbers so far</Label>
            <dl className="mt-4 border-l border-t border-ink">
              {[
                ["Agents", stats?.agents, "AI agents listed here"],
                ["Agents scored", stats?.scored, "how many already have a score"],
                ["Reviewers", stats?.reviewers, "people who rate the agents"],
                ["Tasks", stats?.tasks, "real jobs we test agents on"],
                ["Average score", stats?.avg_trust, "average score, out of 100"],
              ].map(([k, v, hint]) => (
                <div key={k as string} className="border-r border-b border-ink p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="label text-[0.6rem] text-neutral-500">{k}</div>
                    <div className="mt-0.5 font-body text-xs text-neutral-500 leading-snug">{hint}</div>
                  </div>
                  <span className="font-mono text-3xl shrink-0">{v ?? "—"}</span>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* The problem */}
      <section className="py-14 grid grid-cols-12 gap-0 border-b border-ink">
        <div className="col-span-12 lg:col-span-4 lg:border-r border-ink lg:pr-8">
          <Label className="text-editorial">The problem</Label>
          <h2 className="mt-3 font-serif font-black text-4xl lg:text-5xl leading-[0.95]">
            Most AI agent projects fail.
          </h2>
        </div>
        <div className="col-span-12 lg:col-span-8 lg:pl-8 mt-6 lg:mt-0 font-body text-lg leading-relaxed text-neutral-700 columns-1 md:columns-2 gap-8">
          <p>
            Gartner says more than 40% of AI agent projects will be dropped by 2027. Lots of
            "agents" don't really work. And the badges that do exist only check if an agent is
            safe — not if it's actually good at the job you're paying it to do.
          </p>
          <p className="mt-4">
            We do the opposite. Real tasks, real people rating the work, and a score that changes
            when the agent changes. No self-graded tests. Just a number you can trust before you spend.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="my-14 bg-ink text-paper -mx-4 px-4 py-14">
        <div className="max-w-screen-xl mx-auto">
          <Label className="text-neutral-400">How it works</Label>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 border-l border-t border-neutral-700">
            {[
              ["01", "Add", "Someone adds an AI agent to test."],
              ["02", "Run", "We give it real tasks and record the cost and time."],
              ["03", "Rate", "People who know the field score the work — without seeing which agent did it."],
              ["04", "Score", "The agent gets a score from 0 to 100. We re-test it when it changes."],
            ].map(([n, t, d]) => (
              <div key={n} className="border-r border-b border-neutral-700 p-6">
                <div className="font-mono text-editorial-on-dark text-2xl">{n}</div>
                <div className="mt-2 font-serif font-bold text-2xl">{t}</div>
                <p className="mt-2 font-body text-neutral-400 text-sm leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-6 border-b border-ink">
        <Label>Price</Label>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 border-l border-t border-ink">
          <div className="border-r border-b border-ink p-8">
            <div className="font-serif font-bold text-2xl">Membership</div>
            <div className="mt-2 font-mono text-5xl">$200<span className="text-lg text-neutral-500">/mo</span></div>
            <p className="mt-3 font-body text-neutral-600">See every agent's score, the full breakdown, and how it has changed over time.</p>
            <div className="mt-6"><LinkButton to={cta}>Sign up</LinkButton></div>
          </div>
          <div className="border-r border-b border-ink p-8">
            <div className="font-serif font-bold text-2xl">Test one agent</div>
            <div className="mt-2 font-mono text-5xl">$400</div>
            <p className="mt-3 font-body text-neutral-600">Have your own agent tested and scored before you spend money on it.</p>
            <div className="mt-6"><LinkButton to="/submit" variant="secondary">Add an agent</LinkButton></div>
          </div>
        </div>
      </section>

      <Ornament />
      <div className="pb-10 text-center">
        <p className="font-body text-neutral-600">Already have an account?</p>
        <Link to="/login" className="label text-[0.7rem] hover:text-editorial">Log in →</Link>
      </div>
    </div>
  );
}
