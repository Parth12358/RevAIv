import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, type Role, type Session } from "./api";

const ADMIN_BACKUP_KEY = "atl_admin_token";

interface AuthState {
  session: Session | null;
  membershipActive: boolean;
  onboarded: boolean;
  loading: boolean;
  impersonating: boolean;
  signup: (email: string, password: string, role?: Role) => Promise<Session>;
  login: (email: string, password: string, role?: Role) => Promise<Session>;
  logout: () => void;
  refresh: () => Promise<void>;
  impersonate: (role: "member" | "reviewer") => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const Ctx = createContext<AuthState>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [membershipActive, setMembershipActive] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(!!localStorage.getItem(ADMIN_BACKUP_KEY));

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
    impersonating,
    signup: async (email, password, role) => {
      const r = await api.signup(email, password, role);
      setToken(r.token);
      setSession(r.session);
      setMembershipActive(r.membership_active === 1);
      setOnboarded(r.onboarded === 1);
      return r.session;
    },
    login: async (email, password, role) => {
      const r = await api.login(email, password, role);
      setToken(r.token);
      setSession(r.session);
      setMembershipActive(r.membership_active === 1);
      setOnboarded(r.onboarded === 1);
      return r.session;
    },
    logout: () => {
      localStorage.removeItem(ADMIN_BACKUP_KEY);
      setImpersonating(false);
      setToken(null);
      setSession(null);
      setMembershipActive(false);
      setOnboarded(false);
    },
    refresh,
    impersonate: async (role) => {
      const r = await api.impersonate(role);
      // Stash the admin token so we can return to it.
      const adminToken = localStorage.getItem("atl_token");
      if (adminToken && !localStorage.getItem(ADMIN_BACKUP_KEY)) localStorage.setItem(ADMIN_BACKUP_KEY, adminToken);
      setToken(r.token);
      setImpersonating(true);
      await refresh();
    },
    stopImpersonating: async () => {
      const adminToken = localStorage.getItem(ADMIN_BACKUP_KEY);
      if (adminToken) setToken(adminToken);
      localStorage.removeItem(ADMIN_BACKUP_KEY);
      setImpersonating(false);
      await refresh();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
