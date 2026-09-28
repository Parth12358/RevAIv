import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { MdButton, FilledField, MdCard, Chip } from "../components/md";

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
  const [expertise, setExpertise] = useState<string[]>([]);
  const [cats, setCats] = useState<{ key: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isReviewer) api.categories().then((r) => setCats(r.categories)).catch(() => {});
  }, [isReviewer]);

  useEffect(() => {
    if (session?.role === "admin") nav("/app", { replace: true });
    else if (onboarded) nav("/app", { replace: true });
  }, [onboarded, session]);

  const toggle = (k: string) =>
    setExpertise((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));

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
      <Chip tone="primary">{isReviewer ? "Reviewer onboarding" : "Customer onboarding"}</Chip>
      <h1 className="mt-3 font-roboto text-4xl font-medium text-md-on">
        {isReviewer ? "Set up your reviewer profile" : "Tell us about your team"}
      </h1>
      <p className="mt-2 font-roboto text-md-on-variant">
        {isReviewer
          ? "Your name and expertise appear next to every review you write — a face behind the score."
          : "This helps us recommend the right agents and tasks for your use case."}
      </p>

      <MdCard className="mt-6">
        <div className="space-y-5">
          <FilledField label={isReviewer ? "Display name (public)" : "Your name"} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Doe" />

          {isReviewer ? (
            <>
              <FilledField label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="B2B SaaS GTM · ex-Outreach" />
              <FilledField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United States" />
              <div>
                <span className="block mb-2 ml-1 text-sm font-roboto text-md-on-variant">Fields you can review</span>
                <div className="flex flex-wrap gap-2">
                  {cats.map((cat) => {
                    const on = expertise.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => toggle(cat.key)}
                        className={`rounded-full px-4 h-9 text-sm font-roboto md-ease transition-all active:scale-95 ${
                          on ? "bg-md-primary text-white" : "bg-md-surface-low text-md-on-variant hover:bg-md-primary/10"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <span className="block mb-1 ml-1 text-sm font-roboto text-md-on-variant">Short bio</span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="15 years in supply-chain planning; I judge operations and general-research tasks."
                  className="w-full rounded-t-lg bg-md-surface-low border-b-2 border-md-outline focus:border-md-primary focus:outline-none p-3 font-roboto text-md-on"
                />
              </div>
            </>
          ) : (
            <>
              <FilledField label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
              <div>
                <span className="block mb-1 ml-1 text-sm font-roboto text-md-on-variant">What are you trying to buy an agent for?</span>
                <textarea
                  value={useCase}
                  onChange={(e) => setUseCase(e.target.value)}
                  rows={3}
                  placeholder="We need reliable lead research for outbound and want to compare vendors before committing budget."
                  className="w-full rounded-t-lg bg-md-surface-low border-b-2 border-md-outline focus:border-md-primary focus:outline-none p-3 font-roboto text-md-on"
                />
              </div>
            </>
          )}

          {err && <p className="text-md-error text-sm font-roboto">{err}</p>}
          <MdButton onClick={submit} disabled={busy || !displayName} className="h-12">
            {busy ? "Saving…" : "Finish setup"}
          </MdButton>
        </div>
      </MdCard>
    </div>
  );
}
