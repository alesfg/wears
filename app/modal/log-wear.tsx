import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { usePaywall } from "@/hooks/usePaywall";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DashedLine } from "@/components/ui/DashedLine";
import { ItemRow } from "@/components/features/ItemRow";
import { Colors } from "@/constants/theme";
import { OCCASIONS, getTier } from "@/constants/config";
import { scheduleTierMilestoneNotification } from "@/lib/notifications";
import type { ItemWithWears, WearInsert } from "@/lib/database.types";
import { t } from "@/lib/i18n";

export default function LogWear() {
  const router = useRouter();
  const { user } = useUserStore();
  const { items, logWear } = useItemStore();
  const symbol = useCurrencyStore((s) => s.symbol);
  const { isAtFreeLimit } = usePaywall();
  const { track, Events } = useAnalytics();

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [quickLogCard, setQuickLogCard] = useState<{ name: string; newCpw: number; wears: number } | null>(null);

  const sorted = useMemo(() => [...items].sort((a, b) => a.cpw - b.cpw), [items]);

  const openAddItem = () => {
    if (isAtFreeLimit(items.length)) {
      track(Events.PAYWALL_SHOWN, { trigger: "item_limit" });
      router.push("/modal/paywall");
      return;
    }
    track(Events.FEATURE_USED, { feature: "add_item" });
    router.push("/modal/add-item");
  };

  const handleQuickLog = async (item: ItemWithWears, occasion?: string) => {
    if (!user?.id) return;
    const wear: WearInsert = {
      item_id: item.id,
      user_id: user.id,
      worn_at: new Date().toISOString().split("T")[0],
      occasion: occasion ?? null,
    };
    const prevTier = getTier(item.cpw);
    await logWear(wear);
    track(Events.WEAR_LOGGED, { item_id: item.id, occasion: occasion ?? null, source: "quick_log" });
    const newWears = item.wears.length + 1;
    const newCpw = item.price / newWears;
    const newTier = getTier(newCpw);
    if (newTier !== prevTier) {
      scheduleTierMilestoneNotification(item.name, newCpw, newWears);
    }
    setExpandedItemId(null);
    setQuickLogCard({ name: item.name, newCpw, wears: newWears });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase" }}>
          {quickLogCard ? t("loggedLabel") : t("wearingToday")}
        </Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.muted }}>✕</Text>
        </TouchableOpacity>
      </View>
      <DashedLine />

      {quickLogCard ? (
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 22, color: Colors.ink, textAlign: "center", marginBottom: 4 }}>
            {quickLogCard.name}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.muted, textAlign: "center", letterSpacing: 1, marginBottom: 24 }}>
            {quickLogCard.wears}× worn
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 76, color: Colors.cpw, textAlign: "center", lineHeight: 84 }}>
            {symbol}{quickLogCard.newCpw.toFixed(2)}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", marginBottom: 36 }}>
            {t("costPerWear")}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 16, alignItems: "center", backgroundColor: Colors.ink }} activeOpacity={0.85}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
              {t("doneCta")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Add new piece row — always first */}
          <TouchableOpacity onPress={openAddItem} activeOpacity={0.7}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}>
              <View style={{ width: 60, height: 60, borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 20, color: Colors.muted }}>+</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 17, color: Colors.ink }}>
                  {t("newPiece")}
                </Text>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 0.8, marginTop: 3 }}>
                  {t("addToCloset")}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {sorted.length > 0 && (
            <>
              <DashedLine />
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 }}>
                {t("fromCloset")}
              </Text>
            </>
          )}

          {sorted.map((item) => {
            const expanded = expandedItemId === item.id;
            return (
              <View key={item.id}>
                <ItemRow
                  item={item}
                  onPress={() => {
                    track(Events.FEATURE_USED, { feature: "log_wear_from_home", item_id: item.id });
                    setExpandedItemId(expanded ? null : item.id);
                  }}
                />

                {expanded && (
                  <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, marginBottom: 10 }}>
                      {t("occasionOptional")}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleQuickLog(item, undefined)}
                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>{t("skip")}</Text>
                      </TouchableOpacity>
                      {OCCASIONS.map((occ) => (
                        <TouchableOpacity
                          key={occ}
                          onPress={() => handleQuickLog(item, occ)}
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
                <DashedLine />
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
