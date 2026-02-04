import { Platform } from "react-native";
import Purchases, { CustomerInfo, CustomerInfoUpdateListener, PurchasesOffering, PurchasesPackage } from "react-native-purchases";

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

  private hasActiveEntitlement(info?: CustomerInfo | null) {
    return typeof info?.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  }

  isProCustomerInfo(info?: CustomerInfo | null) {
    return this.hasActiveEntitlement(info);
  }

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
    if (!API_KEY) return null;
    try {
      await this.init();
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
    if (!API_KEY) return false;
    try {
      await this.init();
      const { customerInfo } = await Purchases.purchasePackage(pack);
      return this.hasActiveEntitlement(customerInfo);
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
      return this.hasActiveEntitlement(info);
    } catch (e) {
      return false;
    }
  }

  addCustomerInfoListener(listener: CustomerInfoUpdateListener) {
    if (Platform.OS === "web") return () => false;
    if (!API_KEY) return () => false;

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => Purchases.removeCustomerInfoUpdateListener(listener);
  }
}

export const RCService = new RevenueCatService();
