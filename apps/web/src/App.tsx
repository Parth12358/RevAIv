import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import type { Role } from "./lib/api";
import { NewsprintLayout } from "./components/NewsprintLayout";
import { AppShell } from "./components/AppShell";

// Public pages
import Home from "./pages/Home";
import Directory from "./pages/Directory";
import AgentDetail from "./pages/AgentDetail";
import Reviewers from "./pages/Reviewers";
import ReviewerProfile from "./pages/ReviewerProfile";
// Signed-in pages
import Login from "./pages/Login";
import Join from "./pages/Join";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import Submit from "./pages/Submit";
import FindExperts from "./pages/FindExperts";
import Reviewer from "./pages/Reviewer";
import WriteTask from "./pages/WriteTask";
import Qualify from "./pages/Qualify";
import Admin from "./pages/Admin";

function News({ children }: { children: ReactNode }) {
  return <NewsprintLayout>{children}</NewsprintLayout>;
}

// Guard for signed-in pages. Sends signed-out users to /login, and anyone
// without the right role back to their home page.
function Protected({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="newsprint min-h-screen grid place-items-center font-mono text-sm text-neutral-500">Loading…</div>;
  if (!session) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/app" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<News><Home /></News>} />
        <Route path="/directory" element={<News><Directory /></News>} />
        <Route path="/agents/:id" element={<News><AgentDetail /></News>} />
        <Route path="/reviewers" element={<News><Reviewers /></News>} />
        <Route path="/reviewers/:id" element={<News><ReviewerProfile /></News>} />

        {/* Auth — no shell */}
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />

        {/* Signed-in */}
        <Route path="/app" element={<Protected><Dashboard /></Protected>} />
        <Route path="/account" element={<Protected><Account /></Protected>} />
        <Route path="/submit" element={<Protected roles={["member", "admin"]}><Submit /></Protected>} />
        <Route path="/find-experts" element={<Protected roles={["member", "admin"]}><FindExperts /></Protected>} />
        <Route path="/review" element={<Protected roles={["reviewer", "admin"]}><Reviewer /></Protected>} />
        <Route path="/write-task" element={<Protected roles={["reviewer", "admin"]}><WriteTask /></Protected>} />
        <Route path="/qualify" element={<Protected roles={["reviewer", "admin"]}><Qualify /></Protected>} />
        <Route path="/admin" element={<Protected roles={["admin"]}><Admin /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
