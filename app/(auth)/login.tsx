import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { DashedLine } from "@/components/ui/DashedLine";
import { posthog, Events } from "@/lib/posthog";

export default function Login() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { signInWithApple } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password required.");
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
      if (signInError) setError(signInError.message);
    }
    setLoading(false);
  };

  const handleApple = async () => {
    setAppleLoading(true);
    setError(null);
    const err = await signInWithApple();
    if (err) setError(err);
    setAppleLoading(false);
    // session change → AuthGuard redirects to /(app)
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream, paddingHorizontal: 28 }} edges={["top", "bottom"]}>
      <TouchableOpacity onPress={() => router.replace("/(auth)/welcome")} style={{ paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>{"< "}BACK</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 38, color: Colors.ink, marginBottom: 4 }}>
          Wears
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
          {isSignUp ? "open account" : "sign in"}
        </Text>

        <DashedLine marginVertical={0} />

        {/* Apple Sign In — iOS only */}
        {Platform.OS === "ios" && (
          <View style={{ marginTop: 24, gap: 12 }}>
            {appleLoading ? (
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
            )}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.muted, letterSpacing: 1 }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            </View>
          </View>
        )}

        {/* Email / password */}
        <View style={{ paddingTop: Platform.OS === "ios" ? 0 : 24, gap: 20 }}>
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
              {isSignUp ? "create account" : "sign in"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={{ alignItems: "center", paddingTop: 16 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
            {isSignUp ? "already have an account? sign in" : "no account? create one"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
