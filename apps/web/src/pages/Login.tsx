import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ApiError, type Role } from "../lib/api";
import { Button, Field, Label } from "../components/ui";

export default function Login() {
  const { session, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [roleChoices, setRoleChoices] = useState<Role[] | null>(null);

  if (session) return <Navigate to="/app" replace />;

  async function doLogin(role?: Role) {
    setBusy(true);
    setErr(null);
    try {
      await login(email, password, role);
      nav(loc.state?.from ?? "/app", { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.roles) {
        setRoleChoices(e.roles as Role[]);
      } else {
        setErr((e as Error).message);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await doLogin();
  }

  return (
    <div className="newsprint min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md border-4 border-ink bg-paper p-8">
        <Link to="/" className="label text-[0.6rem] hover:text-editorial">← RevAI</Link>
        <h1 className="mt-4 font-serif font-black tracking-tighter text-4xl leading-[0.95]">Log in.</h1>
        <p className="mt-2 font-body text-neutral-600">Welcome back.</p>
        {roleChoices ? (
          <div className="mt-6">
            <Label>This email has two accounts — pick one</Label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {roleChoices.map((r) => (
                <button key={r} onClick={() => doLogin(r)} disabled={busy}
                  className="border-2 border-ink p-4 hover:bg-ink hover:text-paper transition-colors">
                  <div className="font-serif font-bold text-lg capitalize">{r === "member" ? "Buyer" : r}</div>
                </button>
              ))}
            </div>
            <button onClick={() => setRoleChoices(null)} className="mt-4 label text-[0.6rem] hover:text-editorial">← back</button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
            {err && <p className="font-mono text-xs text-editorial">{err}</p>}
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        )}
        <p className="mt-6 font-body text-sm text-neutral-600">
          New here? <Link to="/join" className="underline decoration-2 decoration-editorial underline-offset-4">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
