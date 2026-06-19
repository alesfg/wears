const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

let _configured = false;

export async function configureGoogleSignIn() {
  if (!WEB_CLIENT_ID) return;
  try {
    const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID || undefined,
    });
    _configured = true;
  } catch {
    // No native module (e.g. Expo Go) — silently skip
  }
}

export function isGoogleSignInReady(): boolean {
  return _configured;
}

// Returns the Google ID token, or null if the user cancelled. Throws on
// real errors so the caller can surface a message.
export async function getGoogleIdToken(): Promise<string | null> {
  if (!_configured) throw new Error("Google Sign In is not configured");
  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") return null;
  return response.data.idToken;
}
