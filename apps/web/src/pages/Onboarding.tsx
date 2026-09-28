import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Button, Field, Label, TextArea, Card } from "../components/ui";

export default function Onboarding() {
  const { session, onboarded, refresh } = useAuth();
  const nav = useNavigate();
  const isReviewer = session?.role === "reviewer";

  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [headline, setHeadline] = useState("");
  const [country, setCountry] = useState("");
  const [bio, setBio] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isReviewer) api.categories().then((r) => setCats(r.categories)).catch(() => {});
  }, [isReviewer]);
  useEffect(() => {
    if (session?.role === "admin" || onboarded) nav("/app", { replace: true });
  }, [onboarded, session]);

  const toggle = (k: string) => setExpertise((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      await api.onboard({
        display_name: displayName,
        company: company || undefined,
        use_case: useCase || undefined,
        headline: headline || undefined,
        expertise,
        bio: bio || undefined,
        country: country || undefined,
        linkedin_url: linkedin || undefined,
      });
      await refresh();
      nav("/app", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Label className="text-editorial">{isReviewer ? "Reviewer Onboarding" : "Customer Onboarding"}</Label>
      <h1 className="mt-3 font-serif font-black tracking-tighter text-4xl lg:text-5xl leading-[0.95]">
        {isReviewer ? "Set up your reviewer profile." : "Tell us about your team."}
      </h1>
      <p className="mt-3 font-body text-lg text-neutral-700">
        {isReviewer
          ? "Your name and expertise appear next to every review you write — a face behind the score."
          : "This helps us recommend the right agents and tasks for your use case."}
      </p>

      <Card className="mt-6 space-y-5">
        <Field label={isReviewer ? "Display name (public)" : "Your name"} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe" />
        {isReviewer ? (
          <>
            <Field label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="B2B SaaS GTM · ex-Outreach" />
            <Field label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
            <Field label="LinkedIn (optional)" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/you" />
            <div>
              <Label className="block mb-2">Fields you can review</Label>
              <div className="flex flex-wrap gap-2">
                {cats.map((cat) => {
                  const on = expertise.includes(cat.key);
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => toggle(cat.key)}
                      className={`px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest border border-ink transition-colors ${
                        on ? "bg-ink text-paper" : "hover:bg-neutral-100"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <TextArea label="Short bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="15 years in supply-chain planning; I judge operations and general-research tasks." />
          </>
        ) : (
          <>
            <Field label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
            <TextArea label="What are you trying to buy an agent for?" rows={3} value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="We need reliable lead research for outbound and want to compare vendors before committing budget." />
          </>
        )}
        {err && <p className="font-mono text-xs text-editorial">{err}</p>}
        <Button data-tour="onboarding-submit" onClick={submit} disabled={busy || !displayName}>{busy ? "Saving…" : "Finish setup"}</Button>
      </Card>
    </div>
  );
}
