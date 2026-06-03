import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { useUserStore } from "@/store/userStore";
import { useItemStore } from "@/store/itemStore";
import { usePaywall } from "@/hooks/usePaywall";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/constants/theme";
import { FREE_TIER_ITEM_LIMIT } from "@/constants/config";
import { t } from "@/lib/i18n";
import { posthog, Events } from "@/lib/posthog";
import { getOrCreateReferralCode, getReferralStats } from "@/lib/referral";

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
          {t("becomeShareholder")}
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
          {t("upgradeTagline")}
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 12,
              color: "rgba(245,242,235,0.45)",
            }}
          >
            {t("upgradePrice")}
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
              {t("upgradeCta")}
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
          {t("activeSubscription")}
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
          {t("pieceCounter", { count: String(count), limit: String(limit) })}
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
          {t("spotsLeft", { n: String(spotsLeft) })}
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
  const { signOut: _signOut } = useAuth();
  const signOut = () => { posthog.capture(Events.SIGN_OUT); _signOut(); };

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralUses, setReferralUses] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    getOrCreateReferralCode(user.id).then(setReferralCode);
    getReferralStats(user.id).then((s) => { if (s) setReferralUses(s.uses); });
  }, [user?.id]);

  const displayName = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "You";
  const username    = user?.email?.split("@")[0]?.toLowerCase() ?? "you";
  const initial     = displayName[0]?.toUpperCase() ?? "W";

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
    : null;

  const subline = isPro
    ? `@${username} · ${t("shareholderSince")} ${createdAt ?? "2024"}`
    : `@${username} · ${t("sublineFreeTier", { count: String(items.length), limit: String(FREE_TIER_ITEM_LIMIT) })}`;

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
          {t("accountSettings")}
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

        {/* DATA */}
        <SectionLabel title={t("data")} />
        <View style={{ marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: SECTION_BG }}>
          <SettingRow
            label={t("connectedAccounts")}
            value={connectedAccount}
          />
          <SettingRow
            label={t("portfolioAnalytics")}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.navigate("/(app)/(tabs)/stats" as any)}
            value=""
            last
          />
        </View>

        {/* INVITE */}
        {referralCode && (
          <>
            <SectionLabel title="INVITE A FRIEND" />
            <View style={{ marginHorizontal: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: SECTION_BG, padding: 16 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.ink, marginBottom: 4 }}>
                Invite a friend — both get +2 free slots.
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, marginBottom: 14 }}>
                {referralUses} friend{referralUses !== 1 ? "s" : ""} joined so far.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `Track your closet like a portfolio. Download Wears and use my code ${referralCode} — we both get 2 extra slots free. wears.app`,
                    });
                  } catch { /* ignore */ }
                }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.ink, paddingHorizontal: 16, paddingVertical: 12 }}
                activeOpacity={0.85}
              >
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.cream, letterSpacing: 0.5 }}>
                  Share code · <Text style={{ color: Colors.cpw }}>{referralCode}</Text>
                </Text>
                <Feather name="share" size={14} color={Colors.cream} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ACCOUNT */}
        <SectionLabel title={t("account")} />
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
              {t("signOut")}
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
          {t("footerVersion")}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
