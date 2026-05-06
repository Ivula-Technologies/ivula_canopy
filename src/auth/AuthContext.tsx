import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  getStoredSession,
  isSupabaseConfigured,
  signInWithPassword,
  storeSession,
  type SupabaseSession,
} from "@/lib/supabaseRest";

interface AuthContextValue {
  isConfigured: boolean;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(() => {
    if (!isSupabaseConfigured) return null;
    return getStoredSession();
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      session,
      isAuthenticated: Boolean(session?.access_token),
      async signIn(email, password) {
        const nextSession = await signInWithPassword(email, password);
        setSession(nextSession);
      },
      signOut() {
        storeSession(null);
        setSession(null);
      },
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
