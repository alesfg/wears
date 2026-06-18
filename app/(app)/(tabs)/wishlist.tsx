import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore } from "@/store/currencyStore";
import {
  useWatchlistStore,
  getProjectedCpw,
  VERDICT_COLORS,
  type WatchlistItem,
  type WatchlistStatus,
} from "@/store/watchlistStore";
import { t } from "@/lib/i18n";

const STATUS_ORDER: WatchlistStatus[] = ["BUY", "STRETCH", "WAIT", "SKIP"];

function formatPrice(n: number, symbol: string) {
  return symbol + n.toLocaleString("en-US");
}

function StatusBadge({ status }: { status: WatchlistStatus }) {
  const color = VERDICT_COLORS[status];
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color,
          letterSpacing: 1.5,
        }}
      >
        {status}
      </Text>
    </View>
  );
}

function StatusDot({ status, count }: { status: WatchlistStatus; count: number }) {
  if (count === 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: VERDICT_COLORS[status],
        }}
      />
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 9,
          color: Colors.ink,
          letterSpacing: 1.5,
        }}
      >
        {count} {status}
      </Text>
    </View>
  );
}

function WatchlistRow({ item, onPress }: { item: WatchlistItem; onPress: () => void }) {
  const symbol = useCurrencyStore((s) => s.symbol);
  const cpw = getProjectedCpw(item.price, item.projectedWears);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingVertical: 18,
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        {/* Thumbnail */}
        <View
          style={{
            width: 90,
            height: 90,
            backgroundColor: item.imageColor,
            flexShrink: 0,
          }}
        />

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 17,
                color: Colors.ink,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            <StatusBadge status={item.status} />
          </View>

          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 9,
              color: Colors.muted,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 1,
            }}
          >
            {item.brand} · {formatPrice(item.price, symbol)}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 4 }}>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 20,
                color: Colors.ink,
              }}
            >
              {formatPrice(parseFloat(cpw.toFixed(2)), symbol)}
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 8,
                color: Colors.muted,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {t("wishlistProjWears", { n: String(item.projectedWears) })}
            </Text>
          </View>

          {item.note ? (
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 11,
                color: Colors.muted,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {item.note}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: 0 }} />
    </TouchableOpacity>
  );
}

function ListHeader({
  totalRetail,
  statusCounts,
}: {
  totalRetail: number;
  statusCounts: Record<WatchlistStatus, number>;
}) {
  const symbol = useCurrencyStore((s) => s.symbol);
  const totalCount = Object.values(statusCounts).reduce((s, n) => s + n, 0);
  const retailStr = totalRetail.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
      {/* Piece count + label */}
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 9,
          color: Colors.muted,
          letterSpacing: 2.5,
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {t("wishlistPiecesOutflow", { count: String(totalCount) })}
      </Text>

      {/* Big retail total */}
      <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 16 }}>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 56,
            color: Colors.ink,
            lineHeight: 64,
          }}
        >
          {symbol}{retailStr}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 12,
            color: Colors.muted,
            marginLeft: 8,
          }}
        >
          {t("wishlistAtRetail")}
        </Text>
      </View>

      {/* Status dot row */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        {STATUS_ORDER.map((s) => (
          <StatusDot key={s} status={s} count={statusCounts[s]} />
        ))}
      </View>

      {/* Top divider before list */}
      <View style={{ height: 1, backgroundColor: Colors.border }} />
    </View>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 48, paddingHorizontal: 32 }}>
      <Image
        source={require("@/assets/tagsearch.png")}
        style={{ width: 96, height: 96, marginBottom: 20 }}
        resizeMode="contain"
      />
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
        {t("wishlistEmptyLabel")}
      </Text>
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular_Italic",
          fontSize: 22,
          color: Colors.ink,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {t("wishlistEmptyTitle")}
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 10,
          color: Colors.muted,
          textAlign: "center",
          lineHeight: 18,
          marginBottom: 24,
        }}
      >
        {t("wishlistEmptyBody")}
      </Text>
      <TouchableOpacity
        onPress={onAdd}
        style={{
          borderWidth: 1.5,
          borderColor: Colors.ink,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 28,
        }}
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 11,
            color: Colors.ink,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          {t("wishlistAddCta")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Watchlist() {
  const router = useRouter();
  const { user } = useUserStore();
  const { items, isLoading, fetchItems } = useWatchlistStore();

  useEffect(() => {
    if (user?.id) fetchItems(user.id);
    // fetchItems is stable from zustand; intentionally omitted
  }, [user?.id]);

  const { totalRetail, statusCounts } = useMemo(() => {
    const total = items.reduce((s, i) => s + i.price, 0);
    const counts: Record<WatchlistStatus, number> = { BUY: 0, STRETCH: 0, WAIT: 0, SKIP: 0 };
    items.forEach((i) => counts[i.status]++);
    return { totalRetail: total, statusCounts: counts };
  }, [items]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      {/* Nav header */}
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
          onPress={() => router.push("/(app)/(tabs)/" as never)}
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
          {t("wishlistHeaderTag")}
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/modal/add-watchlist-item" as never)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 18, color: Colors.ink, lineHeight: 20 }}>
            +
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 64 }} color={Colors.ink} />
      ) : (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <ListHeader totalRetail={totalRetail} statusCounts={statusCounts} />
        }
        ListEmptyComponent={<EmptyState onAdd={() => router.push("/modal/add-watchlist-item" as never)} />}
        renderItem={({ item }) => (
          <WatchlistRow
            item={item}
            onPress={() => {
              posthog.capture(Events.WATCHLIST_VIEWED, { item_id: item.id, verdict: item.status });
              router.push(`/(app)/watchlist/${item.id}` as never);
            }}
          />
        )}
      />
      )}
    </SafeAreaView>
  );
}
