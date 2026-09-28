// Front-of-house shell (Newsprint): masthead + ticker + footer.
import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Ticker } from "./Ticker";

const EDITION_DATE = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

function Masthead() {
  const { session } = useAuth();
  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/directory", label: "Agents" },
    { to: "/reviewers", label: "Reviewers" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-paper border-b-4 border-ink">
      <div className="border-b border-ink">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between gap-3 h-8 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-600">
          <span className="truncate">{EDITION_DATE}</span>
          <span className="hidden md:block truncate">Find AI agents you can trust</span>
          <span className="hidden sm:block shrink-0">RevAI</span>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="font-serif font-black tracking-tighter leading-none text-2xl sm:text-4xl">
          RevAI
        </Link>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {session ? (
            <Link to="/app" className="label text-[0.65rem] hover:text-editorial">
              Go to my account →
            </Link>
          ) : (
            <>
              <Link to="/login" className="label text-[0.65rem] hover:text-editorial">Sign in</Link>
              <Link to="/join" className="label text-[0.65rem] bg-ink text-paper px-4 py-2 hover:bg-editorial transition-colors">Join</Link>
            </>
          )}
        </div>
      </div>
      <nav className="border-t border-ink">
        <div className="max-w-screen-xl mx-auto px-4 flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `label text-[0.7rem] py-3 pr-8 transition-colors ${isActive ? "text-editorial" : "text-ink hover:text-editorial"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-ink bg-ink text-paper">
      <div className="max-w-screen-xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="font-serif font-black text-2xl tracking-tighter">RevAI</div>
          <p className="mt-3 font-body text-neutral-400 text-sm max-w-sm leading-relaxed">
            We test AI agents on real tasks and let people who know the field rate them.
            Each agent gets one clear score. Scores are opinions, not promises.
          </p>
        </div>
        <div>
          <div className="label text-neutral-500 mb-3">Pages</div>
          <ul className="space-y-2 font-sans text-sm">
            <li><Link to="/" className="hover:text-editorial">Home</Link></li>
            <li><Link to="/directory" className="hover:text-editorial">Agents</Link></li>
            <li><Link to="/reviewers" className="hover:text-editorial">Reviewers</Link></li>
            <li><Link to="/join" className="hover:text-editorial">Sign up</Link></li>
          </ul>
        </div>
        <div>
          <div className="label text-neutral-500 mb-3">About</div>
          <p className="font-mono text-[0.7rem] text-neutral-400 leading-relaxed">
            Built on Cloudflare<br />Scored by real people<br />Made in 2026
          </p>
        </div>
      </div>
    </footer>
  );
}

export function NewsprintLayout({ children }: { children: ReactNode }) {
  return (
    <div className="newsprint min-h-screen flex flex-col">
      <Masthead />
      <Ticker />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4">{children}</main>
      <Footer />
    </div>
  );
}
