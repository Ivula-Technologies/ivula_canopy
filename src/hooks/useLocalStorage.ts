import { useState, useEffect, useCallback, useRef } from "react";
import { getStoredSession, isSupabaseConfigured } from "@/lib/supabaseRest";
import { loadPersistentValue, syncPersistentValue } from "@/services/persistentStore";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const hasLoadedRemote = useRef(false);
  const skipNextSync = useRef(false);

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSupabase() {
      hasLoadedRemote.current = false;

      if (!isSupabaseConfigured || !getStoredSession()) {
        hasLoadedRemote.current = true;
        return;
      }

      try {
        const nextValue = await loadPersistentValue(key, storedValue);
        if (!isMounted) return;

        skipNextSync.current = true;
        setStoredValue(nextValue);
      } catch (error) {
        console.error(`Error loading Supabase-backed value for "${key}":`, error);
      } finally {
        hasLoadedRemote.current = true;
      }
    }

    hydrateFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  useEffect(() => {
    if (!hasLoadedRemote.current || !isSupabaseConfigured || !getStoredSession()) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    syncPersistentValue(key, storedValue).catch((error) => {
      console.error(`Error syncing Supabase-backed value for "${key}":`, error);
    });
  }, [key, storedValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prev) => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [storedValue, setValue] as const;
}
