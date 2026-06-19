import "../global.css";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from "@expo-google-fonts/instrument-serif";
import { DMSans_400Regular, DMSans_500Medium } from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { configureRevenueCat } from "@/lib/revenuecat";
import { configureGoogleSignIn } from "@/lib/googleSignIn";
import { setupNotificationChannel, requestNotificationPermission } from "@/lib/notifications";
import { posthog, Events } from "@/lib/posthog";
import { usePaywall } from "@/hooks/usePaywall";
import { useCurrencyStore } from "@/store/currencyStore";

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { session, isLoading } = useAuth();
  const { checkPro } = usePaywall();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (session && inAuthGroup) {
      router.replace("/(app)");
    }
  // router is stable from expo-router; intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isLoading, segments]);

  // Initialize RC + check Pro status when session starts
  useEffect(() => {
    if (!session) return;
    configureRevenueCat().then(() => checkPro());
    setupNotificationChannel();
    requestNotificationPermission();
    posthog.capture(Events.APP_OPEN, { user_id: session.user.id });
    posthog.identify(session.user.id, { email: session.user.email ?? "" });
  // checkPro is stable from zustand; intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic, DMSans_400Regular, DMSans_500Medium });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    useCurrencyStore.getState().init();
    configureGoogleSignIn();
  }, []);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="modal/add-item" options={{ presentation: "modal" }} />
          <Stack.Screen name="modal/add-watchlist-item" options={{ presentation: "modal" }} />
          <Stack.Screen name="modal/share" options={{ presentation: "modal" }} />
          <Stack.Screen name="modal/paywall" options={{ presentation: "modal" }} />
          <Stack.Screen name="modal/wrapped" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="modal/log-wear" options={{ presentation: "fullScreenModal", animation: "fade" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
