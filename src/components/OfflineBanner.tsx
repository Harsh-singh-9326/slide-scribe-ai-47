import { WifiOff, Wifi, X } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { isOnline, wasOffline, dismissReconnected } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2 text-center text-sm font-medium transition-all duration-300 ${
        isOnline
          ? "bg-green-600 text-white"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online — queued actions are being processed</span>
            <button onClick={dismissReconnected} className="ml-2 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You're offline — changes will be saved when you reconnect</span>
          </>
        )}
      </div>
    </div>
  );
}
