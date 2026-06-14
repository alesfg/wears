import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Share,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { getTier } from "@/constants/config";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as SharingLib from "expo-sharing";
import { Asset as MediaAsset, requestPermissionsAsync } from "expo-media-library";
import { WrappedReceiptShare } from "@/components/features/shares/WrappedReceiptShare";
import type { ItemWithWears } from "@/lib/database.types";

const { width: SW, height: SH } = Dimensions.get("window");
const SLIDE_DURATION = 5500;
const TOTAL_SLIDES = 5;

const SWATCH_PALETTE = [
  "#E8DDD0", "#D4C5B0", "#C9B99A", "#DDD4C5",
  "#B8A898", "#CFC4B4", "#D8CFBE", "#C4BAA8",
];
function swatchColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SWATCH_PALETTE[h % SWATCH_PALETTE.length];
}

function cpwStr(val: number): string {
  if (val >= 100 && Number.isInteger(val)) return `$${val}`;
  return `$${val.toFixed(2)}`;
}

// ─── Story progress bar ───────────────────────────────────────────────────────
function StoryBar({
  totalSlides, currentSlide, progress, light,
}: {
  totalSlides: number; currentSlide: number; progress: Animated.Value; light: boolean;
}) {
  const track = light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)";
  const fill = light ? "#1A1A1A" : "#FFFFFF";
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingTop: 8, gap: 3 }}>
      {Array.from({ length: totalSlides }).map((_, i) => {
        const isActive = i === currentSlide;
        const isPast = i < currentSlide;
        const animWidth = isActive
          ? progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
          : isPast
          ? "100%"
          : "0%";
        return (
          <View key={i} style={{ flex: 1, height: 2, backgroundColor: track, overflow: "hidden" }}>
            <Animated.View style={{ height: 2, width: animWidth, backgroundColor: fill }} />
          </View>
        );
      })}
    </View>
  );
}

// ─── Story header ─────────────────────────────────────────────────────────────
function StoryHeader({
  initial, name, year, onClose, light,
}: {
  initial: string; name: string; year: string; onClose: () => void; light: boolean;
}) {
  const textColor = light ? Colors.ink : "#F5F2EB";
  const mutedColor = light ? Colors.muted : "rgba(245,242,235,0.6)";
  const borderColor = light ? Colors.border : "rgba(245,242,235,0.3)";
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 14, color: textColor }}>
          {initial}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 12, color: textColor, letterSpacing: 0.3 }}>
          @{name.toLowerCase()}{" "}
          <Text style={{ color: mutedColor }}>· WRAPPED {year}</Text>
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 18, color: textColor, lineHeight: 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Slide 0: Intro (dark gradient) ──────────────────────────────────────────
function Slide0({ name, year, pieces, totalWears, blendedCpw }: {
  name: string; year: string; pieces: number; totalWears: number; blendedCpw: number;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      {/* Labels + headline */}
      <View style={{ marginTop: 32 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: "rgba(245,242,235,0.45)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>
          ANNUAL EARNINGS REPORT
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 80, color: "#F5F2EB", lineHeight: 84, letterSpacing: -1 }}>
          Wears
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 80, color: Colors.cpw, lineHeight: 84, letterSpacing: -1 }}>
          &apos;{year}
        </Text>
      </View>

      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 20, color: "#F5F2EB", lineHeight: 30, marginTop: 28 }}>
        {name}, your closet had a quiet, profitable year. Let&apos;s go to the numbers.
      </Text>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Stat strip */}
      <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 20 }}>
        {[
          { label: "CLOSET", value: String(pieces) },
          { label: "WEARS", value: String(totalWears) },
          { label: "CPW", value: cpwStr(blendedCpw) },
        ].map((s, i) => (
          <View
            key={s.label}
            style={{ flex: 1, alignItems: "center", paddingVertical: 16, borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: "rgba(255,255,255,0.1)" }}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.45)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
              {s.label}
            </Text>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 22, color: "#F5F2EB" }}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: "rgba(245,242,235,0.35)", letterSpacing: 2, textTransform: "uppercase", textAlign: "center", marginBottom: 12 }}>
        TAP TO BEGIN →
      </Text>
    </View>
  );
}

// ─── Slide 1: MVP item (cream) ────────────────────────────────────────────────
function Slide1({ item }: { item: ItemWithWears | null }) {
  if (!item) return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 28, color: Colors.ink, textAlign: "center" }}>
        Log some wears to unlock your MVP piece.
      </Text>
    </View>
  );

  const tierLabel = getTier(item.cpw).toUpperCase();

  return (
    <View style={{ flex: 1, paddingHorizontal: 16 }}>
      {/* Polaroid */}
      <View style={{ alignSelf: "center", transform: [{ rotate: "-2deg" }], marginTop: 16, marginBottom: 20 }}>
        <View style={{ backgroundColor: "#FFFFFF", padding: 10, paddingBottom: 14, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}>
          {/* Photo area */}
          <View style={{ width: SW - 72, aspectRatio: 1, overflow: "hidden", position: "relative" }}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <View style={{ flex: 1, backgroundColor: swatchColor(item.id) }} />
            )}
            {/* EXHIBIT A */}
            <Text style={{ position: "absolute", top: 10, left: 12, fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 2, textTransform: "uppercase" }}>
              EXHIBIT A
            </Text>
            {/* Tier badge */}
            <View style={{ position: "absolute", top: 16, right: -4, backgroundColor: "#F5F2EB", borderWidth: 1, borderColor: Colors.cpw, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.cpw, letterSpacing: 2, textTransform: "uppercase" }}>
                {tierLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={{ paddingHorizontal: 8 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
          MOST PROFITABLE PIECE OF 20{new Date().getFullYear().toString().slice(-2)}
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 38, color: Colors.ink, lineHeight: 44 }}>
          {item.name}
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 38, color: Colors.cpw, lineHeight: 44 }}>
          earned her keep.
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 20, marginTop: 16 }}>
          {[
            { label: "WORN", value: `${item.wears.length}×` },
            { label: "FROM", value: `$${item.price}` },
            { label: "TO", value: cpwStr(item.cpw), accent: true },
          ].map((s) => (
            <View key={s.label}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
                {s.label}
              </Text>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 24, color: s.accent ? Colors.cpw : Colors.ink }}>
                {s.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Slide 2: Total wears (terracotta) ───────────────────────────────────────
function Slide2({ totalWears, busiestMonth, quietestMonth }: {
  totalWears: number;
  busiestMonth: [string, number] | null;
  quietestMonth: [string, number] | null;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: "rgba(245,242,235,0.55)", letterSpacing: 3, textTransform: "uppercase", marginTop: 20, marginBottom: 8 }}>
        THIS YEAR YOU WORE
      </Text>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 110, color: "#F5F2EB", lineHeight: 128, letterSpacing: -2 }}>
        {totalWears}
      </Text>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 44, color: "#F5F2EB", marginTop: -4, marginBottom: 28 }}>
        outfits.
      </Text>

      <View style={{ flex: 1 }} />

      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 22, color: "#F5F2EB", lineHeight: 32, marginBottom: 24 }}>
        That&apos;s more than the average woman wears in eighteen months. You are{" "}
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic" }}>using</Text>
        {" "}your closet.
      </Text>

      {/* Month stat boxes */}
      {(busiestMonth || quietestMonth) && (
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          {busiestMonth && (
            <View style={{ flex: 1, borderWidth: 1, borderColor: "rgba(245,242,235,0.35)", padding: 12 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.55)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                MOST FREQUENT MONTH
              </Text>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 16, color: "#F5F2EB" }}>
                {busiestMonth[0].slice(0, 3).toUpperCase()}· {busiestMonth[1]}
              </Text>
            </View>
          )}
          {quietestMonth && (
            <View style={{ flex: 1, borderWidth: 1, borderColor: "rgba(245,242,235,0.35)", padding: 12 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.55)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                QUIETEST
              </Text>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 16, color: "#F5F2EB" }}>
                {quietestMonth[0].slice(0, 3).toUpperCase()}· {quietestMonth[1]}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Slide 3: Underperformers (dark) ─────────────────────────────────────────
function Slide3({ items }: { items: ItemWithWears[] }) {
  const count = Math.min(items.length, 2);
  const label = count === 1 ? "one piece" : `${count} pieces`;

  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={{ marginTop: 20, marginBottom: 24 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: "rgba(245,242,235,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          THE UNDERPERFORMERS
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 40, color: "#F5F2EB", lineHeight: 48 }}>
          A gentle word{"\n"}about{" "}
          <Text style={{ color: Colors.cpw }}>{label}.</Text>
        </Text>
      </View>

      {/* Item cards */}
      <View style={{ gap: 10 }}>
        {items.slice(0, 2).map((item) => (
          <View key={item.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 12 }}>
            <View style={{ width: 56, height: 56, overflow: "hidden", flexShrink: 0 }}>
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ width: 56, height: 56 }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, backgroundColor: swatchColor(item.id) }} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: "#F5F2EB" }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.45)", letterSpacing: 1, marginTop: 3 }}>
                {[item.brand?.toUpperCase(), `${item.wears.length}× WORN`, `$${item.price}`].filter(Boolean).join(" · ")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 20, color: Colors.cpw }}>
                {cpwStr(item.cpw)}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.4)", letterSpacing: 1 }}>
                /wear
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 20, color: "#F5F2EB", lineHeight: 30, marginBottom: 20 }}>
        No judgment. Just wear them{" "}
        <Text style={{ color: Colors.cpw }}>three times each</Text>
        {" "}and the math fixes itself.
      </Text>
    </View>
  );
}

// ─── Slide 4: Final card (cream) ──────────────────────────────────────────────
type ShareFormat = "card" | "receipt";

function Slide4({
  name, year, pieces, totalWears, blendedCpw, mostProfitable, busiestMonth,
  format, onFormatChange, cardRef, onShare, onSaveToRoll, saving, onReplay,
}: {
  name: string; year: string; pieces: number; totalWears: number; blendedCpw: number;
  mostProfitable: ItemWithWears | null; busiestMonth: [string, number] | null;
  format: ShareFormat; onFormatChange: (f: ShareFormat) => void;
  cardRef: React.RefObject<ViewShotRef | null>;
  onShare: () => void; onSaveToRoll: () => void; saving: boolean; onReplay: () => void;
}) {
  const cardWidth = SW - 48;

  return (
    <View style={{ flex: 1 }}>
      {/* Format tabs */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 8 }}>
        {(["card", "receipt"] as ShareFormat[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => onFormatChange(f)}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 6,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: format === f ? Colors.ink : Colors.border,
              backgroundColor: format === f ? Colors.ink : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: format === f ? Colors.cream : Colors.muted }}>
              {f === "card" ? "Card" : "Receipt"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}
        style={{ flex: 1 }}
      >
        <ViewShot ref={cardRef} options={{ format: "png", quality: 1.0 }}>
          {format === "card" ? (
            <View style={{ width: cardWidth, transform: [{ rotate: "-4deg" }], shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
              <LinearGradient
                colors={["#8B3015", Colors.cpw, "#A0401F"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 24, paddingBottom: 28 }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.6)", letterSpacing: 2, textTransform: "uppercase" }}>
                    WEARS · SHAREHOLDER
                  </Text>
                  <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.6)", letterSpacing: 1 }}>
                    &apos;{year} / Q4
                  </Text>
                </View>

                <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 44, color: "#F5F2EB", lineHeight: 50, marginTop: 8 }}>
                  {name}.
                </Text>

                {/* Dashed line */}
                <View style={{ borderBottomWidth: 1, borderBottomColor: "rgba(245,242,235,0.3)", borderStyle: "dashed", marginVertical: 16 }} />

                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.6)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
                  BLENDED COST PER WEAR
                </Text>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 56, color: "#F5F2EB", letterSpacing: -1 }}>
                  {cpwStr(blendedCpw)}
                </Text>
              </LinearGradient>
            </View>
          ) : (
            <WrappedReceiptShare
              name={name}
              year={year}
              pieces={pieces}
              totalWears={totalWears}
              blendedCpw={blendedCpw}
              mostProfitable={mostProfitable}
              busiestMonth={busiestMonth}
            />
          )}
        </ViewShot>
      </ScrollView>

      {/* Tagline */}
      {format === "card" && (
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 26, color: Colors.ink, lineHeight: 34, textAlign: "center", marginBottom: 20, paddingHorizontal: 24 }}>
          You&apos;re{" "}
          <Text style={{ color: Colors.cpw }}>profitable</Text>
          , {name}.{"\n"}Q1 outlook strong.
        </Text>
      )}

      {/* Action buttons */}
      <View style={{ paddingHorizontal: 24, marginBottom: 20, gap: 10 }}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onShare}
            disabled={saving}
            style={{ flex: 1, backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center", borderRadius: 100, flexDirection: "row", justifyContent: "center", gap: 8 }}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 1 }}>
                ↑  Share
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSaveToRoll}
            disabled={saving}
            style={{ flex: 1, backgroundColor: "transparent", paddingVertical: 16, alignItems: "center", borderRadius: 100, borderWidth: 1, borderColor: Colors.ink }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.ink, letterSpacing: 1 }}>
              Save to Photos
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onReplay}
          style={{ paddingVertical: 12, alignItems: "center" }}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 14, color: Colors.muted }}>
            Replay
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Wrapped() {
  const router = useRouter();
  const items = useItemStore((s) => s.items);
  const { user } = useUserStore();
  const insets = useSafeAreaInsets();

  const displayName = useMemo(() => {
    const raw = user?.user_metadata?.display_name ?? user?.email?.split("@")[0] ?? "You";
    return String(raw);
  }, [user]);

  const year = new Date().getFullYear().toString().slice(-2);

  const stats = useMemo(() => {
    const totalWears = items.reduce((s, i) => s + i.wears.length, 0);
    const totalCostBasis = items.reduce((s, i) => s + i.price, 0);
    const blendedCpw = totalWears > 0 ? totalCostBasis / totalWears : 0;
    const pieces = items.length;

    const withWears = items.filter((i) => i.wears.length > 0);
    const mostProfitable = withWears.length > 0
      ? [...withWears].sort((a, b) => a.cpw - b.cpw)[0]
      : null;
    const underperformers = [...items].sort((a, b) => b.cpw - a.cpw).slice(0, 2);

    // Month counts from all wears
    const monthCounts: Record<string, number> = {};
    for (const item of items) {
      for (const wear of item.wears) {
        const d = new Date(wear.worn_at + "T12:00:00");
        const m = d.toLocaleString("en-US", { month: "long" }).toUpperCase();
        monthCounts[m] = (monthCounts[m] || 0) + 1;
      }
    }
    const entries = Object.entries(monthCounts);
    const busiestMonth = entries.length > 0
      ? entries.reduce((max, cur) => cur[1] > max[1] ? cur : max) as [string, number]
      : null;
    const quietestMonth = entries.length > 1
      ? entries.reduce((min, cur) => cur[1] < min[1] ? cur : min) as [string, number]
      : null;

    return { totalWears, blendedCpw, pieces, mostProfitable, underperformers, busiestMonth, quietestMonth };
  }, [items]);

  // Story state
  const [slide, setSlide] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    posthog.capture(Events.WRAPPED_STARTED);
  }, []);

  const advance = useCallback(() => {
    setSlide((s) => {
      const next = Math.min(s + 1, TOTAL_SLIDES - 1);
      if (next === TOTAL_SLIDES - 1 && s !== TOTAL_SLIDES - 1) {
        posthog.capture(Events.WRAPPED_COMPLETED);
      }
      return next;
    });
  }, []);

  const retreat = useCallback(() => {
    setSlide((s) => Math.max(s - 1, 0));
  }, []);

  useEffect(() => {
    progress.setValue(0);
    animRef.current?.stop();
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_DURATION,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) advance();
    });
    return () => animRef.current?.stop();
  // advance is stable via useCallback; progress ref is stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide]);

  const [shareFormat, setShareFormat] = useState<ShareFormat>("card");
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<ViewShotRef>(null);

  const captureCard = async (): Promise<string | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return cardRef.current ? await (cardRef.current as any).capture() : null;
  };

  const onShare = async () => {
    setSaving(true);
    try {
      const uri = await captureCard();
      if (uri && await SharingLib.isAvailableAsync()) {
        await SharingLib.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share your Wrapped" });
        posthog.capture(Events.SHARE_EXPORTED, { format: shareFormat, source: "wrapped", action: "share" });
      } else {
        await Share.share({
          message: `My Wears Wrapped '${year}: ${stats.pieces} pieces, ${stats.totalWears} wears, $${stats.blendedCpw.toFixed(2)} blended CPW. @wears`,
        });
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const onSaveToRoll = async () => {
    const { status } = await requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to save.");
      return;
    }
    setSaving(true);
    try {
      const uri = await captureCard();
      if (!uri) { setSaving(false); return; }
      await MediaAsset.create(uri);
      posthog.capture(Events.SHARE_EXPORTED, { format: shareFormat, source: "wrapped", action: "save" });
      Alert.alert("Saved!", "Image saved to your camera roll.");
    } catch (e: unknown) {
      Alert.alert("Error saving", e instanceof Error ? e.message : String(e));
    }
    setSaving(false);
  };

  const onReplay = () => setSlide(0);

  // Slide backgrounds
  const SLIDE_CONFIG = [
    { dark: true },  // 0: dark gradient
    { dark: false }, // 1: cream
    { dark: true },  // 2: terracotta
    { dark: true },  // 3: dark flat
    { dark: false }, // 4: cream
  ];
  const isLight = !SLIDE_CONFIG[slide].dark;

  return (
    <View style={{ flex: 1 }}>
      {/* Backgrounds */}
      {slide === 0 && (
        <LinearGradient
          colors={["#1A0D06", "#3D1A0A", "#1A0D06"]}
          start={{ x: 0.2, y: 0.3 }}
          end={{ x: 1, y: 0.8 }}
          style={styleAbsoluteFill}
        />
      )}
      {slide === 1 && <View style={[styleAbsoluteFill, { backgroundColor: Colors.cream }]} />}
      {slide === 2 && <View style={[styleAbsoluteFill, { backgroundColor: Colors.cpw }]} />}
      {slide === 3 && <View style={[styleAbsoluteFill, { backgroundColor: "#160E08" }]} />}
      {slide === 4 && <View style={[styleAbsoluteFill, { backgroundColor: Colors.cream }]} />}

      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
        {/* Progress bar */}
        <StoryBar totalSlides={TOTAL_SLIDES} currentSlide={slide} progress={progress} light={isLight} />

        {/* Header — rendered before tap zones so it's never blocked */}
        <StoryHeader
          initial={displayName[0]?.toUpperCase() ?? "W"}
          name={displayName}
          year={year}
          onClose={() => router.back()}
          light={isLight}
        />

        {/* Slide area: tap zones sit behind content here only, not over the header */}
        <View style={{ flex: 1 }}>
          {/* Tap zones — absolute fill within the slide area */}
          <View style={[styleAbsoluteFill, { flexDirection: "row" }]}>
            <TouchableOpacity style={{ width: "35%", height: "100%" }} activeOpacity={1} onPress={retreat} />
            <TouchableOpacity style={{ flex: 1, height: "100%" }} activeOpacity={1} onPress={advance} />
          </View>

          {/* Slide content — on top, pointerEvents box-none so non-interactive areas pass through */}
          <View style={{ flex: 1 }} pointerEvents="box-none">
            {slide === 0 && (
              <Slide0
                name={displayName}
                year={year}
                pieces={stats.pieces}
                totalWears={stats.totalWears}
                blendedCpw={stats.blendedCpw}
              />
            )}
            {slide === 1 && <Slide1 item={stats.mostProfitable} />}
            {slide === 2 && (
              <Slide2
                totalWears={stats.totalWears}
                busiestMonth={stats.busiestMonth}
                quietestMonth={stats.quietestMonth}
              />
            )}
            {slide === 3 && <Slide3 items={stats.underperformers} />}
            {slide === 4 && (
              <Slide4
                name={displayName}
                year={year}
                pieces={stats.pieces}
                totalWears={stats.totalWears}
                blendedCpw={stats.blendedCpw}
                mostProfitable={stats.mostProfitable}
                busiestMonth={stats.busiestMonth}
                format={shareFormat}
                onFormatChange={setShareFormat}
                cardRef={cardRef}
                onShare={onShare}
                onSaveToRoll={onSaveToRoll}
                saving={saving}
                onReplay={onReplay}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styleAbsoluteFill = {
  position: "absolute" as const,
  top: 0, left: 0, right: 0, bottom: 0,
};
