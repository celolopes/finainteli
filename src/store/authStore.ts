import { AuthError, Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";
import { create } from "zustand";

import { database } from "../database";
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

export const useAuthStore = create<AuthState>((set, get) => ({
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
        const profile = await authHelpers.ensureUserProfile(session.user.id, session.user.user_metadata?.full_name || session.user.email?.split("@")[0], session.user.user_metadata?.avatar_url);

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
          // REMOVED AUTOMATIC PROFILE FETCH TO PREVENT LOOPS
          // The specific login methods (signInWithEmail, signInWithGoogle) are responsible
          // for fetching the profile and setting the state.
          // This prevents the listener from fighting with the imperative login flow.
          console.log("[Auth] Signed In event received. Initialization handoff.");
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
        const profile = await authHelpers.ensureUserProfile(data.user.id, data.user.email?.split("@")[0], data.user.user_metadata?.avatar_url);

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
        const profile = await authHelpers.ensureUserProfile(data.user.id, displayName, data.user.user_metadata?.avatar_url);

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
  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async () => {
    set({ loading: true, error: null });

    try {
      // Warm up the browser on Android to improve startup time and stability
      if (Platform.OS === "android") {
        await WebBrowser.warmUpAsync();
      }

      // For Expo Go, we need to use the Expo scheme
      // For standalone builds, use the app's custom scheme
      const redirectUrl = makeRedirectUri({
        // Don't pass scheme - let Expo figure out the correct one
        // This will use exp:// in Expo Go and the app scheme in standalone
        path: "auth/callback",
        preferLocalhost: false,
      });

      console.log("[Auth] Google OAuth redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.log("[Auth] OAuth error:", error.message);
        if (Platform.OS === "android") await WebBrowser.coolDownAsync();
        set({ loading: false, error: translateAuthError(error) });
        return { success: false, error: translateAuthError(error) };
      }

      console.log("[Auth] OAuth URL generated:", data.url ? "Yes" : "No");

      if (data.url) {
        // Open browser for OAuth flow
        console.log("[Auth] Opening browser...");

        let result;
        try {
          result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          console.log("[Auth] OAuth result type:", result.type);
          console.log("[Auth] OAuth result:", JSON.stringify(result, null, 2));
        } catch (browserError) {
          console.error("[Auth] Browser error:", browserError);
          if (Platform.OS === "android") await WebBrowser.coolDownAsync();
          set({ loading: false, error: "Falha ao abrir navegador. Verifique se o Chrome está instalado." });
          return { success: false, error: "Falha ao abrir navegador" };
        }

        // Cool down after session
        if (Platform.OS === "android") {
          await WebBrowser.coolDownAsync();
        }

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

            // Session is set successfully. We can proceed.
            // We'll try to fetch the profile, but won't block indefinitely if it hangs.
            // onAuthStateChange will also fire, so we're covered.

            // Session set successfully. Fetch profile manually now.
            if (sessionData.user) {
              let profile = get().profile;
              if (!profile) {
                try {
                  const fullName = sessionData.user.user_metadata?.full_name || sessionData.user.email?.split("@")[0];
                  profile = await authHelpers.ensureUserProfile(sessionData.user.id, fullName, sessionData.user.user_metadata?.avatar_url);
                } catch (e) {
                  console.warn("[Auth] internal profile fetch warning:", e);
                }
              }

              set({
                user: sessionData.user,
                session: sessionData.session,
                profile: profile || null,
                loading: false,
              });

              return { success: true };
            }

            set({ loading: false });
            return { success: true };
          }
        } else if (result.type === "cancel" || result.type === "dismiss") {
          set({ loading: false });
          // User cancelled, not an error
          return { success: false };
        }

        set({ loading: false });
        return { success: false, error: "Login não concluído" };
      }

      set({ loading: false });
      return { success: false, error: "Falha ao iniciar login" };
    } catch (error) {
      if (Platform.OS === "android") await WebBrowser.coolDownAsync();
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

          const profile = await authHelpers.ensureUserProfile(data.user.id, fullName, data.user.user_metadata?.avatar_url);

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
      if (Platform.OS === "android") {
        await WebBrowser.warmUpAsync();
      }

      const redirectUrl = "finainteli://auth/callback";

      console.log("[Auth] Apple OAuth redirect URL (Full):", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        if (Platform.OS === "android") await WebBrowser.coolDownAsync();
        set({ loading: false, error: translateAuthError(error) });
        return { success: false, error: translateAuthError(error) };
      }

      if (data.url) {
        console.log("[Auth] Opening browser with URL:", data.url);

        let initialUrlListener: any = null;

        // Check if app was opened by deep link immediately (cold start case)
        const checkInitialUrl = async () => {
          const url = await Linking.getInitialURL();
          if (url && url.startsWith("finainteli://")) {
            console.log("[Auth] Found initial URL:", url);
            return { type: "success", url };
          }
          return null;
        };

        // Create a promise that resolves if Linking catches the URL
        const linkingPromise = new Promise<{ type: string; url?: string }>((resolve) => {
          const handler = ({ url }: { url: string }) => {
            if (url.startsWith("finainteli://")) {
              console.log("[Auth] Linking listener caught URL:", url);
              if (Platform.OS === "android") WebBrowser.dismissBrowser(); // Ensure browser closes
              resolve({ type: "success", url });
            }
          };
          initialUrlListener = Linking.addEventListener("url", handler);
        });

        // Use openBrowserAsync on Android as a fallback when AuthSession fails
        // It simply opens Chrome and relies 100% on the Deep Link to get back
        let browserResult;
        try {
          if (Platform.OS === "android") {
            // On Android, check if we already have an initial URL pending
            const initial = await checkInitialUrl();
            if (initial) {
              browserResult = initial;
            } else {
              WebBrowser.openBrowserAsync(data.url);
              browserResult = await linkingPromise;
            }
          } else {
            // iOS usually behaves well with openAuthSessionAsync
            browserResult = await Promise.race([WebBrowser.openAuthSessionAsync(data.url, redirectUrl), linkingPromise]);
          }
        } catch (err) {
          console.error("[Auth] WebBrowser/Link error:", err);
          if (Platform.OS === "android") await WebBrowser.coolDownAsync();
          set({ loading: false, error: "Erro ao abrir navegador" });
          return { success: false, error: "Erro ao abrir navegador" };
        } finally {
          // Cleanup listener
          if (initialUrlListener) initialUrlListener.remove();
        }

        if (Platform.OS === "android") await WebBrowser.coolDownAsync();

        console.log("[Auth] Auth Result:", JSON.stringify(browserResult));

        if (browserResult && browserResult.type === "success" && browserResult.url) {
          const resultUrl = browserResult.url;
          console.log("[Auth] Redirect received:", resultUrl);

          let accessToken: string | null = null;
          let refreshToken: string | null = null;

          if (resultUrl.includes("#")) {
            const hashParams = new URLSearchParams(resultUrl.split("#")[1]);
            accessToken = hashParams.get("access_token");
            refreshToken = hashParams.get("refresh_token");
          }

          if (!accessToken) {
            try {
              const url = new URL(resultUrl);
              accessToken = url.searchParams.get("access_token");
              refreshToken = url.searchParams.get("refresh_token");
            } catch (e) {
              console.warn("[Auth] Failed to parse URL search params:", e);
            }
          }

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              console.error("[Auth] Session error:", sessionError);
              set({ loading: false, error: translateAuthError(sessionError) });
              return { success: false, error: translateAuthError(sessionError) };
            }

            if (sessionData.user) {
              console.log("[Auth] Session established successfully for:", sessionData.user.email);
              const profile = await authHelpers.ensureUserProfile(sessionData.user.id, sessionData.user.user_metadata?.full_name, sessionData.user.user_metadata?.avatar_url);

              set({
                user: sessionData.user,
                session: sessionData.session,
                profile,
                loading: false,
              });

              return { success: true };
            }
          } else {
            console.warn("[Auth] Tokens not found in URL. URL was:", resultUrl);
          }
        } else {
          console.log("[Auth] WebBrowser did not return success:", browserResult?.type);
        }

        set({ loading: false });
        // Se chegamos aqui sem sucesso mas sem erro explícito
        return { success: false, error: "Login não concluído (retorno inválido)" };
      }

      set({ loading: false });
      return { success: false, error: "Falha ao iniciar login" };
    } catch (error) {
      if (Platform.OS === "android") await WebBrowser.coolDownAsync();

      console.error("[Auth] Apple login exception:", error);
      const err = error as any;
      if (err?.code === "ERR_REQUEST_CANCELED") {
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

      // Limpa banco de dados local WatermelonDB para garantir isolamento
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });

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
