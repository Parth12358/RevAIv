import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { MdCard, MdButton, Chip } from "../components/md";

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
      if (r.checkout_url) {
        window.location.href = r.checkout_url;
      } else if (r.dummy) {
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
      <h1 className="font-roboto text-4xl font-medium text-md-on">Account</h1>
      <p className="mt-1 font-roboto text-md-on-variant">{session?.email} · <span className="capitalize">{session?.role}</span></p>

      {session?.role === "member" && (
        <MdCard className="mt-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-roboto text-sm text-md-on-variant">Membership</div>
              <div className="font-roboto text-2xl font-medium text-md-on flex items-center gap-2">
                {membershipActive ? "Active" : "Inactive"}
                <Chip tone={membershipActive ? "success" : "error"}>{membershipActive ? "Full access" : "Locked"}</Chip>
              </div>
              {status && (
                <p className="mt-1 font-roboto text-sm text-md-on-variant">
                  ${status.price_usd}/month · {status.stripe_configured ? "Stripe test mode" : "demo mode (no real charge)"}
                </p>
              )}
            </div>
            {!membershipActive && (
              <MdButton onClick={subscribe} disabled={busy} className="h-12">
                {busy ? "Redirecting…" : `Subscribe · $${status?.price_usd ?? 200}/mo`}
              </MdButton>
            )}
          </div>
          {msg && <p className="mt-4 font-roboto text-sm text-md-primary">{msg}</p>}
        </MdCard>
      )}

      {(session?.role === "reviewer" || session?.role === "admin") && rstats && (
        <MdCard className="mt-6">
          <div className="font-roboto text-sm text-md-on-variant">Reviewer profile</div>
          <div className="font-roboto text-2xl font-medium text-md-on">{rstats.display_name ?? "—"}</div>
          {rstats.headline && <p className="font-roboto text-md-on-variant">{rstats.headline}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip tone={rstats.qualified ? "success" : "error"}>{rstats.qualified ? "Qualified" : "Unqualified"}</Chip>
            <Chip>{Math.round((rstats.gold_accuracy ?? 0) * 100)}% gold accuracy</Chip>
            <Chip>{rstats.reviews_count ?? 0} reviews</Chip>
            {(rstats.expertise ?? []).map((e: string) => <Chip key={e} tone="primary">{e.replace(/_/g, " ")}</Chip>)}
          </div>
          {rstats.bio && <p className="mt-3 font-roboto text-md-on-variant">{rstats.bio}</p>}
        </MdCard>
      )}
    </div>
  );
}
