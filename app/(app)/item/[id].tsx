import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { DashedLine } from "@/components/ui/DashedLine";
import { TierBadge } from "@/components/ui/TierBadge";
import { Colors } from "@/constants/theme";
import { OCCASIONS, getTier, TIERS } from "@/constants/config";
import { posthog, Events } from "@/lib/posthog";
import type { WearInsert, ItemWithWears } from "@/lib/database.types";

const { width } = Dimensions.get("window");
type Tab = "ticker" | "progress" | "log";

// ─── Progress bar helper ─────────────────────────────────────────────────────
function calcProgress(cpw: number, price: number): number {
  const tier = getTier(cpw);
  const idx = TIERS.findIndex((t) => t.name === tier);
  const nextThreshold = TIERS[idx + 1]?.maxCpw ?? 0;
  const prevThreshold = idx === 0 ? price : TIERS[idx].maxCpw;
  if (prevThreshold <= nextThreshold) return 1;
  return Math.min(1, (prevThreshold - cpw) / (prevThreshold - nextThreshold));
}

// ─── Ticker tab ──────────────────────────────────────────────────────────────
function TickerTab({
  item,
}: {
  item: ItemWithWears;
}) {
  const tierIdx = TIERS.findIndex((t) => t.name === getTier(item.cpw));
  const nextTier = TIERS[tierIdx + 1];
  const progress = calcProgress(item.cpw, item.price);
  const savedVsNew = Math.max(0, item.price - item.cpw * item.wears.length);

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <DashedLine />
      {/* CPW hero */}
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, marginBottom: 4 }}>
          COST PER WEAR
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 68, color: Colors.cpw, lineHeight: 76 }}>
          ${item.cpw.toFixed(2)}
        </Text>
      </View>

      {/* Progress toward next tier */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ height: 2, backgroundColor: Colors.border, marginBottom: 6, overflow: "hidden" }}>
          <View style={{ height: 2, backgroundColor: Colors.cpw, width: `${progress * 100}%` }} />
        </View>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, textAlign: "center" }}>
          {item.wears.length} WEARS
          {nextTier ? ` · NEXT: ${nextTier.name.toUpperCase()} AT $${nextTier.maxCpw}/WEAR` : " · FREE BASICALLY 🌸"}
        </Text>
      </View>

      <DashedLine />

      {/* Stats row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 20 }}>
        <StatCell label="WEARS" value={`${item.wears.length}×`} />
        <StatCell label="SPENT" value={`$${item.price}`} />
        <StatCell label="SAVED VS NEW" value={`$${savedVsNew.toFixed(0)}`} />
      </View>

      <DashedLine />

      {/* Recent wears */}
      {item.wears.length > 0 && (
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            RECENT WEARS
          </Text>
          {item.wears.slice(0, 4).map((w) => (
            <View key={w.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.ink }}>
                {w.worn_at.slice(5).replace("-", "/")}
                {w.occasion ? ` · ${w.occasion}` : ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Progress tab ─────────────────────────────────────────────────────────────
function ProgressTab({ item }: { item: ItemWithWears }) {
  const currentTier = getTier(item.cpw);
  const tierIdx = TIERS.findIndex((t) => t.name === currentTier);
  const savedVsNew = Math.max(0, item.price - item.cpw * item.wears.length);

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <DashedLine />

      {/* Current tier header */}
      <View style={{ paddingVertical: 20 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, marginBottom: 8 }}>
          CURRENT TIER
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 34, color: Colors.ink }}>
            {currentTier}
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 24, color: Colors.cpw }}>
            ${item.cpw.toFixed(2)}
          </Text>
        </View>
      </View>

      <DashedLine />

      {/* Tier ladder */}
      <View style={{ paddingVertical: 16 }}>
        {TIERS.map((tier, i) => {
          const achieved = i <= tierIdx;
          const current = i === tierIdx;
          const lineAchieved = i < tierIdx;
          return (
            <View key={tier.name}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: current ? 2 : 1.5,
                    borderColor: achieved ? Colors.cpw : Colors.border,
                    backgroundColor: achieved ? Colors.cpw : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  {achieved && (
                    <Text style={{ color: Colors.cream, fontSize: 11, lineHeight: 14 }}>✓</Text>
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: achieved ? "InstrumentSerif_400Italic" : "DMSans_400Regular",
                    fontSize: achieved ? 14 : 11,
                    color: achieved ? Colors.ink : Colors.muted,
                    letterSpacing: 0.5,
                    flex: 1,
                  }}
                >
                  {tier.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 10,
                    color: current ? Colors.cpw : achieved ? Colors.ink : Colors.muted,
                  }}
                >
                  {tier.maxCpw === Infinity ? "> $80/wear" : `≤ $${tier.maxCpw}/wear`}
                </Text>
              </View>
              {i < TIERS.length - 1 && (
                <View
                  style={{
                    width: 2,
                    height: 18,
                    backgroundColor: lineAchieved ? Colors.cpw : Colors.border,
                    marginLeft: 10,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>

      <DashedLine />

      {/* Stats */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 20 }}>
        <StatCell label="WEARS" value={`${item.wears.length}×`} />
        <StatCell label="SPENT" value={`$${item.price}`} />
        <StatCell label="SAVED VS NEW" value={`$${savedVsNew.toFixed(0)}`} />
      </View>
    </View>
  );
}

// ─── Log tab ─────────────────────────────────────────────────────────────────
function LogTab({ item }: { item: ItemWithWears }) {
  const wearsAsc = useMemo(
    () => [...item.wears].sort((a, b) => new Date(a.worn_at).getTime() - new Date(b.worn_at).getTime()),
    [item.wears]
  );

  const acquired = new Date(item.purchased_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      {/* Receipt header */}
      <View style={{ paddingBottom: 16 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5 }}>
          COST ${item.price} · WEARS {item.wears.length} · CPW ${item.cpw.toFixed(2)}
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, marginTop: 4 }}>
          LOG {item.name.toUpperCase()} SINCE {acquired.toUpperCase()}
        </Text>
      </View>

      <DashedLine />

      {/* Column headers */}
      <View style={{ flexDirection: "row", paddingVertical: 8 }}>
        <Text style={[colHeader, { flex: 3 }]}>DATE</Text>
        <Text style={[colHeader, { flex: 4 }]}>OCCASION</Text>
        <Text style={[colHeader, { flex: 3, textAlign: "right" }]}>CPW THEN</Text>
      </View>

      <DashedLine />

      {item.wears.length === 0 ? (
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center", paddingVertical: 24 }}>
          NO WEARS LOGGED YET
        </Text>
      ) : (
        <>
          {[...wearsAsc].reverse().map((wear, i) => {
            const cpwThen = (item.price / (wearsAsc.length - i)).toFixed(2);
            return (
              <View key={wear.id} style={{ flexDirection: "row", paddingVertical: 8 }}>
                <Text style={[rowText, { flex: 3 }]}>
                  {wear.worn_at.slice(2).replace(/-/g, "/")}
                </Text>
                <Text style={[rowText, { flex: 4, color: Colors.ink }]} numberOfLines={1}>
                  {wear.occasion ?? "—"}
                </Text>
                <Text style={[rowText, { flex: 3, textAlign: "right", color: Colors.cpw }]}>
                  ${cpwThen}
                </Text>
              </View>
            );
          })}

          <DashedLine style={{ marginTop: 8 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted }}>TOTAL WEARS</Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.ink }}>{item.wears.length}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 16 }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted }}>NET CPW</Text>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 16, color: Colors.cpw }}>
              ${item.cpw.toFixed(2)}
            </Text>
          </View>
          <DashedLine />
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2, paddingVertical: 12 }}>
            * KEEP THIS RECEIPT *
          </Text>
        </>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUserStore();
  const { items, logWear } = useItemStore();

  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);
  const [activeTab, setActiveTab] = useState<Tab>("ticker");
  const [showOccasionPicker, setShowOccasionPicker] = useState(false);
  const [logging, setLogging] = useState(false);

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.ink} />
      </SafeAreaView>
    );
  }

  const handleLogWear = async (occasion?: string) => {
    if (!user?.id) return;
    setLogging(true);
    setShowOccasionPicker(false);
    const wear: WearInsert = {
      item_id: item.id,
      user_id: user.id,
      worn_at: new Date().toISOString().split("T")[0],
      occasion: occasion ?? null,
    };
    await logWear(wear);
    posthog.capture(Events.WEAR_LOGGED, { item_id: item.id, occasion: occasion ?? null });
    setLogging(false);
  };

  const acquiredLabel = `${new Date(item.purchased_at).toLocaleString("en-US", { month: "short" }).toUpperCase()} ${new Date(item.purchased_at).getFullYear()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      {/* Nav bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
            {"< "}CLOSET{item.category ? ` / ${item.category.toUpperCase()}` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/modal/share", params: { id: item.id } })}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.ink, letterSpacing: 0.5 }}>···</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View style={{ width, height: width, position: "relative" }}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={{ width, height: width }} resizeMode="cover" />
          ) : (
            <View style={{ width, height: width, backgroundColor: "#E8E2D8", justifyContent: "flex-end", padding: 16 }}>
              {item.category && (
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {item.category} · {item.name.split(" ").pop()?.toUpperCase()}
                </Text>
              )}
            </View>
          )}
          <View style={{ position: "absolute", top: 12, right: 12 }}>
            <TierBadge cpw={item.cpw} />
          </View>
        </View>

        {/* Item name + meta */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
            {item.brand ? `${item.brand.toUpperCase()} · ` : ""}ACQUIRED {acquiredLabel}
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 28, color: Colors.ink }}>
            {item.name}
          </Text>
        </View>

        {/* Tab bar */}
        <View style={{ flexDirection: "row", marginTop: 16, marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
          {(["ticker", "progress", "log"] as Tab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab ? Colors.ink : "transparent",
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: activeTab === tab ? Colors.ink : Colors.muted,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === "ticker" && <TickerTab item={item} />}
        {activeTab === "progress" && <ProgressTab item={item} />}
        {activeTab === "log" && <LogTab item={item} />}
      </ScrollView>

      {/* Occasion picker overlay */}
      {showOccasionPicker && (
        <View
          style={{
            position: "absolute",
            bottom: 90,
            left: 20,
            right: 20,
            backgroundColor: Colors.cream,
            borderWidth: 1,
            borderColor: Colors.border,
            padding: 16,
            zIndex: 10,
          }}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, marginBottom: 12 }}>
            OCCASION (OPTIONAL)
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <TouchableOpacity
              onPress={() => handleLogWear(undefined)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border }}
            >
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>SKIP</Text>
            </TouchableOpacity>
            {OCCASIONS.map((occ) => (
              <TouchableOpacity
                key={occ}
                onPress={() => handleLogWear(occ)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border }}
                activeOpacity={0.7}
              >
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.ink, letterSpacing: 1 }}>
                  {occ.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Log CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.cream, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <TouchableOpacity
          onPress={() => setShowOccasionPicker(!showOccasionPicker)}
          disabled={logging}
          style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center" }}
          activeOpacity={0.85}
        >
          {logging ? (
            <ActivityIndicator color={Colors.cream} />
          ) : (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
              + I wore this today
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 20, color: Colors.ink }}>{value}</Text>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const colHeader = { fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" as const };
const rowText = { fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.ink };
