import { useCallback, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useAuthStore } from "../store/authStore";
import { usePremium } from "./usePremium";

/**
 * Estado do limite de uso de IA
 */
export interface AILimitState {
  tipCount: number;
  advisorCount: number;
  dailyLimit: number;
  canUseTip: boolean;
  canUseAdvisor: boolean;
  remainingTips: number;
  remainingAdvisor: number;
  resetTime: Date | null;
  isLoading: boolean;
}

/**
 * Constantes de limite
 */
const FREE_DAILY_LIMIT = 3;
const PREMIUM_DAILY_LIMIT = Infinity;

/**
 * Hook para gerenciar limites de uso de IA
 * - Usuários Free: 3 dicas/dia
 * - Usuários Premium: Ilimitado
 */
export function useAILimit() {
  const { session } = useAuthStore();
  const { isPro, loading: premiumLoading } = usePremium();

  const [state, setState] = useState<AILimitState>({
    tipCount: 0,
    advisorCount: 0,
    dailyLimit: FREE_DAILY_LIMIT,
    canUseTip: true,
    canUseAdvisor: true,
    remainingTips: FREE_DAILY_LIMIT,
    remainingAdvisor: FREE_DAILY_LIMIT,
    resetTime: null,
    isLoading: true,
  });

  /**
   * Calcula a próxima meia-noite no fuso horário de São Paulo (UTC-3)
   */
  const getNextReset = useCallback((): Date => {
    const now = new Date();
    // Ajustar para UTC-3 (São Paulo)
    const spOffset = -3 * 60; // -3 horas em minutos
    const localOffset = now.getTimezoneOffset();
    const diff = spOffset - localOffset;

    const spNow = new Date(now.getTime() + diff * 60 * 1000);
    const tomorrow = new Date(spNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Converter de volta para local timezone
    return new Date(tomorrow.getTime() - diff * 60 * 1000);
  }, []);

  /**
   * Busca o uso atual do dia
   */
  const fetchUsage = useCallback(async () => {
    if (!session?.user?.id) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase.from("ai_usage").select("*").eq("user_id", session.user.id).eq("usage_date", today).single();

      const dailyLimit = isPro ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
      const tipCount = data?.tip_count ?? 0;
      const advisorCount = data?.advisor_count ?? 0;

      setState({
        tipCount,
        advisorCount,
        dailyLimit,
        canUseTip: isPro || tipCount < FREE_DAILY_LIMIT,
        canUseAdvisor: isPro || advisorCount < FREE_DAILY_LIMIT,
        remainingTips: isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - tipCount),
        remainingAdvisor: isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - advisorCount),
        resetTime: getNextReset(),
        isLoading: false,
      });
    } catch (error) {
      // Se não encontrou registro, usuário ainda não usou hoje
      const dailyLimit = isPro ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

      setState({
        tipCount: 0,
        advisorCount: 0,
        dailyLimit,
        canUseTip: true,
        canUseAdvisor: true,
        remainingTips: isPro ? Infinity : FREE_DAILY_LIMIT,
        remainingAdvisor: isPro ? Infinity : FREE_DAILY_LIMIT,
        resetTime: getNextReset(),
        isLoading: false,
      });
    }
  }, [session?.user?.id, isPro, getNextReset]);

  /**
   * Incrementa o uso de dicas (SmartTip)
   * @returns true se foi possível usar, false se atingiu o limite
   */
  const incrementTipUsage = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    // Premium não tem limite
    if (isPro) return true;

    // Verificar limite atual
    if (!state.canUseTip) return false;

    try {
      const today = new Date().toISOString().split("T")[0];

      // Upsert - insere ou atualiza
      const { data, error } = await supabase
        .from("ai_usage")
        .upsert(
          {
            user_id: session.user.id,
            usage_date: today,
            tip_count: state.tipCount + 1,
            advisor_count: state.advisorCount,
          },
          {
            onConflict: "user_id,usage_date",
          },
        )
        .select()
        .single();

      if (error) throw error;

      const newTipCount = data?.tip_count ?? state.tipCount + 1;

      setState((prev) => ({
        ...prev,
        tipCount: newTipCount,
        remainingTips: Math.max(0, FREE_DAILY_LIMIT - newTipCount),
        canUseTip: newTipCount < FREE_DAILY_LIMIT,
      }));

      return true;
    } catch (error) {
      console.error("Erro ao incrementar uso de IA:", error);
      return false;
    }
  }, [session?.user?.id, isPro, state.canUseTip, state.tipCount, state.advisorCount]);

  /**
   * Incrementa o uso do Advisor
   * @returns true se foi possível usar, false se atingiu o limite
   */
  const incrementAdvisorUsage = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    // Premium não tem limite
    if (isPro) return true;

    // Verificar limite atual
    if (!state.canUseAdvisor) return false;

    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("ai_usage")
        .upsert(
          {
            user_id: session.user.id,
            usage_date: today,
            tip_count: state.tipCount,
            advisor_count: state.advisorCount + 1,
          },
          {
            onConflict: "user_id,usage_date",
          },
        )
        .select()
        .single();

      if (error) throw error;

      const newAdvisorCount = data?.advisor_count ?? state.advisorCount + 1;

      setState((prev) => ({
        ...prev,
        advisorCount: newAdvisorCount,
        remainingAdvisor: Math.max(0, FREE_DAILY_LIMIT - newAdvisorCount),
        canUseAdvisor: newAdvisorCount < FREE_DAILY_LIMIT,
      }));

      return true;
    } catch (error) {
      console.error("Erro ao incrementar uso de Advisor:", error);
      return false;
    }
  }, [session?.user?.id, isPro, state.canUseAdvisor, state.tipCount, state.advisorCount]);

  // Buscar uso ao montar e quando o status premium mudar
  useEffect(() => {
    if (!premiumLoading) {
      fetchUsage();
    }
  }, [premiumLoading, fetchUsage]);

  return {
    ...state,
    incrementTipUsage,
    incrementAdvisorUsage,
    refreshUsage: fetchUsage,
  };
}
