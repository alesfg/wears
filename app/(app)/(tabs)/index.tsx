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
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { usePaywall } from "@/hooks/usePaywall";
import { useAnalytics } from "@/hooks/useAnalytics";
import { DashedLine } from "@/components/ui/DashedLine";
import { ItemRow } from "@/components/features/ItemRow";
import { Colors } from "@/constants/theme";
import { FREE_TIER_ITEM_LIMIT, OCCASIONS, getTier } from "@/constants/config";
import { supabase } from "@/lib/supabase";
import { scheduleTierMilestoneNotification } from "@/lib/notifications";
import type { ItemWithWears, WearInsert } from "@/lib/database.types";
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

function ListHeader({ username, totalCostBasis, totalWears, pieces, blendedCpw }: {
  username: string; totalCostBasis: number; totalWears: number; pieces: number; blendedCpw: number;
}) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 40, color: Colors.ink, textAlign: "center" }}>
        Wears
      </Text>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 16 }}>
        QUARTERLY · {username} · {formatPeriod()}
      </Text>
      <DashedLine marginVertical={4} />
      <View style={{ paddingVertical: 8 }}>
        <StatRow label={t("costBasis")} value={`$${totalCostBasis.toFixed(2)}`} />
        <StatRow label={t("wearsLogged")} value={String(totalWears)} />
        <StatRow label={t("pieces")} value={String(pieces)} />
      </View>
      <DashedLine marginVertical={4} />
      <View style={{ paddingVertical: 10 }}>
        <StatRow label={t("blendedCpw")} value={blendedCpw > 0 ? `$${blendedCpw.toFixed(2)}` : "—"} highlight />
      </View>
      <DashedLine marginVertical={4} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>{t("itemCol")}</Text>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>CPW</Text>
      </View>
      <DashedLine />
    </View>
  );
}

function EmptyState() {
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
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.ink }}>$—.—/wear</Text>
          </View>
        ))}
        <View style={{ width: "100%", height: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, borderStyle: "dashed" }} />
        <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 38, color: Colors.cpw, opacity: 0.25 }}>
          $0.00
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
  const { items, isLoading, fetchItems, logWear } = useItemStore();
  const { isAtFreeLimit, isPro } = usePaywall();
  const { track, Events } = useAnalytics();
  const [showWearPicker, setShowWearPicker] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [quickLogCard, setQuickLogCard] = useState<{ name: string; newCpw: number; wears: number } | null>(null);

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

  const stats = useMemo(() => {
    const totalCostBasis = items.reduce((s, i) => s + i.price, 0);
    const totalWears = items.reduce((s, i) => s + i.wears.length, 0);
    const blendedCpw = totalWears > 0 ? totalCostBasis / totalWears : 0;
    return { totalCostBasis, totalWears, blendedCpw, pieces: items.length };
  }, [items]);

  const rawName = user?.user_metadata?.display_name;
  const username = rawName ? String(rawName).toUpperCase() : (user?.email?.split("@")[0]?.toUpperCase() ?? "YOU");

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

  const closeWearPicker = () => {
    setShowWearPicker(false);
    setExpandedItemId(null);
    setQuickLogCard(null);
  };

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
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <ListHeader
            username={username}
            totalCostBasis={stats.totalCostBasis}
            totalWears={stats.totalWears}
            pieces={stats.pieces}
            blendedCpw={stats.blendedCpw}
          />
        }
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }: { item: ItemWithWears }) => (
          <View>
            <ItemRow item={item} onPress={() => {
              track(Events.FEATURE_USED, { feature: "view_item", item_id: item.id });
              router.push(`/(app)/item/${item.id}`);
            }} />
            <DashedLine color={Colors.border} />
          </View>
        )}
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
          onPress={() => setShowWearPicker(true)}
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

      {/* Wear picker + add new piece */}
      <Modal
        visible={showWearPicker}
        transparent
        animationType="slide"
        onRequestClose={closeWearPicker}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          activeOpacity={1}
          onPress={closeWearPicker}
        />
        <View style={{ backgroundColor: Colors.cream, maxHeight: "65%", borderTopWidth: 1, borderTopColor: Colors.border }}>
          {/* Sheet header */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase" }}>
              {quickLogCard ? "✓ LOGGED" : t("wearingToday")}
            </Text>
            <TouchableOpacity onPress={closeWearPicker} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <DashedLine />

          {quickLogCard ? (
            <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 36 }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: Colors.ink, textAlign: "center", marginBottom: 4 }}>
                {quickLogCard.name}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, textAlign: "center", letterSpacing: 1, marginBottom: 20 }}>
                {quickLogCard.wears}× worn
              </Text>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 64, color: Colors.cpw, textAlign: "center", lineHeight: 72 }}>
                ${quickLogCard.newCpw.toFixed(2)}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
                COST PER WEAR
              </Text>
              <TouchableOpacity onPress={closeWearPicker} style={{ paddingVertical: 14, alignItems: "center", backgroundColor: Colors.ink }} activeOpacity={0.85}>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
          <ScrollView bounces={false}>
            {/* Add new piece row — always first */}
            <TouchableOpacity
              onPress={() => {
                setShowWearPicker(false);
                openAddItem();
              }}
              activeOpacity={0.7}
            >
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
                  <TouchableOpacity
                    onPress={() => {
                      track(Events.FEATURE_USED, { feature: "log_wear_from_home", item_id: item.id });
                      setExpandedItemId(expanded ? null : item.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
                      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 16, color: Colors.ink, flex: 1 }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 15, lineHeight: 22, color: Colors.cpw }}>
                        ${item.cpw.toFixed(2)}<Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted }}> /wear</Text>
                      </Text>
                    </View>
                  </TouchableOpacity>

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
        </View>
      </Modal>
    </SafeAreaView>
  );
}
