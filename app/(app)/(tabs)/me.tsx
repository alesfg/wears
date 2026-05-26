import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { useUserStore } from "@/store/userStore";
import { useItemStore } from "@/store/itemStore";
import { usePaywall } from "@/hooks/usePaywall";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { FREE_TIER_ITEM_LIMIT } from "@/constants/config";

const TOGGLE_GREEN = "#4CAF50";
const SECTION_BG = "#FFFFFF";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontFamily: "DMSans_400Regular",
        fontSize: 9,
        color: Colors.muted,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginTop: 24,
        marginBottom: 8,
        marginHorizontal: 20,
      }}
    >
      {title}
    </Text>
  );
}

function SettingRow({
  label, value, onPress, last,
}: {
  label: string; value: string; onPress?: () => void; last?: boolean;
}) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: 52,
          backgroundColor: SECTION_BG,
        }}
      >
        <Text style={{ flex: 1, fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.ink }}>
          {label}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.muted }}>
            {value}
          </Text>
          <Feather name="chevron-right" size={13} color={Colors.muted} />
        </View>
      </TouchableOpacity>
      {!last && <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 16 }} />}
    </>
  );
}

function ToggleRow({
  label, value, onChange, last,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          minHeight: 52,
          backgroundColor: SECTION_BG,
        }}
      >
        <Text style={{ flex: 1, fontFamily: "DMSans_400Regular", fontSize: 15, color: Colors.ink }}>
          {label}
        </Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: Colors.border, true: TOGGLE_GREEN }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={Colors.border}
        />
      </View>
      {!last && <View style={{ height: 1, backgroundColor: Colors.border, marginLeft: 16 }} />}
    </>
  );
}

// ─── Upgrade banner (free tier) ───────────────────────────────────────────────
function UpgradeBanner({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ marginHorizontal: 20, overflow: "hidden", backgroundColor: "#1A1208" }}>
      {/* Diagonal stripes texture */}
      {Array.from({ length: 18 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: 420,
            height: 1.5,
            backgroundColor: "rgba(255,255,255,0.035)",
            top: i * 18 - 20,
            left: -60,
            transform: [{ rotate: "-45deg" }],
          }}
        />
      ))}

      <View style={{ padding: 18, paddingBottom: 20 }}>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.cpw,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          ★ BECOME · A · SHAREHOLDER
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 26,
            color: "#F5F2EB",
            lineHeight: 34,
            marginBottom: 14,
          }}
        >
          Unlimited pieces.{"\n"}Wrapped. Wishlist.
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 12,
              color: "rgba(245,242,235,0.45)",
            }}
          >
            $2.50 / mo · 7-day free
          </Text>
          <TouchableOpacity
            onPress={onPress}
            style={{
              backgroundColor: Colors.cpw,
              paddingHorizontal: 18,
              paddingVertical: 10,
              borderRadius: 100,
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: "#FFFFFF" }}>
              Upgrade →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Pro status card ──────────────────────────────────────────────────────────
function ProCard() {
  return (
    <View
      style={{
        marginHorizontal: 20,
        backgroundColor: SECTION_BG,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 8,
            color: Colors.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          WEARS PREMIUM
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 20,
            color: Colors.ink,
          }}
        >
          Active subscription
        </Text>
      </View>
      <View
        style={{
          borderWidth: 1.5,
          borderColor: Colors.cpw,
          paddingHorizontal: 9,
          paddingVertical: 4,
        }}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 8,
            color: Colors.cpw,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          ★ PREMIUM
        </Text>
      </View>
    </View>
  );
}

// ─── Usage bar (free tier) ────────────────────────────────────────────────────
function UsageBar({ count, limit }: { count: number; limit: number }) {
  const pct = Math.min(count / limit, 1);
  const spotsLeft = Math.max(limit - count, 0);
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          PIECES · {count} / {limit}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {spotsLeft} SPOTS LEFT
        </Text>
      </View>
      <View style={{ height: 3, backgroundColor: Colors.border }}>
        <View style={{ height: 3, width: `${pct * 100}%`, backgroundColor: Colors.cpw }} />
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Me() {
  const router = useRouter();
  const { user } = useUserStore();
  const { items } = useItemStore();
  const { isPro } = usePaywall();
  const { signOut } = useAuth();

  // Notification toggles (local state, no persistence yet)
  const [notifDaily,      setNotifDaily]      = useState(true);
  const [notifUnderperf,  setNotifUnderperf]  = useState(true);
  const [notifShareholder, setNotifShareholder] = useState(false);
  const [notifWeekly,     setNotifWeekly]     = useState(true);

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "You";
  const username    = user?.email?.split("@")[0]?.toLowerCase() ?? "you";
  const initial     = displayName[0]?.toUpperCase() ?? "W";

  // Membership since (account creation date)
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
    : null;

  const subline = isPro
    ? `@${username} · SHAREHOLDER SINCE ${createdAt ?? "2024"}`
    : `@${username} · FREE TIER · ${items.length} OF ${FREE_TIER_ITEM_LIMIT} PIECES`;

  const provider = (user?.app_metadata?.provider as string | undefined) ?? "email";
  const connectedAccount = provider === "apple" ? "Apple ID" : provider === "google" ? "Google" : "Email";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.navigate("/(app)/(tabs)/" as any)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="chevron-left" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          ACCOUNT · SETTINGS
        </Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Profile */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 20,
          }}
        >
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: "#D0C4B2",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 28,
                color: Colors.ink,
              }}
            >
              {initial}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular",
                fontSize: 24,
                color: Colors.ink,
                lineHeight: 30,
              }}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 12,
                color: Colors.muted,
                letterSpacing: 0.3,
                marginTop: 3,
              }}
              numberOfLines={1}
            >
              {subline}
            </Text>
          </View>
        </View>

        {/* Pro card OR free upgrade banner */}
        {isPro ? (
          <ProCard />
        ) : (
          <>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <UpgradeBanner onPress={() => router.push("/modal/paywall" as any)} />
            <UsageBar count={items.length} limit={FREE_TIER_ITEM_LIMIT} />
          </>
        )}

        {/* PREFERENCES */}
        <SectionLabel title="PREFERENCES" />
        <View style={{ marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: SECTION_BG }}>
          <SettingRow label="Currency"          value="USD · $"         />
          <SettingRow label="Week starts"        value="Sunday"          />
          <SettingRow label="Default category"   value="Outerwear"       />
          <SettingRow label="Depreciation model" value="2yr · straight" last />
        </View>

        {/* NOTIFICATIONS */}
        <SectionLabel title="NOTIFICATIONS" />
        <View style={{ marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: SECTION_BG }}>
          <ToggleRow label="Daily log reminder"     value={notifDaily}       onChange={setNotifDaily}      />
          <ToggleRow label="Underperformer alerts"  value={notifUnderperf}   onChange={setNotifUnderperf}  />
          <ToggleRow label="Shareholder activity"   value={notifShareholder} onChange={setNotifShareholder} />
          <ToggleRow label="Weekly earnings report" value={notifWeekly}      onChange={setNotifWeekly} last />
        </View>

        {/* DATA */}
        <SectionLabel title="DATA" />
        <View style={{ marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: SECTION_BG }}>
          <SettingRow
            label="Connected accounts"
            value={connectedAccount}
          />
          <SettingRow
            label="Export ledger"
            value="CSV · PDF"
          />
          <SettingRow
            label="Portfolio analytics"
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.navigate("/(app)/(tabs)/stats" as any)}
            value=""
            last
          />
        </View>

        {/* DANGER */}
        <SectionLabel title="ACCOUNT" />
        <View style={{ marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: SECTION_BG }}>
          <TouchableOpacity
            onPress={signOut}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              minHeight: 52,
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 15,
                color: Colors.cpw,
              }}
            >
              Sign out
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 1.5,
            textAlign: "center",
            marginTop: 28,
          }}
        >
          WEARS · V1.0.0 · COST BASIS: JUSTIFIED
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
