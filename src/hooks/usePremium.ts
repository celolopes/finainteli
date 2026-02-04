import { useCallback, useEffect, useMemo, useState } from "react";
import { getPremiumBypassContext } from "../constants/premiumAccess";
import { RCService } from "../services/revenuecat";

let didLogBypass = false;

export function usePremium() {
  const bypassContext = useMemo(() => getPremiumBypassContext(), []);
  const bypassEnabled = bypassContext.enabled;

  const [isPro, setIsPro] = useState(bypassEnabled);
  const [loading, setLoading] = useState(!bypassEnabled);

  const checkStatus = useCallback(async () => {
    if (bypassEnabled) {
      setIsPro(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await RCService.init();
      const status = await RCService.isPro();
      setIsPro(status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [bypassEnabled]);

  useEffect(() => {
    if (bypassEnabled) {
      if (!didLogBypass) {
        console.log("[Premium] Bypass enabled", bypassContext);
        didLogBypass = true;
      }
      setIsPro(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const unsubscribe = RCService.addCustomerInfoListener((info) => {
      if (!isMounted) return;
      setIsPro(RCService.isProCustomerInfo(info));
    });

    checkStatus();

    return () => {
      isMounted = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [bypassEnabled, bypassContext, checkStatus]);

  return { isPro, loading, checkStatus };
}
