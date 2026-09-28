import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { Role } from "../lib/api";
import { Button, Field } from "../components/ui";

const ROLES: { key: Role; title: string; blurb: string }[] = [
  { key: "member", title: "Buyer", blurb: "See which AI agents are good, and test your own." },
  { key: "reviewer", title: "Reviewer", blurb: "Get paid to rate AI agents in your field." },
];

export default function Join() {
  const { session, signup } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialRole: Role = params.get("role") === "reviewer" ? "reviewer" : "member";
  const [role, setRole] = useState<Role>(initialRole);
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
      nav("/app", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="newsprint min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-lg border-4 border-ink bg-paper p-8">
        <Link to="/" className="label text-[0.6rem] hover:text-editorial">← RevAI</Link>
        <h1 className="mt-4 font-serif font-black tracking-tighter text-4xl leading-[0.95]">Sign up.</h1>
        <p className="mt-2 font-body text-neutral-600">Pick how you'll use RevAI.</p>

        <div className="mt-6 grid grid-cols-2 border-l border-t border-ink">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={`text-left border-r border-b border-ink p-5 transition-colors ${
                role === r.key ? "bg-ink text-paper" : "hover:bg-neutral-100"
              }`}
            >
              <div className="font-serif font-bold text-xl">{r.title}</div>
              <div className={`mt-1 font-body text-sm ${role === r.key ? "text-neutral-300" : "text-neutral-600"}`}>{r.blurb}</div>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          <Field label="Password (min 8 chars)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" required minLength={8} />
          {err && <p className="font-mono text-xs text-editorial">{err}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : `Sign up as ${role === "member" ? "Buyer" : "Reviewer"}`}
          </Button>
        </form>
        <p className="mt-6 font-body text-sm text-neutral-600">
          Already have an account? <Link to="/login" className="underline decoration-2 decoration-editorial underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
