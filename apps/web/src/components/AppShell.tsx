// Internal platform shell (Material You): app bar + role-aware nav + blobs.
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Chip } from "./md";

const NAV: Record<string, { to: string; label: string; external?: boolean }[]> = {
  member: [
    { to: "/app", label: "Dashboard" },
    { to: "/directory", label: "Directory", external: true },
    { to: "/submit", label: "Submit Agent" },
    { to: "/account", label: "Account" },
  ],
  reviewer: [
    { to: "/app", label: "Dashboard" },
    { to: "/review", label: "Review Desk" },
    { to: "/account", label: "Account" },
  ],
  admin: [
    { to: "/app", label: "Dashboard" },
    { to: "/admin", label: "Admin" },
    { to: "/directory", label: "Directory", external: true },
    { to: "/submit", label: "Submit Agent" },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const nav = useNavigate();
  const links = NAV[session?.role ?? "member"] ?? NAV.member;

  return (
    <div className="md min-h-screen relative">
      {/* App bar */}
      <header className="sticky top-0 z-40 bg-md-bg/80 backdrop-blur-md border-b border-md-surface-low">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/app" className="font-roboto font-medium text-lg text-md-on flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-md-primary text-white grid place-items-center text-sm">AT</span>
              Trust Platform
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {links.map((l) =>
                l.external ? (
                  <Link
                    key={l.to}
                    to={l.to}
                    className="rounded-full px-4 h-9 inline-flex items-center font-roboto text-sm text-md-on-variant hover:bg-md-primary/10 md-ease transition-colors"
                  >
                    {l.label} ↗
                  </Link>
                ) : (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === "/app"}
                    className={({ isActive }) =>
                      `rounded-full px-4 h-9 inline-flex items-center font-roboto text-sm md-ease transition-colors ${
                        isActive ? "bg-md-secondary-container text-md-on-secondary-container" : "text-md-on-variant hover:bg-md-primary/10"
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                ),
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {session && (
              <>
                <span className="hidden sm:block"><Chip tone="primary">{session.role}</Chip></span>
                <span className="hidden lg:block font-roboto text-sm text-md-on-variant">{session.email}</span>
                <button
                  onClick={() => { logout(); nav("/"); }}
                  className="rounded-full px-4 h-9 font-roboto text-sm text-md-primary hover:bg-md-primary/10 md-ease transition-colors active:scale-95"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Content with atmospheric blobs */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="md-blob bg-md-primary w-[30rem] h-[30rem] -top-40 -left-32 opacity-20" />
          <div className="md-blob bg-md-tertiary w-[26rem] h-[26rem] top-96 -right-32 opacity-20" />
        </div>
        <main className="relative max-w-6xl mx-auto px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
