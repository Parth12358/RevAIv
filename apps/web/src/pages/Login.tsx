import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { MdButton, FilledField, Blobs } from "../components/md";

export default function Login() {
  const { session, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
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
      await login(email, password);
      nav(loc.state?.from ?? "/app", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="md min-h-screen relative grid place-items-center px-4">
      <Blobs />
      <div className="relative w-full max-w-md bg-md-surface rounded-md-3xl shadow-md p-8">
        <Link to="/" className="font-roboto text-sm text-md-primary hover:underline">← The Agent Trust Ledger</Link>
        <h1 className="mt-4 font-roboto text-3xl font-medium text-md-on">Welcome back</h1>
        <p className="mt-1 font-roboto text-md-on-variant">Sign in to the platform.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <FilledField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          <FilledField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          {err && <p className="text-md-error text-sm font-roboto">{err}</p>}
          <MdButton type="submit" disabled={busy} className="w-full h-12">
            {busy ? "Signing in…" : "Sign in"}
          </MdButton>
        </form>
        <p className="mt-6 text-center font-roboto text-sm text-md-on-variant">
          New here? <Link to="/join" className="text-md-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
