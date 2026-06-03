import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { usePaywall } from "@/hooks/usePaywall";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";

const BG = "#1A1208";
const CARD_BG = "rgba(255,255,255,0.05)";
const MUTED = "rgba(255,255,255,0.35)";
const CREAM = "#F5F2EB";

const FEATURES: Array<{ label: string; note: string }> = [
  { label: "Unlimited pieces",    note: "no 5-item cap" },
  { label: "Share exports",       note: "receipt, polaroid, wallet" },
  { label: "Portfolio analytics", note: "full stats breakdown" },
  { label: "Watchlist",           note: '"should I buy?" calc' },
  { label: "Outfit calendar",     note: "month view + heatmap" },
];

function FeatureRow({ label, note }: { label: string; note: string }) {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 13,
        }}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 13,
            color: Colors.cpw,
            width: 20,
          }}
        >
          ✓
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 14,
            color: CREAM,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 10,
            color: MUTED,
            letterSpacing: 0.2,
          }}
        >
          · {note}
        </Text>
      </View>
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
    </View>
  );
}

function PriceCard({
  plan,
  selected,
  onPress,
  showBadge,
}: {
  plan: "yearly" | "monthly";
  selected: boolean;
  onPress: () => void;
  showBadge?: boolean;
}) {
  const isYearly = plan === "yearly";
  return (
    <View style={{ flex: 1, marginTop: 14 }}>
      {/* BEST · VALUE badge sits on top border */}
      {showBadge && (
        <View
          style={{
            position: "absolute",
            top: -1,
            left: 12,
            zIndex: 2,
            backgroundColor: Colors.cpw,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 3,
          }}
        >
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 7,
              color: "#FFFFFF",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            BEST · VALUE
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          flex: 1,
          backgroundColor: selected ? "rgba(196,80,58,0.08)" : CARD_BG,
          borderWidth: 1.5,
          borderColor: selected ? Colors.cpw : "rgba(255,255,255,0.12)",
          borderRadius: 12,
          padding: 14,
          paddingTop: showBadge ? 20 : 14,
        }}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: MUTED,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {isYearly ? "YEARLY" : "MONTHLY"}
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 34,
            color: CREAM,
            lineHeight: 40,
          }}
        >
          {isYearly ? "$24.99" : "$3.99"}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 10,
            color: MUTED,
            marginTop: 3,
          }}
        >
          {isYearly ? "$2.08 / mo · save 48%" : "per month"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Paywall() {
  const router = useRouter();
  const { purchaseMonthly, purchaseAnnual, restore, isPro } = usePaywall();
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "monthly">("yearly");
  const [loading, setLoading] = useState<"purchase" | "restore" | null>(null);

  useEffect(() => {
    posthog.capture(Events.PAYWALL_SHOWN);
  }, []);

  useEffect(() => {
    if (isPro) router.back();
  }, [isPro, router]);

  const handleTrial = async () => {
    setLoading("purchase");
    try {
      const fn = selectedPlan === "yearly" ? purchaseAnnual : purchaseMonthly;
      await fn();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Purchase cancelled.";
      if (!msg.toLowerCase().includes("cancel")) {
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
    if (ok) { posthog.capture(Events.PURCHASE_RESTORED); }
    else { Alert.alert("Nothing to restore", "No previous purchases found."); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => { posthog.capture(Events.PAYWALL_DISMISSED); router.back(); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 18,
                color: CREAM,
                lineHeight: 20,
              }}
            >
              ×
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              fontFamily: "DMSans_400Regular",
              fontSize: 9,
              color: MUTED,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            UPGRADE · WEARS PREMIUM
          </Text>

          {/* Balance the close button */}
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Eyebrow */}
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 10,
              color: Colors.cpw,
              letterSpacing: 3,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            BECOME · A · SHAREHOLDER
          </Text>

          {/* Headline */}
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular_Italic",
              fontSize: 52,
              color: CREAM,
              lineHeight: 58,
            }}
          >
            Every wear is{"\n"}
            <Text style={{ color: Colors.cpw }}>a dividend.</Text>
          </Text>

          {/* Body */}
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 15,
              color: "rgba(245,242,235,0.75)",
              lineHeight: 24,
              marginTop: 14,
              marginBottom: 24,
            }}
          >
            Premium unlocks the full ledger — unlimited pieces, year-end reports, and the social layer.
          </Text>

          {/* Feature list */}
          <View>
            {FEATURES.map((f) => (
              <FeatureRow key={f.label} label={f.label} note={f.note} />
            ))}
          </View>

          {/* Price cards */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 24 }}>
            <PriceCard
              plan="yearly"
              selected={selectedPlan === "yearly"}
              onPress={() => setSelectedPlan("yearly")}
              showBadge
            />
            <PriceCard
              plan="monthly"
              selected={selectedPlan === "monthly"}
              onPress={() => setSelectedPlan("monthly")}
            />
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={handleTrial}
            disabled={!!loading}
            style={{
              marginTop: 16,
              height: 58,
              backgroundColor: Colors.cpw,
              borderRadius: 100,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.85}
          >
            {loading === "purchase" ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 17,
                  color: "#FFFFFF",
                  letterSpacing: 0.2,
                }}
              >
                Start 7-day free trial →
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel note */}
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 9,
              color: MUTED,
              letterSpacing: 2,
              textTransform: "uppercase",
              textAlign: "center",
              marginTop: 12,
            }}
          >
            CANCEL ANYTIME · NO REMINDER NEEDED
          </Text>

          {/* Restore */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={!!loading}
            style={{ alignItems: "center", paddingTop: 12, paddingBottom: 4 }}
          >
            {loading === "restore" ? (
              <ActivityIndicator color={MUTED} size="small" />
            ) : (
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: 1,
                }}
              >
                Restore purchases
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
