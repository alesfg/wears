import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";

const PROPS = [
  { num: "01", text: "Add any piece from your closet" },
  { num: "02", text: "Log every time you wear it" },
  { num: "03", text: "Watch the cost-per-wear drop" },
];

export default function Welcome() {
  const router = useRouter();
  const { signInAsGuest } = useAuth();
  const [guestLoading, setGuestLoading] = useState(false);

  const handleGuest = async () => {
    setGuestLoading(true);
    await signInAsGuest();
    setGuestLoading(false);
    // AuthGuard in _layout.tsx handles redirect to /(app) on session change
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "space-between", paddingTop: 40, paddingBottom: 32 }}>
        {/* Header */}
        <View>
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular",
              fontSize: 52,
              color: Colors.ink,
              lineHeight: 58,
            }}
          >
            Wears
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular",
              fontSize: 22,
              color: Colors.cpw,
              marginTop: 4,
            }}
          >
            Your spending,{"\n"}justified.
          </Text>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 10,
              color: Colors.muted,
              letterSpacing: 1,
              marginTop: 12,
              lineHeight: 18,
            }}
          >
            TRACK COST-PER-WEAR. THE MORE{"\n"}YOU WEAR IT, THE CHEAPER IT GETS.
          </Text>
        </View>

        {/* Props */}
        <View style={{ gap: 20 }}>
          {PROPS.map((p) => (
            <View key={p.num} style={{ flexDirection: "row", gap: 16, alignItems: "flex-start" }}>
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: Colors.cpw,
                  letterSpacing: 1,
                  marginTop: 2,
                }}
              >
                {p.num}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSerif_400Regular",
                  fontSize: 17,
                  color: Colors.ink,
                  flex: 1,
                }}
              >
                {p.text}
              </Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(auth)/login", params: { mode: "signup" } })}
            style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center" }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 11,
                color: Colors.cream,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              Get Started — It&apos;s Free
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={{ paddingVertical: 14, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 10,
                color: Colors.muted,
                letterSpacing: 1,
              }}
            >
              I already have an account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGuest}
            disabled={guestLoading}
            style={{ paddingVertical: 10, alignItems: "center" }}
            activeOpacity={0.7}
          >
            {guestLoading ? (
              <ActivityIndicator size="small" color={Colors.muted} />
            ) : (
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: Colors.muted,
                  letterSpacing: 1,
                  textDecorationLine: "underline",
                }}
              >
                Continue as Guest
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
