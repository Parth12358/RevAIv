import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, type Role, type Session } from "./api";

interface AuthState {
  session: Session | null;
  membershipActive: boolean;
  onboarded: boolean;
  loading: boolean;
  signup: (email: string, password: string, role?: Role) => Promise<Session>;
  login: (email: string, password: string) => Promise<Session>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const r = await api.me();
      setSession(r.session);
      setMembershipActive(r.membership_active === 1);
      setOnboarded(r.onboarded === 1);
    } catch {
      setToken(null);
      setSession(null);
      setMembershipActive(false);
      setOnboarded(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("atl_token")) refresh().finally(() => setLoading(false));
    else setLoading(false);
  }, []);

  const value: AuthState = {
    session,
    membershipActive,
    onboarded,
    loading,
    signup: async (email, password, role) => {
      const r = await api.signup(email, password, role);
      setToken(r.token);
      setSession(r.session);
      setMembershipActive(r.membership_active === 1);
      setOnboarded(r.onboarded === 1);
      return r.session;
    },
    login: async (email, password) => {
      const r = await api.login(email, password);
      setToken(r.token);
      setSession(r.session);
      setMembershipActive(r.membership_active === 1);
      setOnboarded(r.onboarded === 1);
      return r.session;
    },
    logout: () => {
      setToken(null);
      setSession(null);
      setMembershipActive(false);
      setOnboarded(false);
    },
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
