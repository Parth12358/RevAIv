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
    { to: "/", label: "Front Page", end: true },
    { to: "/directory", label: "The Directory" },
  ];
  return (
    <header className="sticky top-0 z-40 bg-paper border-b-4 border-ink">
      <div className="border-b border-ink">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-8 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-600">
          <span>Vol. 1 · {EDITION_DATE}</span>
          <span className="hidden sm:block">New York Edition · Price: One Membership</span>
          <span>Est. 2026</span>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-serif font-black tracking-tighter leading-none text-3xl sm:text-4xl">
          The Agent Trust Ledger
        </Link>
        <div className="flex items-center gap-4">
          {session ? (
            <Link to="/app" className="label text-[0.65rem] hover:text-editorial">
              Enter Platform →
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
          <div className="font-serif font-black text-2xl tracking-tighter">The Agent Trust Ledger</div>
          <p className="mt-3 font-body text-neutral-400 text-sm max-w-sm leading-relaxed">
            A membership directory of AI agents, scored on real tasks judged by vetted human
            reviewers and re-tested on every version. Scores are opinions, not guarantees.
          </p>
        </div>
        <div>
          <div className="label text-neutral-500 mb-3">Sections</div>
          <ul className="space-y-2 font-sans text-sm">
            <li><Link to="/" className="hover:text-editorial">Front Page</Link></li>
            <li><Link to="/directory" className="hover:text-editorial">The Directory</Link></li>
            <li><Link to="/join" className="hover:text-editorial">Join</Link></li>
          </ul>
        </div>
        <div>
          <div className="label text-neutral-500 mb-3">Colophon</div>
          <p className="font-mono text-[0.7rem] text-neutral-400 leading-relaxed">
            Edition: Vol 1.0<br />Printed in NYC<br />Set in Playfair &amp; Lora
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
