import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { usePaywall } from "@/hooks/usePaywall";
import { DashedLine } from "@/components/ui/DashedLine";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";

const FEATURES = [
  "UNLIMITED PIECES",
  "SHARE EXPORTS (RECEIPT, POLAROID, WALLET)",
  "ADVANCED CLOSET STATS",
  "QUARTERLY EARNINGS REPORTS",
];

export default function Paywall() {
  const router = useRouter();
  const { purchaseMonthly, purchaseAnnual, restore, isPro } = usePaywall();
  const [loading, setLoading] = useState<"monthly" | "annual" | "restore" | null>(null);

  useEffect(() => {
    posthog.capture(Events.PAYWALL_SHOWN);
  }, []);

  useEffect(() => {
    if (isPro) router.back();
  }, [isPro, router]);

  const handlePurchase = async (plan: "monthly" | "annual") => {
    setLoading(plan);
    try {
      const fn = plan === "monthly" ? purchaseMonthly : purchaseAnnual;
      await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Purchase cancelled.";
      if (!msg.includes("cancel")) {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    setLoading("restore");
    const ok = await restore();
    setLoading(null);
    if (!ok) Alert.alert("Nothing to restore", "No previous purchases found.");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      {/* Close */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ alignSelf: "flex-end", padding: 20 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>
          ✕
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Wordmark */}
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular",
            fontSize: 38,
            color: Colors.ink,
            textAlign: "center",
            marginBottom: 2,
          }}
        >
          Wears Pro
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            textAlign: "center",
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          PORTFOLIO UPGRADE
        </Text>

        <DashedLine marginVertical={4} />

        {/* Features */}
        <View style={{ paddingVertical: 20, gap: 14 }}>
          {FEATURES.map((f) => (
            <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cpw }}>✓</Text>
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 10,
                  color: Colors.ink,
                  letterSpacing: 1,
                  flex: 1,
                }}
              >
                {f}
              </Text>
            </View>
          ))}
        </View>

        <DashedLine marginVertical={4} />

        {/* Price options */}
        <View style={{ paddingTop: 20, gap: 12 }}>
          {/* Monthly */}
          <TouchableOpacity
            onPress={() => handlePurchase("monthly")}
            disabled={!!loading}
            style={{
              backgroundColor: Colors.ink,
              paddingVertical: 18,
              alignItems: "center",
            }}
            activeOpacity={0.85}
          >
            {loading === "monthly" ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 11,
                    color: Colors.cream,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  START 7-DAY FREE TRIAL
                </Text>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 9,
                    color: "rgba(245,242,235,0.6)",
                    letterSpacing: 1,
                    marginTop: 3,
                  }}
                >
                  then $4.99 / month
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Annual */}
          <TouchableOpacity
            onPress={() => handlePurchase("annual")}
            disabled={!!loading}
            style={{
              borderWidth: 1,
              borderColor: Colors.ink,
              paddingVertical: 18,
              alignItems: "center",
            }}
            activeOpacity={0.8}
          >
            {loading === "annual" ? (
              <ActivityIndicator color={Colors.ink} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: "DMSans_400Regular",
                      fontSize: 11,
                      color: Colors.ink,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    $29.99 / YEAR
                  </Text>
                  <View style={{ backgroundColor: Colors.cpw, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.cream, letterSpacing: 1 }}>
                      SAVE 50%
                    </Text>
                  </View>
                </View>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 9,
                    color: Colors.muted,
                    letterSpacing: 1,
                    marginTop: 3,
                  }}
                >
                  best value
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Restore */}
        <TouchableOpacity
          onPress={handleRestore}
          disabled={!!loading}
          style={{ alignItems: "center", paddingTop: 16 }}
        >
          {loading === "restore" ? (
            <ActivityIndicator color={Colors.muted} size="small" />
          ) : (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
              Restore Purchases
            </Text>
          )}
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 8,
            color: Colors.muted,
            textAlign: "center",
            marginTop: 12,
            lineHeight: 14,
          }}
        >
          Cancel anytime. Subscription auto-renews.{"\n"}
          Terms · Privacy
        </Text>
      </View>
    </SafeAreaView>
  );
}
