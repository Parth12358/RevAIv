// Internal platform shell — Newsprint, consistent with the public masthead.
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const NAV: Record<string, { to: string; label: string; external?: boolean }[]> = {
  member: [
    { to: "/app", label: "Home" },
    { to: "/directory", label: "Agents" },
    { to: "/submit", label: "Add an agent" },
    { to: "/find-experts", label: "Find experts" },
    { to: "/account", label: "Account" },
  ],
  reviewer: [
    { to: "/app", label: "Home" },
    { to: "/review", label: "Review" },
    { to: "/write-task", label: "Write a task" },
    { to: "/directory", label: "Agents" },
    { to: "/account", label: "Account" },
  ],
  admin: [
    { to: "/app", label: "Home" },
    { to: "/admin", label: "Admin" },
    { to: "/directory", label: "Agents" },
    { to: "/submit", label: "Add an agent" },
  ],
};

const EDITION_DATE = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout, impersonating, stopImpersonating } = useAuth();
  const nav = useNavigate();
  const links = NAV[session?.role ?? "member"] ?? NAV.member;

  return (
    <div className="newsprint min-h-screen flex flex-col">
      {impersonating && (
        <div className="bg-editorial text-paper">
          <div className="max-w-screen-xl mx-auto px-4 h-9 flex items-center justify-between font-mono text-[0.65rem] uppercase tracking-widest">
            <span>Admin preview — viewing as demo {session?.role}</span>
            <button onClick={async () => { await stopImpersonating(); nav("/admin"); }} className="underline hover:no-underline">
              Return to admin →
            </button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-40 bg-paper border-b-4 border-ink">
        <div className="border-b border-ink">
          <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-8 font-mono text-[0.65rem] uppercase tracking-widest text-neutral-600">
            <span>{EDITION_DATE}</span>
            <span className="hidden sm:block">Signed in as {session?.role === "member" ? "buyer" : session?.role}</span>
            <span>RevAI</span>
          </div>
        </div>
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/app" className="font-serif font-black tracking-tighter leading-none text-2xl sm:text-3xl">
            RevAI
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline label text-[0.6rem] text-neutral-500">{session?.email}</span>
            <button
              onClick={() => { logout(); nav("/"); }}
              className="label text-[0.65rem] text-ink hover:text-editorial transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="border-t border-ink">
          <div className="max-w-screen-xl mx-auto px-4 flex flex-wrap">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/app"}
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
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
