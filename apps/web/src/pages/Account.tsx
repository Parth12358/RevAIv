import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Label, Button, Field, TextArea, Tag, Ornament } from "../components/ui";

export default function Account() {
  const { session, membershipActive, refresh } = useAuth();
  const [status, setStatus] = useState<{ stripe_configured: boolean; price_usd: number } | null>(null);
  const [rstats, setRstats] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Editable reviewer profile
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [country, setCountry] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [bio, setBio] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const isReviewer = session?.role === "reviewer" || session?.role === "admin";

  useEffect(() => {
    api.billingStatus().then(setStatus).catch(() => {});
    if (isReviewer) {
      api.categories().then((r) => setCats(r.categories)).catch(() => {});
      api.reviewerStats().then((r) => {
        const s = r.stats;
        setRstats(s);
        setName(s?.display_name ?? "");
        setHeadline(s?.headline ?? "");
        setCountry(s?.country ?? "");
        setLinkedin(s?.linkedin_url ?? "");
        setBio(s?.bio ?? "");
        setFields(s?.expertise ?? []);
      }).catch(() => {});
    }
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
        setMsg("You're a member now (demo mode — no real charge).");
      }
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggleField = (k: string) => setFields((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  async function saveProfile() {
    setBusy(true);
    setSavedMsg(null);
    try {
      await api.onboard({
        display_name: name,
        headline: headline || undefined,
        country: country || undefined,
        linkedin_url: linkedin || undefined,
        bio: bio || undefined,
        expertise: fields,
      });
      setSavedMsg("Saved.");
    } catch (e) {
      setSavedMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Label className="text-editorial">Account</Label>
      <h1 className="mt-2 font-serif font-black tracking-tighter text-5xl leading-[0.9]">Your account.</h1>
      <p className="mt-3 font-mono text-xs uppercase tracking-widest text-neutral-500">{session?.email} · {session?.role === "member" ? "buyer" : session?.role}</p>

      {session?.role === "member" && (
        <div className="mt-6 p-6 border-2 border-ink">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <Label>Membership</Label>
              <div className="mt-1 font-serif font-bold text-3xl flex items-center gap-3">
                {membershipActive ? "Member" : "Not a member"}
                <Tag tone={membershipActive ? "solid" : "editorial"}>{membershipActive ? "Can see scores" : "Locked"}</Tag>
              </div>
              {status && (
                <p className="mt-2 font-mono text-xs text-neutral-500">
                  ${status.price_usd}/month · {status.stripe_configured ? "test payment" : "demo mode (no real charge)"}
                </p>
              )}
            </div>
            {!membershipActive && <Button onClick={subscribe} disabled={busy}>{busy ? "One sec…" : `Join · $${status?.price_usd ?? 200}/mo`}</Button>}
          </div>
          {msg && <p className="mt-4 font-mono text-xs text-editorial">{msg}</p>}
        </div>
      )}

      {/* Reviewer profile — editable (shown next to your reviews) */}
      {isReviewer && (
        <div className="mt-6 p-6 border-2 border-ink">
          <Label>Your public profile</Label>
          <p className="mt-1 font-body text-sm text-neutral-600">This shows next to every review you write.</p>
          <div className="mt-4 space-y-4">
            <Field label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
            <Field label="One-line about you" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Mechanical engineer, 10 years" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
              <Field label="LinkedIn (optional)" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" />
            </div>
            <div>
              <Label className="block mb-2">Fields you know</Label>
              <div className="flex flex-wrap gap-2">
                {cats.map((cat) => {
                  const on = fields.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => toggleField(cat.key)}
                      className={`px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest border border-ink transition-colors ${on ? "bg-ink text-paper" : "hover:bg-neutral-100"}`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <TextArea label="Short bio (optional)" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A sentence or two about your work." />
            <div className="flex items-center gap-4">
              <Button onClick={saveProfile} disabled={busy || !name}>{busy ? "Saving…" : "Save profile"}</Button>
              {savedMsg && <span className="font-mono text-xs text-neutral-600">{savedMsg}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Reviewer pay */}
      {isReviewer && rstats && (() => {
        const rate = 3.5;
        const reviews = rstats.reviews_count ?? 0;
        const gross = reviews * rate;
        const paid = Math.round(reviews * 0.6) * rate; // demo split
        const pending = gross - paid;
        return (
          <div className="mt-6 p-6 border-2 border-ink">
            <div className="flex items-center justify-between">
              <Label>Your pay</Label>
              <Tag>Demo · no real payout</Tag>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 border-l border-t border-ink font-mono">
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.55rem] text-neutral-500">Reviews</div>
                <div className="mt-1 text-3xl">{reviews}</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.55rem] text-neutral-500">Per review</div>
                <div className="mt-1 text-3xl">${rate.toFixed(2)}</div>
              </div>
              <div className="border-r border-b border-ink p-4 bg-ink text-paper">
                <div className="label text-[0.55rem] text-neutral-400">Earned</div>
                <div className="mt-1 text-3xl">${gross.toFixed(2)}</div>
              </div>
              <div className="border-r border-b border-ink p-4">
                <div className="label text-[0.55rem] text-neutral-500">Not paid yet</div>
                <div className="mt-1 text-3xl">${pending.toFixed(2)}</div>
              </div>
            </div>
            <p className="mt-3 font-mono text-[0.65rem] text-neutral-500">
              ${paid.toFixed(2)} paid so far · ${pending.toFixed(2)} still to come · ${rate.toFixed(2)} for each review.
            </p>
          </div>
        );
      })()}

      <Ornament />
    </div>
  );
}
