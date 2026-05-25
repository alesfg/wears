import { useEffect } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { useItemStore } from "@/store/itemStore";

export function useAuth() {
  const { session, user, isLoading, setSession, setLoading, reset } = useUserStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        useItemStore.getState().reset();
      }
    });

    return () => subscription.unsubscribe();
  // Zustand setters are stable — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
  };

  const signInAsGuest = async (): Promise<string | null> => {
    const { error } = await supabase.auth.signInAnonymously();
    return error?.message ?? null;
  };

  const signInWithApple = async (): Promise<string | null> => {
    if (Platform.OS !== "ios") return "Apple Sign In is only available on iOS";
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) return "No identity token from Apple";

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        // Apple only sends name on first sign-in; pass it so Supabase stores it
        nonce: credential.authorizationCode ?? undefined,
      });
      return error?.message ?? null;
    } catch (e: unknown) {
      // ERR_CANCELED means user tapped Cancel — not a real error
      if ((e as { code?: string }).code === "ERR_CANCELED") return null;
      return (e as Error).message ?? "Apple Sign In failed";
    }
  };

  return { session, user, isLoading, signOut, signInAsGuest, signInWithApple };
}
