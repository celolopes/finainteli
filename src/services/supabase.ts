import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Storage adapter for Supabase Auth
 * Uses AsyncStorage because SecureStore has a 2048 byte limit on Android
 * which causes Google OAuth tokens (which are large) to fail storage and hang login.
 */
const AsyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn("[AsyncStorage] Failed to get item:", key, e);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn("[AsyncStorage] Failed to set item:", key, e);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn("[AsyncStorage] Failed to remove item:", key, e);
    }
  },
};

/**
 * Supabase client instance configured for React Native
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,
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
  notifications_enabled: boolean;
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
  async ensureUserProfile(userId: string, displayName?: string, avatarUrl?: string): Promise<UserProfile | null> {
    // Check if profile exists
    console.log("[Supabase] Checking user profile for:", userId);
    try {
      const { data: existingProfile, error: selectError } = await supabase.from("user_profiles").select("*").eq("id", userId).single();

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 is 'Row not found'
        console.log("[Supabase] Profile select error:", selectError);
      }

      if (existingProfile) {
        console.log("[Supabase] Profile found");

        // Sync Avatar if available from provider and missing in profile
        if (avatarUrl && !existingProfile.avatar_url) {
          console.log("[Supabase] Syncing avatar from provider...");
          const { data: updated } = await supabase.from("user_profiles").update({ avatar_url: avatarUrl }).eq("id", userId).select().single();
          return updated as UserProfile;
        }

        return existingProfile as UserProfile;
      }
    } catch (e) {
      console.error("[Supabase] Profile check exception:", e);
    }

    console.log("[Supabase] Creating new profile...");

    // Create new profile
    const { data: newProfile, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        display_name: displayName || null,
        avatar_url: avatarUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
    updates: Partial<Pick<UserProfile, "display_name" | "avatar_url" | "preferred_language" | "theme_preference" | "notifications_enabled" | "onboarding_completed">>,
  ): Promise<UserProfile | null> {
    const { data, error } = await supabase.from("user_profiles").update(updates).eq("id", userId).select().single();

    if (error) {
      console.error("[Supabase] Failed to update user profile:", error);
      return null;
    }

    return data as UserProfile;
  },

  /**
   * Reset user account data
   * Deletes all data associated with the user but keeps the account
   */
  async resetAccount(userId: string): Promise<boolean> {
    try {
      console.log("[Supabase] Resetting account data for:", userId);

      // Delete data from all tables (order matters for foreign keys if not cascaded, but Supabase usually handles specific order or we can just spam delete)
      // Assuming cascade delete is NOT set up or we want to be explicit
      const tables = ["transactions", "budgets", "credit_cards", "bank_accounts", "categories", "ai_usage_logs"];

      for (const table of tables) {
        const { error } = await supabase.from(table).delete().eq("user_id", userId);
        if (error) {
          console.error(`[Supabase] Failed to delete from ${table}:`, error);
          // Continue deleting other tables even if one fails
        }
      }

      // Reset profile flags
      const { error: profileError } = await supabase.from("user_profiles").update({ onboarding_completed: false }).eq("id", userId);

      if (profileError) {
        console.error("[Supabase] Failed to reset profile:", profileError);
        return false;
      }

      return true;
    } catch (e) {
      console.error("[Supabase] Account reset exception:", e);
      return false;
    }
  },
};
