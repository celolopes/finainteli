import { Platform } from "react-native";
import Purchases, { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_KEY_IOS,
  android: process.env.EXPO_PUBLIC_RC_KEY_ANDROID,
  default: "",
});

if (!API_KEY) {
  console.error(`RevenueCat API Key not found for platform: ${Platform.OS}. Check EXPO_PUBLIC_RC_KEY_IOS or EXPO_PUBLIC_RC_KEY_ANDROID.`);
}

export const ENTITLEMENT_ID = "finainteli Pro";

class RevenueCatService {
  private initialized = false;

  async init() {
    if (this.initialized) return;

    if (!API_KEY) {
      console.error("RevenueCat API Key is missing. Skipping initialization.");
      return;
    }

    if (Platform.OS === "ios" || Platform.OS === "android") {
      try {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
        await Purchases.configure({ apiKey: API_KEY });
        this.initialized = true;
      } catch (e) {
        console.error("Failed to init RevenueCat", e);
      }
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async purchase(pack: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      if (typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined") {
        return true;
      }
      return false;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error(e);
      }
      return false;
    }
  }

  async isPro(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    try {
      const info = await Purchases.getCustomerInfo();
      return typeof info.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    } catch (e) {
      return false;
    }
  }
}

export const RCService = new RevenueCatService();
