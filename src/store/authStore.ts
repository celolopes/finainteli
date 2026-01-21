import { AuthError, Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { create } from "zustand";

import { authHelpers, supabase, UserProfile } from "../services/supabase";

// Enable web browser redirect for OAuth
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,
  error: null,

  /**
   * Initialize auth state and listen for changes
   */
  initialize: async () => {
    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("[Auth] Failed to get session:", error);
        set({ loading: false, initialized: true });
        return;
      }

      if (session?.user) {
        // Fetch user profile
        const profile = await authHelpers.ensureUserProfile(session.user.id, session.user.user_metadata?.full_name || session.user.email?.split("@")[0]);

        set({
          user: session.user,
          session,
          profile,
          loading: false,
          initialized: true,
        });
      } else {
        set({ loading: false, initialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[Auth] State changed:", event);

        if (event === "SIGNED_IN" && session?.user) {
          const profile = await authHelpers.ensureUserProfile(session.user.id, session.user.user_metadata?.full_name || session.user.email?.split("@")[0]);

          set({
            user: session.user,
            session,
            profile,
            loading: false,
          });
        } else if (event === "SIGNED_OUT") {
          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
          });
        } else if (event === "TOKEN_REFRESHED" && session) {
          set({ session });
        }
      });
    } catch (error) {
      console.error("[Auth] Initialization failed:", error);
      set({ loading: false, initialized: true });
    }
  },

  /**
   * Sign in with email and password
   */
  signInWithEmail: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ loading: false, error: translateAuthError(error) });
        return { success: false, error: translateAuthError(error) };
      }

      if (data.user) {
        const profile = await authHelpers.ensureUserProfile(data.user.id, data.user.email?.split("@")[0]);

        set({
          user: data.user,
          session: data.session,
          profile,
          loading: false,
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign up with email and password
   */
  signUpWithEmail: async (email: string, password: string, displayName?: string) => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
          },
        },
      });

      if (error) {
        set({ loading: false, error: translateAuthError(error) });
        return { success: false, error: translateAuthError(error) };
      }

      // Note: User may need to confirm email before session is created
      if (data.user && data.session) {
        const profile = await authHelpers.ensureUserProfile(data.user.id, displayName);

        set({
          user: data.user,
          session: data.session,
          profile,
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async () => {
    set({ loading: true, error: null });

    try {
      // For Expo Go, we need to use the Expo scheme
      // For standalone builds, use the app's custom scheme
      const redirectUrl = makeRedirectUri({
        // Don't pass scheme - let Expo figure out the correct one
        // This will use exp:// in Expo Go and the app scheme in standalone
        path: "auth/callback",
      });

      console.log("[Auth] Google OAuth redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        console.log("[Auth] OAuth error:", error.message);
        set({ loading: false, error: translateAuthError(error) });
        return { success: false, error: translateAuthError(error) };
      }

      console.log("[Auth] OAuth URL generated:", data.url ? "Yes" : "No");

      if (data.url) {
        // Open browser for OAuth flow
        console.log("[Auth] Opening browser...");
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        console.log("[Auth] OAuth result type:", result.type);
        console.log("[Auth] OAuth result:", JSON.stringify(result, null, 2));

        if (result.type === "success" && result.url) {
          // Extract tokens from URL - try both hash fragment and query params
          const resultUrl = result.url;
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          // Check if tokens are in hash fragment (Supabase default)
          if (resultUrl.includes("#")) {
            const hashParams = new URLSearchParams(resultUrl.split("#")[1]);
            accessToken = hashParams.get("access_token");
            refreshToken = hashParams.get("refresh_token");
          }

          // Fallback: check query params
          if (!accessToken) {
            const url = new URL(resultUrl);
            accessToken = url.searchParams.get("access_token");
            refreshToken = url.searchParams.get("refresh_token");
          }

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              set({ loading: false, error: translateAuthError(sessionError) });
              return { success: false, error: translateAuthError(sessionError) };
            }

            if (sessionData.user) {
              const profile = await authHelpers.ensureUserProfile(sessionData.user.id, sessionData.user.user_metadata?.full_name);

              set({
                user: sessionData.user,
                session: sessionData.session,
                profile,
                loading: false,
              });

              return { success: true };
            }
          }
        }

        set({ loading: false });
        return { success: false, error: "Login cancelado" };
      }

      set({ loading: false });
      return { success: false, error: "Falha ao iniciar login" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign in with Apple (iOS native + Android OAuth)
   */
  signInWithApple: async () => {
    set({ loading: true, error: null });

    try {
      // iOS: Use native Apple Authentication
      if (Platform.OS === "ios") {
        const isAvailable = await AppleAuthentication.isAvailableAsync();

        if (!isAvailable) {
          set({ loading: false, error: "Apple Sign In não disponível neste dispositivo" });
          return { success: false, error: "Apple Sign In não disponível neste dispositivo" };
        }

        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        });

        if (!credential.identityToken) {
          set({ loading: false, error: "Falha ao obter token da Apple" });
          return { success: false, error: "Falha ao obter token da Apple" };
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
        });

        if (error) {
          set({ loading: false, error: translateAuthError(error) });
          return { success: false, error: translateAuthError(error) };
        }

        if (data.user) {
          const fullName = credential.fullName ? `${credential.fullName.givenName || ""} ${credential.fullName.familyName || ""}`.trim() : undefined;

          const profile = await authHelpers.ensureUserProfile(data.user.id, fullName);

          set({
            user: data.user,
            session: data.session,
            profile,
            loading: false,
          });

          return { success: true };
        }

        set({ loading: false });
        return { success: false, error: "Falha ao autenticar com Apple" };
      }

      // Android/Web: Use OAuth flow
      const redirectUrl = makeRedirectUri({
        // Don't pass scheme - let Expo figure out the correct one
        path: "auth/callback",
      });

      console.log("[Auth] Apple OAuth redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        set({ loading: false, error: translateAuthError(error) });
        return { success: false, error: translateAuthError(error) };
      }

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        console.log("[Auth] Apple OAuth result:", result.type);

        if (result.type === "success" && result.url) {
          const resultUrl = result.url;
          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          if (resultUrl.includes("#")) {
            const hashParams = new URLSearchParams(resultUrl.split("#")[1]);
            accessToken = hashParams.get("access_token");
            refreshToken = hashParams.get("refresh_token");
          }

          if (!accessToken) {
            const url = new URL(resultUrl);
            accessToken = url.searchParams.get("access_token");
            refreshToken = url.searchParams.get("refresh_token");
          }

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              set({ loading: false, error: translateAuthError(sessionError) });
              return { success: false, error: translateAuthError(sessionError) };
            }

            if (sessionData.user) {
              const profile = await authHelpers.ensureUserProfile(sessionData.user.id, sessionData.user.user_metadata?.full_name);

              set({
                user: sessionData.user,
                session: sessionData.session,
                profile,
                loading: false,
              });

              return { success: true };
            }
          }
        }

        set({ loading: false });
        return { success: false, error: "Login cancelado" };
      }

      set({ loading: false });
      return { success: false, error: "Falha ao iniciar login" };
    } catch (error) {
      if ((error as { code?: string }).code === "ERR_REQUEST_CANCELED") {
        set({ loading: false });
        return { success: false, error: "Login cancelado" };
      }

      const message = error instanceof Error ? error.message : "Erro desconhecido";
      set({ loading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    set({ loading: true });

    try {
      await supabase.auth.signOut();
      set({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("[Auth] Sign out failed:", error);
      // Force clear state even if API call fails
      set({
        user: null,
        session: null,
        profile: null,
        loading: false,
      });
    }
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),
}));

/**
 * Translate Supabase auth errors to Portuguese
 */
function translateAuthError(error: AuthError): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Email ou senha incorretos",
    "Email not confirmed": "Por favor, confirme seu email antes de fazer login",
    "User already registered": "Este email já está cadastrado",
    "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres",
    "Unable to validate email address: invalid format": "Formato de email inválido",
    "Email rate limit exceeded": "Muitas tentativas. Tente novamente mais tarde",
    "Signups not allowed for this instance": "Cadastros não permitidos no momento",
    "Provider not found": "Provedor de autenticação não configurado",
  };

  return errorMap[error.message] || error.message;
}
