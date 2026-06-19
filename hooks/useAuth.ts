import { useEffect } from "react";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabase";
import { useUserStore } from "@/store/userStore";
import { useItemStore } from "@/store/itemStore";
import { getGoogleIdToken } from "@/lib/googleSignIn";
import { t } from "@/lib/i18n";

// Apple's review devices have hung mid-flow with the loading spinner stuck —
// race the native call against a timeout so the UI always recovers and the
// user gets an actionable error instead of a frozen screen.
const APPLE_SIGNIN_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

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
      // Raw nonce sent to Supabase; SHA-256 digest sent to Apple so neither side
      // gets the other's value — prevents replay attacks, required by Apple guidelines.
      const rawNonce = Crypto.getRandomBytes(32).reduce(
        (acc, byte) => acc + byte.toString(16).padStart(2, "0"),
        ""
      );
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

      const credential = await withTimeout(
        AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        }),
        APPLE_SIGNIN_TIMEOUT_MS,
        t("appleSignInTimeout")
      );
      if (!credential.identityToken) return "No identity token from Apple";

      const { error } = await withTimeout(
        supabase.auth.signInWithIdToken({
          provider: "apple",
          token: credential.identityToken,
          nonce: rawNonce,
        }),
        APPLE_SIGNIN_TIMEOUT_MS,
        t("appleSignInTimeout")
      );
      if (error) return error.message;

      // Apple only returns the user's name on the very first sign-in —
      // capture it now so the app never has to ask for it again.
      const { givenName, familyName } = credential.fullName ?? {};
      if (givenName) {
        const displayName = [givenName, familyName].filter(Boolean).join(" ");
        await supabase.auth.updateUser({ data: { display_name: displayName } });
      }

      return null;
    } catch (e: unknown) {
      // ERR_CANCELED means user tapped Cancel — not a real error
      if ((e as { code?: string }).code === "ERR_CANCELED") return null;
      return (e as Error).message ?? "Apple Sign In failed";
    }
  };

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return null; // user cancelled

      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });
      if (error) return error.message;
      return null;
    } catch (e: unknown) {
      return (e as Error).message ?? "Google Sign In failed";
    }
  };

  const deleteAccount = async (): Promise<string | null> => {
    const { error } = await supabase.functions.invoke("delete-account");
    if (error) {
      // Extract actual error body from the function response
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const body = await (error as any).context?.json?.();
        if (body?.error) return body.error;
      } catch { /* ignore parse errors */ }
      return error.message;
    }
    await supabase.auth.signOut();
    reset();
    return null;
  };

  return { session, user, isLoading, signOut, signInAsGuest, signInWithApple, signInWithGoogle, deleteAccount };
}
