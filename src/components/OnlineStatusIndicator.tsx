import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useIsFetching, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function OnlineStatusIndicator() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const qc = useQueryClient();

  useEffect(() => {
    const goOnline = () => {
      setOnline(true);
      toast.success("Ligação restabelecida — a sincronizar dados...");
      qc.resumePausedMutations().then(() => qc.invalidateQueries());
    };
    const goOffline = () => {
      setOnline(false);
      toast.warning("Sem ligação — a trabalhar em modo offline");
    };
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [qc]);

  const syncing = online && (isFetching > 0 || isMutating > 0);

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-all",
        online
          ? "bg-background/80 text-muted-foreground border border-border"
          : "bg-destructive text-destructive-foreground"
      )}
      aria-live="polite"
    >
      {!online ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span>A sincronizar</span>
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5 text-green-500" />
          <span>Online</span>
        </>
      )}
    </div>
  );
}
