import Constants from "expo-constants";
import * as Updates from "expo-updates";

export type PremiumBypassReason = "dev" | "appOwnership" | "updatesChannel" | "publicEnv";

const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

const EXPO_PUBLIC_ENV = normalize(process.env.EXPO_PUBLIC_ENV);
const UPDATE_CHANNEL = normalize(Updates.channel);
const APP_OWNERSHIP = Constants.appOwnership ?? null;

const PREVIEW_VALUES = new Set(["preview"]);

const isPreviewEnv = PREVIEW_VALUES.has(EXPO_PUBLIC_ENV);
const isPreviewChannel = PREVIEW_VALUES.has(UPDATE_CHANNEL);
// appOwnership is "expo" | "guest" in dev environments, null in native builds
const isDevOwnership = APP_OWNERSHIP === "expo" || APP_OWNERSHIP === "guest";

export const getPremiumBypassReasons = (): PremiumBypassReason[] => {
  const reasons: PremiumBypassReason[] = [];

  if (__DEV__) reasons.push("dev");
  if (isDevOwnership) reasons.push("appOwnership");
  if (isPreviewChannel) reasons.push("updatesChannel");
  if (isPreviewEnv) reasons.push("publicEnv");

  return reasons;
};

export const isPremiumBypassEnabled = () => getPremiumBypassReasons().length > 0;

export const getPremiumBypassContext = () => {
  const reasons = getPremiumBypassReasons();

  return {
    enabled: reasons.length > 0,
    reasons,
    expoPublicEnv: EXPO_PUBLIC_ENV || null,
    updateChannel: UPDATE_CHANNEL || null,
    appOwnership: APP_OWNERSHIP,
  };
};
