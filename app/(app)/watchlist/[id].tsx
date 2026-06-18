import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { Colors } from "@/constants/theme";
import {
  useWatchlistStore,
  getProjectedCpw,
  getVerdict,
  VERDICT_COLORS,
  type WatchlistStatus,
} from "@/store/watchlistStore";
import { useItemStore } from "@/store/itemStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { DashedLine } from "@/components/ui/DashedLine";
import { t } from "@/lib/i18n";

function verdictText(status: WatchlistStatus): string {
  switch (status) {
    case "BUY": return t("verdictBuy");
    case "STRETCH": return t("verdictStretch");
    case "WAIT": return t("verdictWait");
    case "SKIP": return t("verdictSkip");
  }
}

const SLIDER_MIN = 1;
const SLIDER_MAX = 500;
const TICKS = [1, 50, 150, 300, 500];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function WatchlistSlider({
  value,
  onValueChange,
  color,
}: {
  value: number;
  onValueChange: (v: number) => void;
  color: string;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);
  const onChangeRef = useRef(onValueChange);
  onChangeRef.current = onValueChange;

  const fillRatio = (value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
  const thumbLeft = trackWidth > 0 ? fillRatio * trackWidth - 11 : 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = clamp(e.nativeEvent.locationX, 0, trackWidthRef.current);
        startXRef.current = x;
        const newVal = clamp(
          Math.round((x / trackWidthRef.current) * (SLIDER_MAX - SLIDER_MIN) + SLIDER_MIN),
          SLIDER_MIN,
          SLIDER_MAX
        );
        onChangeRef.current(newVal);
      },
      onPanResponderMove: (_e, gs) => {
        if (trackWidthRef.current <= 0) return;
        const x = clamp(startXRef.current + gs.dx, 0, trackWidthRef.current);
        const newVal = clamp(
          Math.round((x / trackWidthRef.current) * (SLIDER_MAX - SLIDER_MIN) + SLIDER_MIN),
          SLIDER_MIN,
          SLIDER_MAX
        );
        onChangeRef.current(newVal);
      },
    })
  ).current;

  return (
    <View>
      <View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setTrackWidth(w);
          trackWidthRef.current = w;
        }}
        {...panResponder.panHandlers}
        style={{ height: 40, position: "relative", justifyContent: "center" }}
      >
        {/* Track background */}
        <View style={{ height: 3, backgroundColor: Colors.border }}>
          {/* Filled portion */}
          <View
            style={{ height: 3, backgroundColor: color, width: fillRatio * trackWidth }}
          />
        </View>

        {/* Thumb */}
        {trackWidth > 0 && (
          <View
            style={{
              position: "absolute",
              left: thumbLeft,
              top: 9,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: Colors.ink,
            }}
          />
        )}
      </View>

      {/* Tick labels */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
        {TICKS.map((tick) => (
          <Text
            key={tick}
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 8,
              color: Colors.muted,
              letterSpacing: 0.5,
            }}
          >
            {tick === 1 ? `1× ${t("watchlistOnce")}` : `${tick}×`}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ComparisonRow({
  label,
  cpw,
  last,
}: {
  label: string;
  cpw: number;
  last: boolean;
}) {
  const symbol = useCurrencyStore((s) => s.symbol);
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 11,
        }}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 12,
            color: Colors.ink,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 12,
            color: Colors.ink,
          }}
        >
          {symbol}{cpw.toFixed(2)}
        </Text>
      </View>
      {!last && (
        <View style={{ height: 1, backgroundColor: Colors.border }} />
      )}
    </>
  );
}

export default function ShouldIBuy() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items: watchlistItems } = useWatchlistStore();
  const { items: closetItems } = useItemStore();
  const symbol = useCurrencyStore((s) => s.symbol);

  const item = useMemo(() => watchlistItems.find((i) => i.id === id), [watchlistItems, id]);
  const [wears, setWears] = useState(item?.projectedWears ?? 50);

  const projCpw = item ? getProjectedCpw(item.price, wears) : 0;
  const verdict = getVerdict(projCpw);
  const verdictColor = VERDICT_COLORS[verdict];
  const verdictMsg = verdictText(verdict);

  const comparisonItems = useMemo(() => {
    if (closetItems.length === 0) return [];
    return [...closetItems]
      .sort((a, b) => Math.abs(a.cpw - projCpw) - Math.abs(b.cpw - projCpw))
      .slice(0, 3);
  }, [closetItems, projCpw]);

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.ink} />
      </SafeAreaView>
    );
  }

  const year = String(new Date().getFullYear()).slice(2);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.muted }}>
            {"<"}
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          {t("watchlistShouldIBuy")}
        </Text>

        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item card */}
        <View style={{ marginHorizontal: 20, marginBottom: 28 }}>
          <View
            style={{
              backgroundColor: Colors.white,
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              gap: 16,
            }}
          >
            <View
              style={{ width: 72, height: 72, backgroundColor: item.imageColor, flexShrink: 0 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "InstrumentSerif_400Regular_Italic",
                  fontSize: 20,
                  color: Colors.ink,
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: Colors.muted,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                {item.brand} · {symbol}{item.price.toLocaleString("en-US")} · {item.category}
              </Text>
            </View>
          </View>
        </View>

        {/* Wears question */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 8,
              color: Colors.muted,
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {t("watchlistHowManyTimes")}
          </Text>

          {/* Large wears count */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular",
                fontSize: 88,
                color: Colors.ink,
                lineHeight: 88,
              }}
            >
              {wears}
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 16,
                color: Colors.muted,
                marginLeft: 8,
                marginBottom: 10,
              }}
            >
              {t("shareWearsLower")}
            </Text>
          </View>

          {/* Slider */}
          <WatchlistSlider value={wears} onValueChange={setWears} color={verdictColor} />

          <DashedLine marginVertical={24} />

          {/* Projected CPW + verdict badge */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: Colors.muted,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {t("watchlistProjectedCpw")}
            </Text>

            {/* Verdict badge */}
            <View
              style={{
                borderWidth: 1,
                borderColor: verdictColor,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: verdictColor,
                  letterSpacing: 1.5,
                }}
              >
                {verdict}
              </Text>
            </View>
          </View>

          {/* Big projected CPW */}
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular_Italic",
              fontSize: 56,
              color: verdictColor,
              lineHeight: 62,
              marginBottom: 8,
            }}
          >
            {symbol}{projCpw.toFixed(2)}
          </Text>

          {/* Verdict text */}
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular_Italic",
              fontSize: 20,
              color: Colors.ink,
              marginBottom: 28,
            }}
          >
            {verdictMsg}
          </Text>

          {/* Comparison section */}
          {comparisonItems.length > 0 && (
            <>
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 8,
                  color: Colors.muted,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                {t("watchlistClosetComparison")}
              </Text>

              <View style={{ borderTopWidth: 1, borderTopColor: Colors.border }}>
                {comparisonItems.map((ci, idx) => {
                  const acqYear = new Date(ci.purchased_at).getFullYear().toString().slice(2);
                  const label = `${ci.name} · '${acqYear}`;
                  return (
                    <ComparisonRow
                      key={ci.id}
                      label={label}
                      cpw={ci.cpw}
                      last={idx === comparisonItems.length - 1}
                    />
                  );
                })}
              </View>
            </>
          )}

          {comparisonItems.length === 0 && (
            <View style={{ paddingVertical: 16 }}>
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: Colors.muted,
                  letterSpacing: 2.5,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {t("watchlistClosetComparison")}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSerif_400Regular_Italic",
                  fontSize: 14,
                  color: Colors.muted,
                }}
              >
                {t("watchlistAddItemsCompare")}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 32,
          paddingHorizontal: 20,
          paddingTop: 12,
          backgroundColor: Colors.cream,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: Colors.ink,
            paddingVertical: 16,
            alignItems: "center",
            borderRadius: 28,
          }}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 13,
              color: Colors.ink,
              letterSpacing: 0.3,
            }}
          >
            {t("watchlistAddToWishlistBtn")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flex: 1,
            backgroundColor: verdictColor,
            paddingVertical: 16,
            alignItems: "center",
            borderRadius: 28,
          }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 13,
              color: Colors.white,
              letterSpacing: 0.3,
            }}
          >
            {t("watchlistSleepOnIt")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
