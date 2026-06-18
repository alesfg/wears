import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { usePaywall } from "@/hooks/usePaywall";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DashedLine } from "@/components/ui/DashedLine";
import { ItemRow, ItemGridCard } from "@/components/features/ItemRow";
import { Colors } from "@/constants/theme";
import { FREE_TIER_ITEM_LIMIT } from "@/constants/config";
import { supabase } from "@/lib/supabase";
import type { ItemWithWears } from "@/lib/database.types";
import { t } from "@/lib/i18n";

function formatPeriod() {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${now.getFullYear()}`;
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 4 }}>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontFamily: highlight ? "InstrumentSerif_400Regular_Italic" : "DMSans_400Regular", fontSize: highlight ? 26 : 12, lineHeight: highlight ? 34 : 18, color: highlight ? Colors.cpw : Colors.ink }}>
        {value}
      </Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: active ? Colors.ink : Colors.border,
        backgroundColor: active ? Colors.ink : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: active ? Colors.cream : Colors.muted,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ListHeader({
  username, totalCostBasis, totalWears, pieces, blendedCpw, onWrappedPress,
  categories, categoryFilter, onCategoryChange, viewMode, onViewModeChange,
}: {
  username: string; totalCostBasis: number; totalWears: number; pieces: number; blendedCpw: number; onWrappedPress: () => void;
  categories: string[]; categoryFilter: string | null; onCategoryChange: (c: string | null) => void;
  viewMode: "list" | "grid"; onViewModeChange: (v: "list" | "grid") => void;
}) {
  const symbol = useCurrencyStore((s) => s.symbol);
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 40, color: Colors.ink, textAlign: "center" }}>
        Wears
      </Text>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 16 }}>
        {t("quarterlyLabel")} · {username} · {formatPeriod()}
      </Text>

      {/* Wrapped CTA */}
      <TouchableOpacity
        onPress={onWrappedPress}
        activeOpacity={0.88}
        style={{ marginBottom: 16 }}
      >
        <View style={{ backgroundColor: "#1A0D06", paddingVertical: 14, paddingHorizontal: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "rgba(245,242,235,0.45)", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 3 }}>
              ANNUAL EARNINGS REPORT
            </Text>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 20, color: "#F5F2EB" }}>
              Wears <Text style={{ color: Colors.cpw }}>&apos;{new Date().getFullYear().toString().slice(-2)}</Text> Wrapped
            </Text>
          </View>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: "rgba(245,242,235,0.6)" }}>→</Text>
        </View>
      </TouchableOpacity>

      <DashedLine marginVertical={4} />
      <View style={{ paddingVertical: 8 }}>
        <StatRow label={t("costBasis")} value={`${symbol}${totalCostBasis.toFixed(2)}`} />
        <StatRow label={t("wearsLogged")} value={String(totalWears)} />
        <StatRow label={t("pieces")} value={String(pieces)} />
      </View>
      <DashedLine marginVertical={4} />
      <View style={{ paddingVertical: 10 }}>
        <StatRow label={t("blendedCpw")} value={blendedCpw > 0 ? `${symbol}${blendedCpw.toFixed(2)}` : "—"} highlight />
      </View>
      {categories.length > 0 && (
        <>
          <DashedLine marginVertical={4} />
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <FilterChip label={t("filterAll")} active={categoryFilter === null} onPress={() => onCategoryChange(null)} />
              {categories.map((cat) => (
                <FilterChip
                  key={cat}
                  label={cat.toUpperCase()}
                  active={categoryFilter === cat}
                  onPress={() => onCategoryChange(categoryFilter === cat ? null : cat)}
                />
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => onViewModeChange(viewMode === "list" ? "grid" : "list")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ paddingLeft: 10 }}
              activeOpacity={0.7}
            >
              <Feather name={viewMode === "list" ? "grid" : "list"} size={16} color={Colors.ink} />
            </TouchableOpacity>
          </View>
        </>
      )}
      <DashedLine marginVertical={4} />
      {viewMode === "list" && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{t("itemCol")}</Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{t("cpwCol")}</Text>
        </View>
      )}
      <DashedLine />
    </View>
  );
}

function EmptyState() {
  const symbol = useCurrencyStore((s) => s.symbol);
  return (
    <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 32 }}>
      <Image
        source={require("@/assets/percha.png")}
        style={{ width: 96, height: 96, marginBottom: 20 }}
        resizeMode="contain"
      />
      <View style={{ width: "100%", borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed", padding: 24, alignItems: "center", gap: 12 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase" }}>
          PORTFOLIO SUMMARY
        </Text>
        <View style={{ width: "100%", height: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, borderStyle: "dashed" }} />
        {["—", "—", "—"].map((_, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", opacity: 0.3 }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.ink }}>item #{i + 1}</Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.ink }}>{symbol}—.—/wear</Text>
          </View>
        ))}
        <View style={{ width: "100%", height: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, borderStyle: "dashed" }} />
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 38, color: Colors.cpw, opacity: 0.25 }}>
          {symbol}0.00
        </Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
          BLENDED CPW
        </Text>
      </View>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 20, color: Colors.ink, textAlign: "center", marginTop: 28, marginBottom: 6 }}>
        {t("closetAwaits")}
      </Text>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center", letterSpacing: 0.8, lineHeight: 18 }}>
        {t("addFirstPiece")}
      </Text>
    </View>
  );
}

export default function ClosetLedger() {
  const router = useRouter();
  const { user, setSession } = useUserStore();
  const { items, isLoading, fetchItems } = useItemStore();
  const { isPro } = usePaywall();
  const { track, Events } = useAnalytics();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchItems(user.id);
  // fetchItems is stable from zustand; intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Show name prompt once if display_name is not set — but never for Apple
  // Sign In users, since Apple already provides their name (HIG requirement)
  useEffect(() => {
    const isAppleUser = user?.app_metadata?.provider === "apple";
    if (user && !isAppleUser && !user.user_metadata?.display_name) {
      const timer = setTimeout(() => setShowNamePrompt(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSavingName(true);
    const { data } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
    // onAuthStateChange in useAuth will re-sync the session; update store directly too
    if (data.user) setSession({ ...useUserStore.getState().session!, user: data.user });
    setSavingName(false);
    setShowNamePrompt(false);
  };

  const sorted = useMemo(() => [...items].sort((a, b) => a.cpw - b.cpw), [items]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter((c): c is string => !!c))).sort(),
    [items]
  );

  const filteredSorted = useMemo(
    () => (categoryFilter ? sorted.filter((i) => i.category === categoryFilter) : sorted),
    [sorted, categoryFilter]
  );

  const stats = useMemo(() => {
    const totalCostBasis = items.reduce((s, i) => s + i.price, 0);
    const totalWears = items.reduce((s, i) => s + i.wears.length, 0);
    const blendedCpw = totalWears > 0 ? totalCostBasis / totalWears : 0;
    return { totalCostBasis, totalWears, blendedCpw, pieces: items.length };
  }, [items]);

  const rawName = user?.user_metadata?.display_name;
  const username = rawName ? String(rawName).toUpperCase() : (user?.email?.split("@")[0]?.toUpperCase() ?? "YOU");

  if (isLoading && items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.ink} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      <FlatList
        key={viewMode}
        data={filteredSorted}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === "grid" ? 2 : 1}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: viewMode === "grid" ? 14 : 0 }}
        ListHeaderComponent={
          <ListHeader
            username={username}
            totalCostBasis={stats.totalCostBasis}
            totalWears={stats.totalWears}
            pieces={stats.pieces}
            blendedCpw={stats.blendedCpw}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onWrappedPress={() => {
              track(Events.FEATURE_USED, { feature: "wrapped", source: "home" });
              router.push("/modal/wrapped" as never);
            }}
          />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }: { item: ItemWithWears }) =>
          viewMode === "grid" ? (
            <ItemGridCard item={item} onPress={() => {
              track(Events.FEATURE_USED, { feature: "view_item", item_id: item.id });
              router.push(`/(app)/item/${item.id}`);
            }} />
          ) : (
            <View>
              <ItemRow item={item} onPress={() => {
                track(Events.FEATURE_USED, { feature: "view_item", item_id: item.id });
                router.push(`/(app)/item/${item.id}`);
              }} />
              <DashedLine color={Colors.border} />
            </View>
          )
        }
      />

      {/* Subtle upgrade nudge when 1 slot left on free tier */}
      {!isPro && items.length === FREE_TIER_ITEM_LIMIT - 1 && (
        <TouchableOpacity
          onPress={() => router.push("/modal/paywall")}
          style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: "#1A1208", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(245,242,235,0.6)", letterSpacing: 1.5 }}>
            1 SLOT LEFT ON FREE PLAN
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 13, color: "#C4503A" }}>
            Unlock unlimited →
          </Text>
        </TouchableOpacity>
      )}

      {/* Always-visible bottom CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.cream, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <TouchableOpacity
          onPress={() => router.push("/modal/log-wear" as never)}
          style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center" }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
            {t("logWearCta")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Name prompt */}
      <Modal
        visible={showNamePrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNamePrompt(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.35)" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={{ backgroundColor: Colors.cream, width: "82%", padding: 28, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 28, color: Colors.ink, textAlign: "center", marginBottom: 6 }}>
              {t("whatsYourName")}
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textAlign: "center", textTransform: "uppercase", marginBottom: 20 }}>
              {t("appearsInLedger")}
            </Text>
            <DashedLine marginVertical={0} />
            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={t("namePlaceholder")}
              placeholderTextColor={Colors.border}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={saveName}
              style={{
                fontFamily: "InstrumentSerif_400Regular",
                fontSize: 22,
                color: Colors.ink,
                textAlign: "center",
                paddingVertical: 16,
                letterSpacing: 0.5,
              }}
            />
            <DashedLine marginVertical={0} />
            <TouchableOpacity
              onPress={saveName}
              disabled={savingName || !nameInput.trim()}
              style={{
                backgroundColor: nameInput.trim() ? Colors.ink : Colors.border,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 20,
              }}
              activeOpacity={0.85}
            >
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
                {savingName ? t("saving") : t("continueCta")}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}
