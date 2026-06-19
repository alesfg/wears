import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Linking } from "react-native";
import { Feather, AntDesign } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { t } from "@/lib/i18n";

const PRIVACY_URL = "https://www.floresstudio.app/wears/privacy";
const TERMS_URL   = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

// ─── Receipt demo card ────────────────────────────────────────────────────────
function DashSep() {
  return (
    <View style={{ flexDirection: "row", marginVertical: 10, gap: 3 }}>
      {Array.from({ length: 36 }).map((_, i) => (
        <View key={i} style={{ flex: 1, height: 1, backgroundColor: "#C8C0B4" }} />
      ))}
    </View>
  );
}

function ReceiptDemo() {
  return (
    <View
      style={{
        marginHorizontal: 48,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
        transform: [{ rotate: "-3deg" }],
      }}
    >
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "#8A8070",
          letterSpacing: 2.5,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 2,
        }}
      >
        CLOSET · PORTFOLIO
      </Text>
      <DashSep />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 }}>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 11,
            color: "#1A1A1A",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          BLENDED CPW
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 30,
            color: Colors.cpw,
            lineHeight: 36,
          }}
        >
          $3.74
        </Text>
      </View>
      <DashSep />
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "#8A8070",
          letterSpacing: 2,
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: 2,
        }}
      >
        ※ {t("receiptFooter")} ※
      </Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Welcome() {
  const router = useRouter();
  const { signInWithApple, signInWithGoogle, signInAsGuest } = useAuth();
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    await signInAsGuest();
    setGuestLoading(false);
  };

  const handleApple = async () => {
    setAppleLoading(true);
    const err = await signInWithApple();
    setAppleLoading(false);
    if (err) Alert.alert("Error", err);
    // session change → AuthGuard redirects to /(app)
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const err = await signInWithGoogle();
    setGoogleLoading(false);
    if (err) Alert.alert("Error", err);
    // session change → AuthGuard redirects to /(app)
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      {/* Top content */}
      <View style={{ alignItems: "center", paddingTop: 28 }}>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 10,
            color: Colors.muted,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          EST · 2026
        </Text>

        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 100,
            color: Colors.ink,
            lineHeight: 106,
            letterSpacing: -2,
            textAlign: "center",
          }}
        >
          Wears
        </Text>

        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 22,
            color: "#9A8E82",
            textAlign: "center",
            lineHeight: 32,
            paddingHorizontal: 32,
            marginTop: 2,
          }}
        >
          {t("welcomeTagline")}
        </Text>
      </View>

      {/* Receipt card */}
      <View style={{ marginTop: 36 }}>
        <ReceiptDemo />
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* CTA area */}
      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {/* Continue with Apple — iOS only */}
        {Platform.OS === "ios" && (
          appleLoading ? (
            <View style={{ height: 56, backgroundColor: Colors.ink, borderRadius: 100, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={100}
              style={{ height: 56 }}
              onPress={handleApple}
            />
          )
        )}

        {/* Continue with Google */}
        <TouchableOpacity
          onPress={handleGoogle}
          disabled={googleLoading}
          style={{
            height: 56,
            backgroundColor: "#FFFFFF",
            borderRadius: 100,
            borderWidth: 1,
            borderColor: "#DDD6CE",
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
              <AntDesign name="google" size={18} color={Colors.ink} />
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 17, color: Colors.ink }}>
                {t("continueGoogle")}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Continue with email */}
        <TouchableOpacity
          onPress={() => router.push("/(auth)/login")}
          style={{
            height: 56,
            backgroundColor: "#FFFFFF",
            borderRadius: 100,
            borderWidth: 1,
            borderColor: "#DDD6CE",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
          activeOpacity={0.8}
        >
          <Feather name="mail" size={18} color={Colors.ink} />
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 17, color: Colors.ink }}>
            {t("continueEmail")}
          </Text>
        </TouchableOpacity>

        {/* OR divider */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: "#DDD6CE" }} />
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 10,
              color: Colors.muted,
              letterSpacing: 2,
            }}
          >
            {t("orDivider")}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "#DDD6CE" }} />
        </View>

        {/* Browse as guest */}
        <TouchableOpacity
          onPress={handleGuest}
          disabled={guestLoading}
          style={{ alignItems: "center", paddingVertical: 6 }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 15,
                color: Colors.ink,
                textDecorationLine: "underline",
              }}
            >
              {guestLoading ? "..." : t("browseAsGuest")}
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 10,
                color: Colors.muted,
                letterSpacing: 1.5,
              }}
            >
              · {t("noAcct")}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Legal footer */}
        <View style={{ alignItems: "center", paddingBottom: 4, paddingTop: 2 }}>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 9,
              color: Colors.muted,
              letterSpacing: 1,
              textAlign: "center",
            }}
          >
            {t("legalLine")}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
            <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, textDecorationLine: "underline" }}>
                {t("terms")}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>·</Text>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, textDecorationLine: "underline" }}>
                {t("privacy")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
