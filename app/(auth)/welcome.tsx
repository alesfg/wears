import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";

const PROFITABLE_GREEN = "#5B9966";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 28, color: Colors.ink }}>
            Wears
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 2 }}>
            EST · 2026
          </Text>
        </View>

        {/* Headline block */}
        <View style={{ marginTop: 56 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.cpw, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 14 }}>
            A FOUNDING THESIS
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 50, color: Colors.ink, lineHeight: 58 }}>
            {"Spending isn't\nshameful.\n"}
            <Text style={{ color: Colors.cpw }}>{"Wearing\nthe thing"}</Text>
            {" is."}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.muted, lineHeight: 24, marginTop: 28 }}>
            Wears tracks the cost-per-wear of every piece in your closet. The more you wear it, the cheaper it gets. The math is on your side.
          </Text>
        </View>

        {/* Demo item card */}
        <View style={{ marginTop: 40, backgroundColor: "#FFFFFF", padding: 16, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
          {/* Swatch */}
          <View style={{ width: 64, height: 64, backgroundColor: "#C5B49A", flexShrink: 0 }} />
          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: Colors.ink }}>
              The Trench, &apos;24
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 4 }}>
              $448 · 23 WEARS ·
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.cpw, letterSpacing: 1.5, textTransform: "uppercase" }}>
              $19.48/WEAR
            </Text>
          </View>
          {/* Badge */}
          <View style={{ borderWidth: 1, borderColor: PROFITABLE_GREEN, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: PROFITABLE_GREEN, letterSpacing: 1.5, textTransform: "uppercase" }}>
              PROFITABLE
            </Text>
          </View>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 32 }} />

        {/* CTAs */}
        <View style={{ gap: 16, marginTop: 32 }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/(auth)/login", params: { mode: "signup" } })}
            style={{ backgroundColor: Colors.ink, paddingVertical: 18, alignItems: "center", borderRadius: 100 }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.cream }}>
              Start the ledger →
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={{ paddingVertical: 8, alignItems: "center" }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
              ALREADY A SHAREHOLDER?{" "}
              <Text style={{ color: Colors.ink, fontFamily: "DMSans_500Medium" }}>SIGN IN</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
