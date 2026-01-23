import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { mySync } from "../services/sync";

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const performSync = async () => {
    if (isSyncing) return;

    const state = await NetInfo.fetch();
    if (!state.isConnected) return;

    try {
      setIsSyncing(true);
      setError(null);
      await mySync();
      setLastSync(new Date());
    } catch (e: any) {
      console.error("Sync failed:", e);
      setError(e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial sync
    performSync();

    // Sync on reconnect
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        performSync();
      }
    });

    return () => unsubscribe();
  }, []);

  return { isSyncing, lastSync, error, performSync };
}
