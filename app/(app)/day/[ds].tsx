import { View, Text, Image, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Colors } from "@/constants/theme";
import { DashedLine } from "@/components/ui/DashedLine";
import { TierBadge } from "@/components/ui/TierBadge";
import { itemSwatchColor } from "@/components/features/ItemSwatch";
import { useItemStore } from "@/store/itemStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { buildWearsByDate, sortForOutfit, formatDayLabel, earnedForDay } from "@/lib/wearCalendar";
import { t } from "@/lib/i18n";
import type { ItemWithWears } from "@/lib/database.types";

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text
        style={{
          fontFamily: highlight ? "InstrumentSerif_400Regular_Italic" : "InstrumentSerif_400Regular",
          fontSize: highlight ? 26 : 20,
          color: highlight ? Colors.cpw : Colors.ink,
        }}
      >
        {value}
      </Text>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function DayItemCard({ item, ds, cardW, onPress }: { item: ItemWithWears; ds: string; cardW: number; onPress: () => void }) {
  const symbol = useCurrencyStore((s) => s.symbol);
  const occasion = item.wears.find((w) => w.worn_at === ds)?.occasion ?? null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={{ marginBottom: 28 }}>
      <View style={{ width: cardW, height: cardW, backgroundColor: itemSwatchColor(item), position: "relative" }}>
        {item.image_url && (
          <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
        )}
        <View style={{ position: "absolute", top: 10, right: 10 }}>
          <TierBadge cpw={item.cpw} />
        </View>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10 }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 19, color: Colors.ink }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }} numberOfLines={1}>
            {[item.brand, item.category, occasion].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: Colors.cpw }}>
            {symbol}{item.cpw.toFixed(2)}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 0.5 }}>
            {t("perWear")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DayDetail() {
  const { ds } = useLocalSearchParams<{ ds: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { items } = useItemStore();
  const symbol = useCurrencyStore((s) => s.symbol);

  const dayItems = useMemo(() => {
    if (!ds) return [];
    const wbd = buildWearsByDate(items);
    return sortForOutfit(wbd[ds] ?? []);
  }, [items, ds]);

  const costBasis = dayItems.reduce((s, i) => s + i.price, 0);
  const totalWears = dayItems.reduce((s, i) => s + i.wears.length, 0);
  const blendedCpw = totalWears > 0 ? costBasis / totalWears : 0;
  const earned = earnedForDay(dayItems);
  const cardW = width - 40;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      {/* Nav bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
            {"< "}{t("back")}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
          {dayItems.length} {t("calPieces")}
        </Text>
      </View>
      <DashedLine />

      {dayItems.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: Colors.muted }}>
            {t("calNoWears")}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero date */}
          <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 32, color: Colors.ink, lineHeight: 38 }}>
              {ds ? formatDayLabel(ds) : ""}
            </Text>
            {earned > 0 && (
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase", marginTop: 6 }}>
                +{symbol}{earned.toFixed(2)} {t("calEarned")}
              </Text>
            )}
          </View>

          {/* Stats */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 18 }}>
            <StatCell label={t("pieces")} value={String(dayItems.length)} />
            <StatCell label={t("costBasis")} value={`${symbol}${costBasis.toFixed(2)}`} />
            <StatCell label={t("blendedCpw")} value={blendedCpw > 0 ? `${symbol}${blendedCpw.toFixed(2)}` : "—"} highlight />
          </View>

          <DashedLine />

          {/* Outfit, head-to-toe */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {dayItems.map((item) => (
              <DayItemCard
                key={item.id}
                item={item}
                ds={ds!}
                cardW={cardW}
                onPress={() => router.push(`/(app)/item/${item.id}` as never)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
