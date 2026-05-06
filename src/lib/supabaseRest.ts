const SUPABASE_SESSION_KEY = "youth_blossom_supabase_session";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {
    id: string;
    email?: string;
  };
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export function getStoredSession(): SupabaseSession | null {
  try {
    const raw = window.localStorage.getItem(SUPABASE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch (error) {
    console.error("Unable to read Supabase session", error);
    return null;
  }
}

export function storeSession(session: SupabaseSession | null) {
  if (!session) {
    window.localStorage.removeItem(SUPABASE_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function signInWithPassword(email: string, password: string) {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.message || "Unable to sign in");
  }

  const session: SupabaseSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_at,
    user: payload.user,
  };
  storeSession(session);
  return session;
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const session = getStoredSession();
  const token = session?.access_token ?? supabaseAnonKey;
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(payload?.message || payload?.hint || "Supabase request failed");
  }

  return payload as T;
}
