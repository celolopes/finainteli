import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Secure storage adapter for Supabase Auth
 * Uses expo-secure-store for encrypted token storage
 */
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      console.warn("[SecureStore] Failed to get item:", key);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      console.warn("[SecureStore] Failed to set item:", key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      console.warn("[SecureStore] Failed to remove item:", key);
    }
  },
};

/**
 * Supabase client instance configured for React Native
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Database types for TypeScript
 */
export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  preferred_language: string;
  theme_preference: "light" | "dark" | "system";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Auth helper functions
 */
export const authHelpers = {
  /**
   * Get or create user profile after authentication
   */
  async ensureUserProfile(userId: string, displayName?: string): Promise<UserProfile | null> {
    // Check if profile exists
    const { data: existingProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single();

    if (existingProfile) {
      return existingProfile as UserProfile;
    }

    // Create new profile
    const { data: newProfile, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        display_name: displayName || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Failed to create user profile:", error);
      return null;
    }

    return newProfile as UserProfile;
  },

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, "display_name" | "avatar_url" | "preferred_language" | "theme_preference" | "onboarding_completed">>
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId).select().single();

    if (error) {
      console.error("[Supabase] Failed to update user profile:", error);
      return null;
    }

    return data as UserProfile;
  },
};
