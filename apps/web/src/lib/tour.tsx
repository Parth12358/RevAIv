// First-sign-in reviewer onboarding tour. Derived-state (no stored step counter):
// the active step is a pure function of route + auth, so it's reload-safe and
// advances as the reviewer performs the real actions. localStorage stores only a
// per-user "seen" flag.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./auth";

export interface TourStep {
  id: string;
  index: number; // 1-based
  target: string; // data-tour attribute value
  title: string;
  body: string;
  placement: "top" | "bottom";
}

export const TOUR_TOTAL = 3;

const STEP_PROFILE: TourStep = {
  id: "profile", index: 1, target: "onboarding-submit", placement: "top",
  title: "Set up your profile",
  body: "Add your name and pick the fields you can judge — this becomes the face behind your reviews. Then press Finish setup.",
};
const STEP_DASHBOARD: TourStep = {
  id: "dashboard", index: 2, target: "reviewer-cta", placement: "bottom",
  title: "Your reviewer dashboard",
  body: "You're all set — no exam needed. Open the Review Desk to start scoring agent outputs.",
};
const STEP_REVIEW: TourStep = {
  id: "review", index: 3, target: "review-desk", placement: "bottom",
  title: "The Review Desk",
  body: "Claim a blind agent output and score it on the rubric. Not your field? Hit Skip. That's it — you're reviewing. Thank you for helping!",
};

export function tourKey(userId: string) {
  return `atl_tour_seen_${userId}`;
}

function deriveStep(pathname: string, onboarded: boolean): TourStep | null {
  if (pathname === "/onboarding" && !onboarded) return STEP_PROFILE;
  if (pathname === "/app" && onboarded) return STEP_DASHBOARD;
  if (pathname === "/review") return STEP_REVIEW;
  return null;
}

interface TourCtx {
  step: TourStep | null;
  active: boolean;
  total: number;
  skip: () => void;
  finish: () => void;
}
const Ctx = createContext<TourCtx>(null!);
export const useTour = () => useContext(Ctx);

export function TourProvider({ children }: { children: ReactNode }) {
  const { session, onboarded, impersonating } = useAuth();
  const loc = useLocation();
  const [active, setActive] = useState(false);
  const started = useRef(false);

  // Activate only for a genuinely-new reviewer (not onboarded, flag unset, not impersonating).
  useEffect(() => {
    if (started.current || active) return;
    if (!session || session.role !== "reviewer") return;
    if (impersonating || onboarded) return;
    if (localStorage.getItem(tourKey(session.userId))) return;
    started.current = true;
    setActive(true);
  }, [session?.userId, session?.role, onboarded, impersonating, active]);

  const end = () => {
    if (session) localStorage.setItem(tourKey(session.userId), "1");
    setActive(false);
  };

  const step = active ? deriveStep(loc.pathname, onboarded) : null;

  return (
    <Ctx.Provider value={{ step, active, total: TOUR_TOTAL, skip: end, finish: end }}>
      {children}
    </Ctx.Provider>
  );
}
