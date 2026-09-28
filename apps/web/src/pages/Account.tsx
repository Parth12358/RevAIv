import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Label, Button, Tag, Ornament } from "../components/ui";

export default function Account() {
  const { session, membershipActive, refresh } = useAuth();
  const [status, setStatus] = useState<{ stripe_configured: boolean; price_usd: number } | null>(null);
  const [rstats, setRstats] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    api.billingStatus().then(setStatus).catch(() => {});
    if (session?.role === "reviewer" || session?.role === "admin")
      api.reviewerStats().then((r) => setRstats(r.stats)).catch(() => {});
  }, [session]);

  async function subscribe() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.billingCheckout();
      if (r.checkout_url) window.location.href = r.checkout_url;
      else if (r.dummy) {
        await api.dummyActivate();
        await refresh();
        setMsg("Membership activated (demo mode — no real charge).");
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Label className="text-editorial">Account</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl leading-[0.9]">Your account.</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-neutral-500">{session?.email} · {session?.role}</p>

      {session?.role === "member" && (
        <div className="mt-6 p-6 border-2 border-ink">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Label>Membership</Label>
              <div className="mt-1 font-serif font-bold text-3xl flex items-center gap-3">
                {membershipActive ? "Active" : "Inactive"}
                <Tag tone={membershipActive ? "solid" : "editorial"}>{membershipActive ? "Full access" : "Locked"}</Tag>
              </div>
              {status && (
                <p className="mt-2 font-mono text-xs text-neutral-500">
                  ${status.price_usd}/month · {status.stripe_configured ? "Stripe test mode" : "demo mode (no real charge)"}
                </p>
              )}
            </div>
            {!membershipActive && <Button onClick={subscribe} disabled={busy}>{busy ? "Redirecting…" : `Subscribe · $${status?.price_usd ?? 200}/mo`}</Button>}
          </div>
          {msg && <p className="mt-4 font-mono text-xs text-editorial">{msg}</p>}
        </div>
      )}

      {(session?.role === "reviewer" || session?.role === "admin") && rstats && (
        <div className="mt-6 p-6 border-2 border-ink">
          <Label>Reviewer Profile</Label>
          <div className="mt-1 font-serif font-bold text-3xl">{rstats.display_name ?? "—"}</div>
          {rstats.headline && <p className="font-body text-neutral-600">{rstats.headline}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Tag tone={rstats.qualified ? "solid" : "editorial"}>{rstats.qualified ? "Qualified" : "Unqualified"}</Tag>
            <Tag>{Math.round((rstats.gold_accuracy ?? 0) * 100)}% gold accuracy</Tag>
            <Tag>{rstats.reviews_count ?? 0} reviews</Tag>
            {(rstats.expertise ?? []).map((e: string) => <Tag key={e}>{e.replace(/_/g, " ")}</Tag>)}
          </div>
          {rstats.bio && <p className="mt-3 font-body text-neutral-700">{rstats.bio}</p>}
          {rstats.linkedin_url && (
            <a href={rstats.linkedin_url} target="_blank" rel="noreferrer" className="mt-3 inline-block label text-[0.65rem] underline decoration-2 decoration-editorial underline-offset-4 hover:text-editorial">
              LinkedIn ↗
            </a>
          )}
        </div>
      )}

      {/* Reviewer earnings */}
      {(session?.role === "reviewer" || session?.role === "admin") && rstats && (() => {
        const rate = 3.5;
        const reviews = rstats.reviews_count ?? 0;
        const gross = reviews * rate;
        const paid = Math.round(reviews * 0.6) * rate; // demo split
        const pending = gross - paid;
        return (
          <div className="mt-6 p-6 border-2 border-ink">
            <div className="flex items-center justify-between">
              <Label>Earnings</Label>
              <Tag>Test mode · no real payout</Tag>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 border-l border-t border-ink font-mono">
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.55rem] text-neutral-500">Reviews</div>
                <div className="mt-1 text-3xl">{reviews}</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.55rem] text-neutral-500">Rate / review</div>
                <div className="mt-1 text-3xl">${rate.toFixed(2)}</div>
              </div>
              <div className="border-r border-b border-ink p-4 bg-ink text-paper">
                <div className="label text-[0.55rem] text-neutral-400">Earned</div>
                <div className="mt-1 text-3xl">${gross.toFixed(2)}</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.55rem] text-neutral-500">Pending payout</div>
                <div className="mt-1 text-3xl">${pending.toFixed(2)}</div>
              </div>
            </div>
            <p className="mt-3 font-mono text-[0.65rem] text-neutral-500">
              ${paid.toFixed(2)} paid to date · ${pending.toFixed(2)} pending · Payouts run via Stripe Connect (test mode) at ${rate.toFixed(2)} per accepted review.
            </p>
          </div>
        );
      })()}

      <Ornament />
    </div>
  );
}
