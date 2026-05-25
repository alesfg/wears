import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { DashedLine } from "@/components/ui/DashedLine";
import { TierBadge } from "@/components/ui/TierBadge";
import { Colors } from "@/constants/theme";
import { TIERS, getTier, isProfitable } from "@/constants/config";

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 5 }}>
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{
        fontFamily: highlight ? "InstrumentSerif_400Regular" : "DMSans_400Regular",
        fontSize: highlight ? 22 : 12,
        color: highlight ? Colors.cpw : Colors.ink,
      }}>
        {value}
      </Text>
    </View>
  );
}

export default function Stats() {
  const { items } = useItemStore();
  const { user } = useUserStore();

  const stats = useMemo(() => {
    if (items.length === 0) return null;

    const totalCostBasis = items.reduce((s, i) => s + i.price, 0);
    const totalWears = items.reduce((s, i) => s + i.wears.length, 0);
    const blendedCpw = totalWears > 0 ? totalCostBasis / totalWears : 0;
    const profitable = items.filter((i) => isProfitable(i.cpw)).length;

    // Tier distribution
    const tierCounts: Record<string, number> = {};
    for (const tier of TIERS) tierCounts[tier.name] = 0;
    for (const item of items) tierCounts[getTier(item.cpw)]++;

    // Top performers (most wears, then lowest CPW)
    const topPerformers = [...items]
      .filter((i) => i.wears.length > 0)
      .sort((a, b) => b.wears.length - a.wears.length || a.cpw - b.cpw)
      .slice(0, 5);

    // Worst performers (highest CPW, at least 1 wear or 0 wears)
    const needsWork = [...items]
      .sort((a, b) => b.cpw - a.cpw)
      .slice(0, 3);

    return { totalCostBasis, totalWears, blendedCpw, profitable, tierCounts, topPerformers, needsWork };
  }, [items]);

  const username = user?.email?.split("@")[0]?.toUpperCase() ?? "YOU";

  const now = new Date();
  const period = `${now.toLocaleString("en-US", { month: "short" }).toUpperCase()} ${now.getFullYear()}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 32, color: Colors.ink, textAlign: "center", letterSpacing: 1 }}>
            Analytics
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
            PORTFOLIO REPORT · {username} · {period}
          </Text>
          <DashedLine marginVertical={0} />
        </View>

        {!stats || items.length === 0 ? (
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
              NO DATA YET
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 0.5, marginTop: 8 }}>
              Add items to see your portfolio stats.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Portfolio summary ── */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                SUMMARY
              </Text>
              <StatRow label="Total Cost Basis" value={`$${stats.totalCostBasis.toFixed(2)}`} />
              <StatRow label="Wears Logged" value={String(stats.totalWears)} />
              <StatRow label="Pieces" value={String(items.length)} />
              <StatRow label="Profitable Items" value={`${stats.profitable} / ${items.length}`} />
              <View style={{ marginTop: 8 }}>
                <StatRow label="Blended CPW" value={`$${stats.blendedCpw.toFixed(2)}`} highlight />
              </View>
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <DashedLine marginVertical={0} />
            </View>

            {/* ── Tier distribution ── */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                TIER BREAKDOWN
              </Text>
              {TIERS.map((tier) => {
                const count = stats.tierCounts[tier.name] ?? 0;
                const pct = items.length > 0 ? count / items.length : 0;
                return (
                  <View key={tier.name} style={{ marginBottom: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: count > 0 ? Colors.ink : Colors.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
                        {tier.name}
                      </Text>
                      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted }}>
                        {count} item{count !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={{ height: 3, backgroundColor: Colors.border }}>
                      <View style={{ height: 3, backgroundColor: count > 0 ? Colors.cpw : Colors.border, width: `${pct * 100}%` }} />
                    </View>
                  </View>
                );
              })}
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <DashedLine marginVertical={0} />
            </View>

            {/* ── Top performers ── */}
            {stats.topPerformers.length > 0 && (
              <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                  HALL OF FAME
                </Text>
                {stats.topPerformers.map((item, idx) => (
                  <View key={item.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                    <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 14, color: Colors.muted, width: 24 }}>
                      {idx + 1}.
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 16, color: Colors.ink }} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 0.5, marginTop: 1 }}>
                        {item.wears.length} WEAR{item.wears.length !== 1 ? "S" : ""} · COST BASIS ${item.price}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 15, color: Colors.cpw }}>
                        ${item.cpw.toFixed(2)}
                      </Text>
                      <TierBadge cpw={item.cpw} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={{ paddingHorizontal: 20 }}>
              <DashedLine marginVertical={0} />
            </View>

            {/* ── Needs work ── */}
            <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
                NEEDS WORK
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 0.5, marginBottom: 12 }}>
                wear these more to lower the CPW
              </Text>
              {stats.needsWork.map((item) => (
                <View key={item.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 16, color: Colors.ink }} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 0.5, marginTop: 1 }}>
                      {item.wears.length} WEAR{item.wears.length !== 1 ? "S" : ""} · COST BASIS ${item.price}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 15, color: Colors.cpw }}>
                    ${item.cpw.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <DashedLine marginVertical={0} />
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, textAlign: "center", letterSpacing: 2, paddingVertical: 12 }}>
                * KEEP WEARING *
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
