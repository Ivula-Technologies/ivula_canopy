import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getActiveChurchId,
  getStoredSession,
  isSupabaseConfigured,
  signInWithPassword,
  signUpWithPassword,
  storeActiveChurchId,
  storeSession,
  supabaseRequest,
  type SupabaseSession,
} from "@/lib/supabaseRest";

const PENDING_SIGNUP_INTENT_KEY = "ivula_canopy_pending_signup_intent";

export type ChurchRole = "owner" | "admin" | "leader" | "volunteer" | "viewer";
export type ChurchMembershipStatus = "active" | "invited" | "disabled";
export type JoinableChurchRole = "leader" | "volunteer" | "viewer";

export type SignupIntent =
  | { type: "register_church"; churchName: string }
  | { type: "join_church"; joinCode: string; role: JoinableChurchRole };

export interface ChurchMembership {
  id: string;
  churchId: string;
  churchName: string;
  churchSlug?: string | null;
  churchJoinCode?: string | null;
  role: ChurchRole;
  status: ChurchMembershipStatus;
}

interface AuthContextValue {
  isConfigured: boolean;
  session: SupabaseSession | null;
  isAuthenticated: boolean;
  memberships: ChurchMembership[];
  activeMembership: ChurchMembership | null;
  pendingMembership: ChurchMembership | null;
  isLoadingAccess: boolean;
  accessError: string | null;
  canEditRecords: boolean;
  canManageChurch: boolean;
  canRecordAttendance: boolean;
  canExportRecords: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, intent: SignupIntent) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => void;
  switchChurch: (churchId: string) => void;
}

interface ChurchRow {
  id: string;
  name: string;
  slug?: string | null;
  join_code?: string | null;
}

interface MembershipRow {
  id: string;
  church_id: string;
  role: ChurchRole;
  status: ChurchMembershipStatus;
  churches?: ChurchRow | ChurchRow[] | null;
}

interface CreatedChurchMembershipRow {
  membership_id: string;
  church_id: string;
  church_name: string;
  church_slug?: string | null;
  role: ChurchRole;
  status?: ChurchMembershipStatus;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getJoinedChurch(row: MembershipRow): ChurchRow | null {
  if (Array.isArray(row.churches)) return row.churches[0] ?? null;
  return row.churches ?? null;
}

function toMembership(row: MembershipRow): ChurchMembership {
  const church = getJoinedChurch(row);
  return {
    id: row.id,
    churchId: row.church_id,
    churchName: church?.name ?? "Church",
    churchSlug: church?.slug,
    churchJoinCode: church?.join_code,
    role: row.role,
    status: row.status,
  };
}

function toCreatedMembership(row: CreatedChurchMembershipRow): ChurchMembership {
  return {
    id: row.membership_id,
    churchId: row.church_id,
    churchName: row.church_name,
    churchSlug: row.church_slug,
    role: row.role,
    status: row.status ?? "active",
  };
}

function storePendingSignupIntent(intent: SignupIntent | null) {
  if (!intent) {
    window.localStorage.removeItem(PENDING_SIGNUP_INTENT_KEY);
    return;
  }

  window.localStorage.setItem(PENDING_SIGNUP_INTENT_KEY, JSON.stringify(intent));
}

function getPendingSignupIntent(): SignupIntent | null {
  try {
    const raw = window.localStorage.getItem(PENDING_SIGNUP_INTENT_KEY);
    return raw ? (JSON.parse(raw) as SignupIntent) : null;
  } catch (error) {
    console.error("Unable to read pending signup intent", error);
    return null;
  }
}

async function fetchMemberships(): Promise<ChurchMembership[]> {
  const rows = await supabaseRequest<MembershipRow[]>(
    "church_memberships?select=id,church_id,role,status,churches(id,name,slug,join_code)&status=in.(active,invited)&order=created_at.asc"
  );
  return rows.map(toMembership);
}

async function createFirstChurchForUser(session: SupabaseSession, churchNameOverride?: string): Promise<ChurchMembership[]> {
  if (!session.user?.id) return [];

  const churchName = churchNameOverride || (session.user.email ? `${session.user.email.split("@")[0]}'s Church` : "My Church");
  const rows = await supabaseRequest<CreatedChurchMembershipRow[]>("rpc/create_church_for_current_user", {
    method: "POST",
    body: JSON.stringify({ requested_church_name: churchName }),
  });

  const createdMemberships = rows.map(toCreatedMembership);
  const refreshedMemberships = await fetchMemberships();
  return refreshedMemberships.length > 0 ? refreshedMemberships : createdMemberships;
}

async function joinChurchForUser(intent: Extract<SignupIntent, { type: "join_church" }>): Promise<ChurchMembership[]> {
  const rows = await supabaseRequest<CreatedChurchMembershipRow[]>("rpc/join_church_for_current_user", {
    method: "POST",
    body: JSON.stringify({ requested_join_code: intent.joinCode, requested_role: intent.role }),
  });

  const joinedMemberships = rows.map(toCreatedMembership);
  const refreshedMemberships = await fetchMemberships();
  return refreshedMemberships.length > 0 ? refreshedMemberships : joinedMemberships;
}

async function applySignupIntent(session: SupabaseSession, intent: SignupIntent): Promise<ChurchMembership[]> {
  if (intent.type === "register_church") {
    return createFirstChurchForUser(session, intent.churchName);
  }

  return joinChurchForUser(intent);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SupabaseSession | null>(() => {
    if (!isSupabaseConfigured) return null;
    return getStoredSession();
  });
  const [memberships, setMemberships] = useState<ChurchMembership[]>([]);
  const [activeChurchId, setActiveChurchId] = useState<string | null>(() => getActiveChurchId());
  const [isLoadingAccess, setIsLoadingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  async function loadAccess(nextSession: SupabaseSession | null) {
    if (!isSupabaseConfigured || !nextSession?.access_token) {
      setMemberships([]);
      setActiveChurchId(null);
      return;
    }

    setIsLoadingAccess(true);
    setAccessError(null);

    try {
      let nextMemberships = await fetchMemberships();
      const pendingIntent = getPendingSignupIntent();

      if (nextMemberships.length === 0 && pendingIntent) {
        nextMemberships = await applySignupIntent(nextSession, pendingIntent);
        storePendingSignupIntent(null);
      }

      if (nextMemberships.length === 0) {
        nextMemberships = await createFirstChurchForUser(nextSession);
      }

      setMemberships(nextMemberships);
      const storedChurchId = getActiveChurchId();
      const activeMemberships = nextMemberships.filter((membership) => membership.status === "active");
      const nextActive = activeMemberships.find((membership) => membership.churchId === storedChurchId) ?? activeMemberships[0] ?? null;
      storeActiveChurchId(nextActive?.churchId ?? null);
      setActiveChurchId(nextActive?.churchId ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load church access";
      setAccessError(message);
      setMemberships([]);
      setActiveChurchId(null);
    } finally {
      setIsLoadingAccess(false);
    }
  }

  useEffect(() => {
    loadAccess(session);
  }, [session?.access_token]);

  const activeMembership = memberships.find((membership) => membership.status === "active" && membership.churchId === activeChurchId) ?? memberships.find((membership) => membership.status === "active") ?? null;
  const pendingMembership = memberships.find((membership) => membership.status === "invited") ?? null;
  const activeRole = activeMembership?.role;
  const canManageChurch = activeRole === "owner" || activeRole === "admin";
  const canEditRecords = canManageChurch || activeRole === "leader";
  const canRecordAttendance = canEditRecords || activeRole === "volunteer";
  const canExportRecords = canEditRecords;

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      session,
      isAuthenticated: Boolean(session?.access_token),
      memberships,
      activeMembership,
      pendingMembership,
      isLoadingAccess,
      accessError,
      canEditRecords,
      canManageChurch,
      canRecordAttendance,
      canExportRecords,
      async signIn(email, password) {
        const nextSession = await signInWithPassword(email, password);
        setSession(nextSession);
        await loadAccess(nextSession);
      },
      async signUp(email, password, intent) {
        storePendingSignupIntent(intent);
        const nextSession = await signUpWithPassword(email, password);

        if (!nextSession) {
          return { needsEmailConfirmation: true };
        }

        setSession(nextSession);
        await loadAccess(nextSession);
        return { needsEmailConfirmation: false };
      },
      signOut() {
        storeSession(null);
        storePendingSignupIntent(null);
        setSession(null);
        setMemberships([]);
        setActiveChurchId(null);
      },
      switchChurch(churchId) {
        const membership = memberships.find((item) => item.status === "active" && item.churchId === churchId);
        if (!membership) return;
        storeActiveChurchId(churchId);
        setActiveChurchId(churchId);
        window.location.reload();
      },
    }),
    [session, memberships, activeMembership, pendingMembership, isLoadingAccess, accessError, canEditRecords, canManageChurch, canRecordAttendance, canExportRecords]
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
