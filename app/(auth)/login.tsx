import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { AntDesign } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { DashedLine } from "@/components/ui/DashedLine";
import { posthog, Events } from "@/lib/posthog";
import { t } from "@/lib/i18n";

export default function Login() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { signInWithApple, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("emailPasswordRequired"));
      return;
    }
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      posthog.capture(Events.ONBOARDING_STEP, { step: 0, action: "signup" });
      router.replace("/(auth)/onboarding");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); }
      else { posthog.capture(Events.SIGN_IN, { method: "email" }); }
    }
    setLoading(false);
  };

  const handleApple = async () => {
    setAppleLoading(true);
    setError(null);
    const err = await signInWithApple();
    if (err) { setError(err); }
    else { posthog.capture(Events.SIGN_IN, { method: "apple" }); }
    setAppleLoading(false);
    // session change → AuthGuard redirects to /(app)
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const err = await signInWithGoogle();
    if (err) { setError(err); }
    else { posthog.capture(Events.SIGN_IN, { method: "google" }); }
    setGoogleLoading(false);
    // session change → AuthGuard redirects to /(app)
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 28 }} edges={["top", "bottom"]}>
      <TouchableOpacity onPress={() => router.replace("/(auth)/welcome")} style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>{"< "}{t("back")}</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 38, color: Colors.ink, marginBottom: 4 }}>
          Wears
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
          {isSignUp ? t("openAccount") : t("signIn")}
        </Text>

        <DashedLine marginVertical={0} />

        {/* Social sign in */}
        <View style={{ marginTop: 24, gap: 12 }}>
          {/* Apple Sign In — iOS only */}
          {Platform.OS === "ios" && (
            appleLoading ? (
              <View style={{ height: 44, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator color={Colors.ink} />
              </View>
            ) : (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={0}
                style={{ height: 44 }}
                onPress={handleApple}
              />
            )
          )}

          {/* Google Sign In */}
          <TouchableOpacity
            onPress={handleGoogle}
            disabled={googleLoading}
            style={{
              height: 44,
              borderWidth: 1,
              borderColor: Colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            activeOpacity={0.8}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.ink} />
            ) : (
              <>
                <AntDesign name="google" size={16} color={Colors.ink} />
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.ink }}>
                  {t("continueGoogle")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.muted, letterSpacing: 1 }}>{t("orDivider")}</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
          </View>
        </View>

        {/* Email / password */}
        <View style={{ gap: 20 }}>
          <TextInput
            style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.ink, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}
            placeholder="email"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.ink, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 8 }}
            placeholder="password"
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error && (
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.cpw, marginTop: 12, letterSpacing: 0.5 }}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center", marginTop: 28 }}
          onPress={handleAuth}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={Colors.cream} />
          ) : (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
              {isSignUp ? t("createAccount") : t("signIn")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ alignItems: "center", paddingTop: 16 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
            {isSignUp ? t("alreadyHaveAccount") : t("noAccount")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
