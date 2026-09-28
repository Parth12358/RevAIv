import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import type { Role } from "./lib/api";
import { NewsprintLayout } from "./components/NewsprintLayout";
import { AppShell } from "./components/AppShell";

// Front-of-house pages
import Home from "./pages/Home";
import Directory from "./pages/Directory";
import AgentDetail from "./pages/AgentDetail";
// Internal platform pages
import Login from "./pages/Login";
import Join from "./pages/Join";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import Submit from "./pages/Submit";
import Reviewer from "./pages/Reviewer";
import WriteTask from "./pages/WriteTask";
import Qualify from "./pages/Qualify";
import Admin from "./pages/Admin";

function News({ children }: { children: ReactNode }) {
  return <NewsprintLayout>{children}</NewsprintLayout>;
}

// Guard for internal platform routes. Redirects unauthenticated users to /login
// and un-onboarded non-admins to /onboarding.
function Protected({
  children,
  roles,
  skipOnboardGate = false,
}: {
  children: ReactNode;
  roles?: Role[];
  skipOnboardGate?: boolean;
}) {
  const { session, onboarded, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="newsprint min-h-screen grid place-items-center font-mono text-sm text-neutral-500">Loading…</div>;
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/app" replace />;
  if (!skipOnboardGate && !onboarded && session.role !== "admin") return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Front-of-house — Newsprint */}
        <Route path="/" element={<News><Home /></News>} />
        <Route path="/directory" element={<News><Directory /></News>} />
        <Route path="/agents/:id" element={<News><AgentDetail /></News>} />

        {/* Auth — standalone (no shell) */}
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />

        {/* Onboarding — inside the shell but skips its own gate */}
        <Route path="/onboarding" element={<Protected skipOnboardGate><Onboarding /></Protected>} />

        {/* Internal platform */}
        <Route path="/app" element={<Protected><Dashboard /></Protected>} />
        <Route path="/account" element={<Protected><Account /></Protected>} />
        <Route path="/submit" element={<Protected roles={["member", "admin"]}><Submit /></Protected>} />
        <Route path="/review" element={<Protected roles={["reviewer", "admin"]}><Reviewer /></Protected>} />
        <Route path="/write-task" element={<Protected roles={["reviewer", "admin"]}><WriteTask /></Protected>} />
        <Route path="/qualify" element={<Protected roles={["reviewer", "admin"]}><Qualify /></Protected>} />
        <Route path="/admin" element={<Protected roles={["admin"]}><Admin /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
