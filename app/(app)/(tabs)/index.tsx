import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
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
import type { ItemWithWears } from "@/lib/database.types";

function formatPeriod() {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${now.getFullYear()}`;
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 4 }}>
      <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ fontFamily: highlight ? "DMSerifDisplay_400Regular" : "Courier", fontSize: highlight ? 22 : 12, color: highlight ? Colors.cpw : Colors.ink }}>
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
      <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 32, color: Colors.ink, textAlign: "center", letterSpacing: 1 }}>
        Wears
      </Text>
      <Text style={{ fontFamily: "Courier", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
        QUARTERLY · {username} · {formatPeriod()}
      </Text>
      <DashedLine marginVertical={4} />
      <View style={{ paddingVertical: 8 }}>
        <StatRow label="Cost Basis" value={`$${totalCostBasis.toFixed(2)}`} />
        <StatRow label="Wears Logged" value={String(totalWears)} />
        <StatRow label="Pieces" value={String(pieces)} />
      </View>
      <DashedLine marginVertical={4} />
      <View style={{ paddingVertical: 10 }}>
        <StatRow label="Blended CPW" value={blendedCpw > 0 ? `$${blendedCpw.toFixed(2)}` : "—"} highlight />
      </View>
      <DashedLine marginVertical={4} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 }}>
        <Text style={{ fontFamily: "Courier", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>ITEM</Text>
        <Text style={{ fontFamily: "Courier", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>CPW</Text>
      </View>
      <DashedLine />
    </View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 32 }}>
      {/* Receipt stub */}
      <View style={{ width: "100%", borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed", padding: 24, alignItems: "center", gap: 12 }}>
        <Text style={{ fontFamily: "Courier", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase" }}>
          PORTFOLIO SUMMARY
        </Text>
        <View style={{ width: "100%", height: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, borderStyle: "dashed" }} />

        {["—", "—", "—"].map((_, i) => (
          <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", opacity: 0.3 }}>
            <Text style={{ fontFamily: "Courier", fontSize: 11, color: Colors.ink }}>item #{i + 1}</Text>
            <Text style={{ fontFamily: "Courier", fontSize: 11, color: Colors.ink }}>$—.—/wear</Text>
          </View>
        ))}

        <View style={{ width: "100%", height: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, borderStyle: "dashed" }} />

        <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 38, color: Colors.cpw, opacity: 0.25 }}>
          $0.00
        </Text>
        <Text style={{ fontFamily: "Courier", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
          BLENDED CPW
        </Text>
      </View>

      <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, color: Colors.ink, textAlign: "center", marginTop: 28, marginBottom: 6 }}>
        Your closet awaits.
      </Text>
      <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.muted, textAlign: "center", letterSpacing: 0.8, lineHeight: 18, marginBottom: 28 }}>
        Add your first piece and start justifying{"\n"}every purchase you&apos;ve ever made.
      </Text>

      <TouchableOpacity
        onPress={onAdd}
        style={{ backgroundColor: Colors.ink, paddingVertical: 16, paddingHorizontal: 40, alignItems: "center", width: "100%" }}
        activeOpacity={0.85}
      >
        <Text style={{ fontFamily: "Courier", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
          + Add First Item
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ClosetLedger() {
  const router = useRouter();
  const { user } = useUserStore();
  const { items, isLoading, fetchItems } = useItemStore();
  const { isAtFreeLimit } = usePaywall();
  const { track, Events } = useAnalytics();
  const [showWearPicker, setShowWearPicker] = useState(false);

  useEffect(() => {
    if (user?.id) fetchItems(user.id);
  // fetchItems is stable from zustand; intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sorted = useMemo(() => [...items].sort((a, b) => a.cpw - b.cpw), [items]);

  const stats = useMemo(() => {
    const totalCostBasis = items.reduce((s, i) => s + i.price, 0);
    const totalWears = items.reduce((s, i) => s + i.wears.length, 0);
    const blendedCpw = totalWears > 0 ? totalCostBasis / totalWears : 0;
    return { totalCostBasis, totalWears, blendedCpw, pieces: items.length };
  }, [items]);

  const username = user?.email?.split("@")[0]?.toUpperCase() ?? "YOU";

  const openAddItem = () => {
    if (isAtFreeLimit(items.length)) {
      track(Events.PAYWALL_SHOWN, { trigger: "item_limit" });
      router.push("/modal/paywall");
      return;
    }
    track(Events.FEATURE_USED, { feature: "add_item" });
    router.push("/modal/add-item");
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
      {/* Add button */}
      <TouchableOpacity
        onPress={openAddItem}
        style={{ position: "absolute", top: 56, right: 20, zIndex: 10 }}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.ink, letterSpacing: 1.5 }}>+ ADD</Text>
      </TouchableOpacity>

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
        ListEmptyComponent={<EmptyState onAdd={openAddItem} />}
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

      {items.length > 0 && (
        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.cream, borderTopWidth: 1, borderTopColor: Colors.border }}>
          <TouchableOpacity
            onPress={() => setShowWearPicker(true)}
            style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center" }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "Courier", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
              + Log Today&apos;s Wear
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Item picker */}
      <Modal
        visible={showWearPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWearPicker(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)" }}
          activeOpacity={1}
          onPress={() => setShowWearPicker(false)}
        />
        <View style={{ backgroundColor: Colors.cream, maxHeight: "60%", borderTopWidth: 1, borderTopColor: Colors.border }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
            <Text style={{ fontFamily: "Courier", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase" }}>
              WHAT DID YOU WEAR TODAY?
            </Text>
            <TouchableOpacity onPress={() => setShowWearPicker(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <DashedLine />
          <ScrollView bounces={false}>
            {sorted.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setShowWearPicker(false);
                  track(Events.FEATURE_USED, { feature: "log_wear_from_home", item_id: item.id });
                  router.push(`/(app)/item/${item.id}`);
                }}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
                  <Text style={{ fontFamily: "DMSerifDisplay_400Regular", fontSize: 16, color: Colors.ink, flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.cpw, letterSpacing: 0.5 }}>
                    ${item.cpw.toFixed(2)}/wear
                  </Text>
                </View>
                <DashedLine />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
