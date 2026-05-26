import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";

// ─── Receipt demo card ────────────────────────────────────────────────────────
function DashSep() {
  return (
    <View style={{ overflow: "hidden", marginVertical: 10 }}>
      <View style={{ borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#C8C0B4", marginBottom: -1 }} />
    </View>
  );
}

function ReceiptDemo() {
  return (
    <View
      style={{
        marginHorizontal: 20,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingVertical: 14,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
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
        ※ THE MATH IS ON YOUR SIDE ※
      </Text>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Welcome() {
  const router = useRouter();
  const { signInWithApple } = useAuth();
  const [appleLoading, setAppleLoading] = useState(false);

  const handleApple = async () => {
    setAppleLoading(true);
    await signInWithApple();
    setAppleLoading(false);
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
          A ledger for everything{"\n"}hanging in your closet.
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
        {/* Continue with Apple */}
        {Platform.OS === "ios" ? (
          appleLoading ? (
            <View
              style={{
                height: 56,
                backgroundColor: Colors.ink,
                borderRadius: 100,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
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
        ) : (
          <TouchableOpacity
            onPress={handleApple}
            style={{
              height: 56,
              backgroundColor: Colors.ink,
              borderRadius: 100,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 17, color: "#FFFFFF" }}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        )}

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
            Continue with email
          </Text>
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
            BY CONTINUING · YOU AGREE TO
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 2 }}>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: Colors.muted,
                letterSpacing: 1,
                textDecorationLine: "underline",
              }}
            >
              TERMS
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
              ·
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: Colors.muted,
                letterSpacing: 1,
                textDecorationLine: "underline",
              }}
            >
              PRIVACY
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
