import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/api";
import { MdButton, FilledField, Blobs } from "../components/md";

const ROLES: { key: Role; title: string; blurb: string }[] = [
  { key: "member", title: "Customer", blurb: "Browse vetted agents and submit your own for a trust score." },
  { key: "reviewer", title: "Reviewer", blurb: "Get paid to write tasks and judge agent outputs in your field." },
];

export default function Join() {
  const { session, signup } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<Role>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (session) return <Navigate to="/app" replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signup(email, password, role);
      nav("/onboarding", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="md min-h-screen relative grid place-items-center px-4 py-10">
      <Blobs />
      <div className="relative w-full max-w-lg bg-md-surface rounded-md-3xl shadow-md p-8">
        <Link to="/" className="font-roboto text-sm text-md-primary hover:underline">← The Agent Trust Ledger</Link>
        <h1 className="mt-4 font-roboto text-3xl font-medium text-md-on">Create your account</h1>
        <p className="mt-1 font-roboto text-md-on-variant">Choose how you'll use the platform.</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={`text-left rounded-3xl p-5 border md-ease transition-all duration-300 active:scale-95 ${
                role === r.key ? "border-md-primary bg-md-primary/5 ring-2 ring-md-primary" : "border-md-outline/40 hover:bg-md-primary/5"
              }`}
            >
              <div className="font-roboto font-medium text-md-on">{r.title}</div>
              <div className="mt-1 font-roboto text-sm text-md-on-variant">{r.blurb}</div>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <FilledField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          <FilledField label="Password (min 8 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} />
          {err && <p className="text-md-error text-sm font-roboto">{err}</p>}
          <MdButton type="submit" disabled={busy} className="w-full h-12">
            {busy ? "Creating…" : `Continue as ${role === "member" ? "Customer" : "Reviewer"}`}
          </MdButton>
        </form>
        <p className="mt-6 text-center font-roboto text-sm text-md-on-variant">
          Already have an account? <Link to="/login" className="text-md-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
