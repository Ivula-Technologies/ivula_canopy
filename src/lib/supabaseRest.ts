const SUPABASE_SESSION_KEY = "youth_blossom_supabase_session";
const ACTIVE_CHURCH_KEY = "ivula_canopy_active_church";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface SupabaseSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
    [key: string]: unknown;
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
    window.localStorage.removeItem(ACTIVE_CHURCH_KEY);
    return;
  }

  window.localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

export function getActiveChurchId(): string | null {
  return window.localStorage.getItem(ACTIVE_CHURCH_KEY);
}

export function storeActiveChurchId(churchId: string | null) {
  if (!churchId) {
    window.localStorage.removeItem(ACTIVE_CHURCH_KEY);
    return;
  }

  window.localStorage.setItem(ACTIVE_CHURCH_KEY, churchId);
}

function requireSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
  }

  return { supabaseUrl, supabaseAnonKey };
}

function getEmailRedirectTo() {
  return window.location.origin;
}

function withRedirectTo(url: string) {
  const redirectTo = encodeURIComponent(getEmailRedirectTo());
  return `${url}?redirect_to=${redirectTo}`;
}

function toSession(payload: any): SupabaseSession | null {
  const source = payload.session ?? payload;
  if (!source?.access_token) return null;

  return {
    access_token: source.access_token,
    refresh_token: source.refresh_token,
    expires_at: source.expires_at,
    user: source.user ?? payload.user,
  };
}

function isTokenExpired(session: SupabaseSession): boolean {
  if (!session.expires_at) return false;
  // Treat as expired 60 seconds early to avoid clock-edge failures.
  return Date.now() / 1000 > session.expires_at - 60;
}

let refreshPromise: Promise<SupabaseSession | null> | null = null;

async function refreshSession(session: SupabaseSession): Promise<SupabaseSession | null> {
  // Deduplicate concurrent refresh calls — all callers share the same promise.
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    if (!session.refresh_token) return null;

    const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: session.refresh_token }),
      });

      if (!response.ok) return null;

      const payload = await response.json();
      const next = toSession(payload);
      if (next) storeSession(next);
      return next;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Returns a valid access token, refreshing silently if expired. Returns null
// if the session cannot be refreshed (user must sign in again).
async function getValidToken(): Promise<string | null> {
  const session = getStoredSession();
  if (!session?.access_token) return null;

  if (!isTokenExpired(session)) return session.access_token;

  const refreshed = await refreshSession(session);
  return refreshed?.access_token ?? null;
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

  const session = toSession(payload);
  if (!session) {
    throw new Error("Unable to start a signed-in session.");
  }

  storeSession(session);
  return session;
}

export async function signUpWithPassword(email: string, password: string) {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const response = await fetch(withRedirectTo(`${supabaseUrl}/auth/v1/signup`), {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.message || "Unable to sign up");
  }

  const session = toSession(payload);
  if (session) {
    storeSession(session);
  }

  return session;
}

export async function resendSignupConfirmation(email: string) {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const response = await fetch(withRedirectTo(`${supabaseUrl}/auth/v1/resend`), {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "signup", email }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.msg || payload?.message || "Unable to resend confirmation email");
  }
}

export async function updateUserMetadata(metadata: Record<string, unknown>): Promise<SupabaseSession> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const token = await getValidToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: metadata }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error_description || payload?.msg || payload?.message || "Unable to update profile");
  }

  console.debug("[updateUserMetadata] response payload:", JSON.stringify(payload));

  // payload IS the updated user object from Supabase (id, email, user_metadata, …).
  // Preserve the session tokens and replace the user wholesale.
  const existing = getStoredSession();
  if (existing) {
    const updated: SupabaseSession = { ...existing, user: payload };
    storeSession(updated);
    return updated;
  }
  return existing!;
}

export async function deleteCurrentUser(): Promise<void> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();
  const token = await getValidToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "DELETE",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error_description || payload?.msg || payload?.message || "Unable to delete account");
  }
}

export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { supabaseUrl, supabaseAnonKey } = requireSupabaseConfig();

  const session = getStoredSession();
  let token = session?.access_token ? await getValidToken() : null;
  // Fall back to anon key for unauthenticated requests.
  const authToken = token ?? supabaseAnonKey;

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${authToken}`,
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
