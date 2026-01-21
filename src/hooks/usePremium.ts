import { useEffect, useState } from "react";
import { RCService } from "../services/revenuecat";

export function usePremium() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      await RCService.init();
      const status = await RCService.isPro();
      setIsPro(status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return { isPro, loading, checkStatus };
}
