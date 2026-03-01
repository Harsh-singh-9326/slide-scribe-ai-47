import { useEffect, useRef, useCallback, useState } from "react";

const AUTO_SAVE_KEY = "slideforge_autosave_";
const AUTO_SAVE_INTERVAL = 10_000; // 10 seconds

interface AutoSaveData {
  slides: any[];
  theme: string;
  savedAt: string;
}

export function useAutoSave(presentationId: string | undefined, slides: any[], theme: string) {
  const [hasRecovery, setHasRecovery] = useState(false);
  const [recoveryData, setRecoveryData] = useState<AutoSaveData | null>(null);
  const lastSavedRef = useRef<string>("");

  const key = presentationId ? `${AUTO_SAVE_KEY}${presentationId}` : null;

  // Check for recovery data on mount
  useEffect(() => {
    if (!key) return;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: AutoSaveData = JSON.parse(saved);
        // Only offer recovery if data is less than 24h old
        const age = Date.now() - new Date(parsed.savedAt).getTime();
        if (age < 24 * 60 * 60 * 1000 && parsed.slides?.length > 0) {
          setHasRecovery(true);
          setRecoveryData(parsed);
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // Corrupted data, remove it
      if (key) localStorage.removeItem(key);
    }
  }, [key]);

  // Auto-save periodically
  useEffect(() => {
    if (!key || slides.length === 0) return;

    const interval = setInterval(() => {
      const serialized = JSON.stringify(slides);
      if (serialized !== lastSavedRef.current) {
        const data: AutoSaveData = {
          slides,
          theme,
          savedAt: new Date().toISOString(),
        };
        try {
          localStorage.setItem(key, JSON.stringify(data));
          lastSavedRef.current = serialized;
        } catch {
          // localStorage full, silently fail
        }
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [key, slides, theme]);

  const recover = useCallback(() => {
    setHasRecovery(false);
    return recoveryData;
  }, [recoveryData]);

  const dismiss = useCallback(() => {
    setHasRecovery(false);
    setRecoveryData(null);
    if (key) localStorage.removeItem(key);
  }, [key]);

  const clearAutoSave = useCallback(() => {
    if (key) localStorage.removeItem(key);
  }, [key]);

  return { hasRecovery, recover, dismiss, clearAutoSave };
}
