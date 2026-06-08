import { useState, useEffect, useCallback, useRef } from "react";
import { getActiveChurchId, getStoredSession, isSupabaseConfigured } from "@/lib/supabaseRest";
import { loadPersistentValue, syncPersistentValue } from "@/services/persistentStore";

/**
 * Persists state in localStorage and syncs with Supabase, fully scoped per tenant.
 *
 * The localStorage key is namespaced as `${baseKey}__${churchId}` so that
 * data from different organizations never occupies the same storage slot.
 * The hook re-fetches from Supabase whenever the active church changes.
 */
export function useLocalStorage<T>(baseKey: string, initialValue: T) {
  const churchId = getActiveChurchId() ?? "local";
  // Scope the key per tenant so orgs never share a storage slot.
  const key = `${baseKey}__${churchId}`;

  const hasLoadedRemote = useRef(false);
  const skipNextSync = useRef(false);
  // Track which key we last loaded so we can reset state on org switch.
  const loadedKeyRef = useRef<string | null>(null);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Re-hydrate from Supabase whenever the tenant-scoped key changes (org switch).
  useEffect(() => {
    let isMounted = true;

    // If we're switching to a different key, reset to the stored value for that
    // key (or initialValue) immediately so stale data from a prior org isn't shown.
    if (loadedKeyRef.current !== null && loadedKeyRef.current !== key) {
      const cached = window.localStorage.getItem(key);
      const next = cached ? (JSON.parse(cached) as T) : initialValue;
      skipNextSync.current = true;
      setStoredValue(next);
    }

    loadedKeyRef.current = key;
    hasLoadedRemote.current = false;

    async function hydrateFromSupabase() {
      if (!isSupabaseConfigured || !getStoredSession() || churchId === "local") {
        hasLoadedRemote.current = true;
        return;
      }

      try {
        const nextValue = await loadPersistentValue(baseKey, initialValue);
        if (!isMounted) return;
        skipNextSync.current = true;
        setStoredValue(nextValue);
      } catch (error) {
        console.error(`Error loading Supabase-backed value for "${baseKey}":`, error);
      } finally {
        hasLoadedRemote.current = true;
      }
    }

    hydrateFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [key]); // re-runs whenever churchId changes

  // Persist to localStorage under the tenant-scoped key.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Sync to Supabase, but skip the echo-back after a remote hydration.
  useEffect(() => {
    if (!hasLoadedRemote.current || !isSupabaseConfigured || !getStoredSession()) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    syncPersistentValue(baseKey, storedValue).catch((error) => {
      console.error(`Error syncing Supabase-backed value for "${baseKey}":`, error);
    });
  }, [key, storedValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => (value instanceof Function ? value(prev) : value));
  }, []);

  return [storedValue, setValue] as const;
}
