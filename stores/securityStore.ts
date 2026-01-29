import { create } from "zustand";
import * as SecurityService from "../services/security";

interface SecurityState {
  isLocked: boolean;
  isBiosEnabled: boolean;
  isSecurityEnabled: boolean;
  hasPinSet: boolean;
  loaded: boolean;

  initialize: () => Promise<void>;
  lockApp: () => void;
  unlockApp: () => void;
  setPin: (pin: string) => Promise<void>;
  toggleBiometrics: (enabled: boolean) => Promise<void>;
  toggleSecurity: (enabled: boolean) => Promise<void>;
  validatePin: (pin: string) => Promise<boolean>;
}

export const useSecurityStore = create<SecurityState>((set, get) => ({
  isLocked: false,
  isBiosEnabled: false,
  isSecurityEnabled: false,
  hasPinSet: false,
  loaded: false,

  initialize: async () => {
    try {
      const [hasPin, bioEnabled, securityEnabled] = await Promise.all([SecurityService.hasPin(), SecurityService.getBiometricsEnabled(), SecurityService.getSecurityEnabled()]);

      set({
        hasPinSet: hasPin,
        isBiosEnabled: bioEnabled,
        isSecurityEnabled: securityEnabled,
        loaded: true,
      });

      // If security is enabled, meaningful content should be hidden until unlock logic runs?
      // Actually, we'll let the AppState listener trigger the lock.
      // But if we start the app and security is enabled, we should probably start locked.
      if (securityEnabled && hasPin) {
        set({ isLocked: true });
      }
    } catch (error) {
      console.error("Failed to initialize security store", error);
      set({ loaded: true });
    }
  },

  lockApp: () => {
    const { isSecurityEnabled, hasPinSet } = get();
    if (isSecurityEnabled && hasPinSet) {
      set({ isLocked: true });
    }
  },

  unlockApp: () => {
    set({ isLocked: false });
  },

  setPin: async (pin: string) => {
    await SecurityService.savePin(pin);
    // If setting PIN, we assume they want security enabled? Or just setting it up.
    set({ hasPinSet: true });
  },

  toggleBiometrics: async (enabled: boolean) => {
    await SecurityService.setBiometricsEnabled(enabled);
    set({ isBiosEnabled: enabled });
  },

  toggleSecurity: async (enabled: boolean) => {
    await SecurityService.setSecurityEnabled(enabled);
    set({ isSecurityEnabled: enabled });
    if (!enabled) {
      set({ isLocked: false });
    }
  },

  validatePin: async (pin: string) => {
    const isValid = await SecurityService.validatePin(pin);
    return isValid;
  },
}));
