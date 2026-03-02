import { useState, useEffect, useCallback, useRef } from "react";

type QueuedAction = {
  id: string;
  fn: () => Promise<void>;
  label: string;
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const queueRef = useRef<QueuedAction[]>([]);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Process queued actions
      if (queueRef.current.length > 0) {
        const actions = [...queueRef.current];
        queueRef.current = [];
        actions.forEach((action) => action.fn().catch(console.error));
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const queueAction = useCallback((id: string, fn: () => Promise<void>, label: string) => {
    queueRef.current = [
      ...queueRef.current.filter((a) => a.id !== id),
      { id, fn, label },
    ];
  }, []);

  const dismissReconnected = useCallback(() => setWasOffline(false), []);

  return {
    isOnline,
    wasOffline,
    dismissReconnected,
    queueAction,
    queuedCount: queueRef.current.length,
  };
}
