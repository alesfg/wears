import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useItemStore } from "@/store/itemStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { ItemSwatch } from "@/components/features/ItemSwatch";
import { MONTH_SHORT, todayDs, buildWearsByDate, formatDayLabel, earnedForDay } from "@/lib/wearCalendar";
import { t, occasionLabel } from "@/lib/i18n";
import type { ItemWithWears } from "@/lib/database.types";

// ─── Constants ────────────────────────────────────────────────────────────────

type CalTab = "month" | "heatmap" | "list";

const DAY_HDRS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Heatmap intensity scale (0 wears = transparent/empty, 1–4+ wears)
const HMAP_COLORS = ["#F0D8D0", "#D4957A", "#B85A3A", "#8B3520"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDs(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function quarterLabel(m: number): string {
  return `Q${Math.floor(m / 3) + 1}`;
}

function monthStatus(y: number, m: number): string {
  const n = new Date();
  if (y === n.getFullYear() && m === n.getMonth()) return t("calInProgress");
  if (y < n.getFullYear() || (y === n.getFullYear() && m < n.getMonth())) return t("calComplete");
  return t("calUpcoming");
}

// ─── Calendar cell ────────────────────────────────────────────────────────────

// DATE_AREA: vertical space (px) reserved at top of cell for the date number.
// Swatches fill the remaining bottom portion. Rendering order: swatches first
// so the date number (rendered after) sits on top visually.
const DATE_AREA = 22;

function CalCell({
  day,
  ds,
  dayItems,
  isToday,
  isPast,
  cellW,
  onPress,
}: {
  day: number | null;
  ds: string | null;
  dayItems: ItemWithWears[];
  isToday: boolean;
  isPast: boolean;
  cellW: number;
  onPress: () => void;
}) {
  const cellH = cellW + 12;
  const swatchH = cellH - DATE_AREA;

  if (!day) return <View style={{ width: cellW, height: cellH }} />;

  const hasWears = dayItems.length > 0;
  const swatches = dayItems.slice(0, 4);

  // Cell background and border
  let bg = "transparent";
  let borderProps: object = {};

  if (isToday) {
    bg = Colors.white;
    borderProps = { borderWidth: 1.5, borderColor: Colors.cpw };
  } else if (hasWears) {
    bg = Colors.white;
    borderProps = { borderWidth: 1, borderColor: Colors.border };
  } else if (isPast) {
    borderProps = { borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed" as const };
  }

  const numColor = isToday ? Colors.cpw : isPast && !hasWears ? Colors.muted : Colors.ink;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        style={{
          width: cellW,
          height: cellH,
          backgroundColor: bg,
          overflow: "hidden",
          position: "relative",
          ...borderProps,
        }}
      >
        {/* ① Swatches — rendered FIRST so date number sits on top in z-order */}
        {hasWears && (
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: swatchH,
              flexDirection: "row",
            }}
          >
            {swatches.map((item) => (
              <ItemSwatch key={item.id} item={item} style={{ flex: 1, height: "100%" }} />
            ))}
          </View>
        )}

        {/* ② Date number — rendered AFTER swatches, appears on top */}
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: numColor,
            paddingLeft: 4,
            paddingTop: 4,
            lineHeight: 12,
          }}
        >
          {String(day).padStart(2, "0")}
        </Text>

        {/* ③ NOW badge */}
        {isToday && (
          <View
            style={{
              position: "absolute",
              top: -1,
              right: -1,
              backgroundColor: Colors.cpw,
              paddingHorizontal: 4,
              paddingVertical: 1,
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 7,
                color: Colors.white,
                letterSpacing: 0.5,
              }}
            >
              NOW
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Outfit card ──────────────────────────────────────────────────────────────

function OutfitCard({ ds, items, onPress }: { ds: string; items: ItemWithWears[]; onPress: () => void }) {
  const symbol = useCurrencyStore((s) => s.symbol);
  if (!items.length) return null;

  const dateLabel = formatDayLabel(ds);
  const earned = earnedForDay(items);

  const occasion = items
    .flatMap((i) => i.wears.filter((w) => w.worn_at === ds && w.occasion).map((w) => w.occasion!))
    [0] ?? null;

  const names = items.map((i) => i.name.split(" ")[0]).join(" · ");

  return (
    <View>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 9,
          color: Colors.muted,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {dateLabel}
      </Text>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View
          style={{
            backgroundColor: Colors.white,
            flexDirection: "row",
            alignItems: "center",
            padding: 14,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: "row", gap: 4 }}>
            {items.slice(0, 3).map((item) => (
              <ItemSwatch key={item.id} item={item} style={{ width: 44, height: 52 }} />
            ))}
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 20,
                color: Colors.ink,
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {names}
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: Colors.muted,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {items.length} {t("calPieces")}{occasion ? ` · ${occasionLabel(occasion)}` : ""} · +{symbol}{earned.toFixed(2)} {t("calEarned")}
            </Text>
          </View>

          <Feather name="arrow-up-right" size={15} color={Colors.cpw} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({ wbd }: { wbd: Record<string, ItemWithWears[]> }) {
  const router = useRouter();
  const { width: sw } = useWindowDimensions();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDs, setSelectedDs] = useState<string | null>(null);

  const td = todayDs();
  const GAP = 2;
  const CELL_W = Math.floor((sw - 40 - GAP * 6) / 7);

  const calDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const total = daysInMonth(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const stats = useMemo(() => {
    const total = daysInMonth(year, month);
    let logged = 0, skipped = 0;
    for (let d = 1; d <= total; d++) {
      const ds = toDs(year, month, d);
      if (ds > td) break;
      (wbd[ds]?.length ?? 0) > 0 ? logged++ : skipped++;
    }
    let streak = 0;
    const cur = new Date(now);
    for (let i = 0; i < 365; i++) {
      const ds = cur.toISOString().split("T")[0];
      if ((wbd[ds]?.length ?? 0) > 0) { streak++; cur.setDate(cur.getDate() - 1); }
      else break;
    }
    return { logged, skipped, streak, total };
  }, [wbd, year, month, td]);

  // Which day's outfit to show at the bottom
  const displayDs = useMemo(() => {
    if (selectedDs && (wbd[selectedDs]?.length ?? 0) > 0) return selectedDs;
    const d = new Date(now);
    for (let i = 0; i < 61; i++) {
      const ds = d.toISOString().split("T")[0];
      if ((wbd[ds]?.length ?? 0) > 0) return ds;
      d.setDate(d.getDate() - 1);
    }
    return null;
  }, [selectedDs, wbd]);

  const prevMonth = () => {
    setSelectedDs(null);
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    setSelectedDs(null);
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Month header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, flexShrink: 1, marginRight: 8 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 52,
                color: Colors.ink,
                lineHeight: 64,
                paddingTop: 6,
                paddingLeft: 4,
              }}
            >
              {MONTH_NAMES[month]}
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: Colors.muted,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              {year} · {quarterLabel(month)} · {monthStatus(year, month)}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              onPress={prevMonth}
              style={{
                width: 36, height: 36,
                borderWidth: 1, borderColor: Colors.border,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 16, color: Colors.ink }}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={nextMonth}
              style={{
                width: 36, height: 36,
                borderWidth: 1, borderColor: Colors.border,
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 16, color: Colors.ink }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          paddingVertical: 16,
          marginTop: 10,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: Colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={sLabel}>{t("calLogged")}</Text>
          <Text style={[sValue, { color: Colors.ink }]}>{stats.logged}/{stats.total}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: Colors.border }} />
        <View style={{ flex: 1, paddingLeft: 14 }}>
          <Text style={sLabel}>{t("calSkipped")}</Text>
          <Text style={[sValue, { color: Colors.cpw }]}>{stats.skipped}</Text>
        </View>
        <View style={{ width: 1, backgroundColor: Colors.border }} />
        <View style={{ flex: 1, paddingLeft: 14 }}>
          <Text style={sLabel}>{t("calStreak")}</Text>
          <Text style={[sValue, { color: Colors.ink }]}>{stats.streak} {t("calDays")}</Text>
        </View>
      </View>

      {/* Day-of-week headers */}
      <View style={{ flexDirection: "row", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
        {DAY_HDRS.map((h) => (
          <View key={h} style={{ width: CELL_W + GAP, alignItems: "center" }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.muted, letterSpacing: 1 }}>
              {h}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ paddingHorizontal: 20 }}>
        {Array.from({ length: calDays.length / 7 }).map((_, row) => (
          <View key={row} style={{ flexDirection: "row", gap: GAP, marginBottom: GAP }}>
            {calDays.slice(row * 7, row * 7 + 7).map((day, col) => {
              const ds = day ? toDs(year, month, day) : null;
              return (
                <CalCell
                  key={col}
                  day={day}
                  ds={ds}
                  dayItems={ds ? (wbd[ds] ?? []) : []}
                  isToday={ds === td}
                  isPast={ds != null && ds < td}
                  cellW={CELL_W}
                  onPress={() => {
                    if (!ds) return;
                    setSelectedDs(ds === selectedDs ? null : ds);
                    if ((wbd[ds]?.length ?? 0) > 0) router.push(`/(app)/day/${ds}` as never);
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 20, marginTop: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 14, height: 14, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white }} />
          <Text style={legendTxt}>{t("calLogged")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 5 }}>
          <View style={{ width: 14, height: 14, marginTop: 1, borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed" }} />
          <Text style={[legendTxt, { lineHeight: 13 }]}>{t("calNotLogged")}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <View style={{ width: 14, height: 14, borderWidth: 1.5, borderColor: Colors.cpw }} />
          <Text style={legendTxt}>{t("calToday")}</Text>
        </View>
      </View>

      {/* Outfit card for selected or most-recent logged day */}
      {displayDs && (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <OutfitCard ds={displayDs} items={wbd[displayDs] ?? []} onPress={() => router.push(`/(app)/day/${displayDs}` as never)} />
        </View>
      )}
    </ScrollView>
  );
}

// ─── Heatmap view ─────────────────────────────────────────────────────────────

function HeatmapView({ wbd }: { wbd: Record<string, ItemWithWears[]> }) {
  const { width: sw } = useWindowDimensions();
  const HPAD = 20;
  const WEEKS = 52;
  const GAP = 2;
  const CELL = Math.max(4, Math.floor((sw - HPAD * 2 - GAP * (WEEKS - 1)) / WEEKS));

  const today = new Date();

  const { weeks, monthLabels, totalDays, longestStreak, quietMonth, peakWeek } = useMemo((): {
    weeks: { date: Date; count: number; inRange: boolean }[][];
    monthLabels: { monthIdx: number; weekIdx: number }[];
    totalDays: number;
    longestStreak: { days: number; start: Date; end: Date } | null;
    quietMonth: { name: string; count: number } | null;
    peakWeek: { label: string; count: number } | null;
  } => {
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - (WEEKS * 7 - 1));
    const rangeStartDs = rangeStart.toISOString().split("T")[0];
    const todayDsVal = today.toISOString().split("T")[0];

    // Align grid start to the Sunday of the first week
    const gridStart = new Date(rangeStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const weeks: { date: Date; count: number; inRange: boolean }[][] = [];
    const monthLabels: { monthIdx: number; weekIdx: number }[] = [];
    let lastMonth = -1;
    const cur = new Date(gridStart);

    for (let w = 0; w < WEEKS; w++) {
      const week: { date: Date; count: number; inRange: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const ds = cur.toISOString().split("T")[0];
        const inRange = ds >= rangeStartDs && ds <= todayDsVal;
        if (d === 0 && cur.getMonth() !== lastMonth) {
          monthLabels.push({ monthIdx: cur.getMonth(), weekIdx: w });
          lastMonth = cur.getMonth();
        }
        week.push({ date: new Date(cur), count: inRange ? (wbd[ds]?.length ?? 0) : 0, inRange });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    // All in-range dates for stats
    const allDs: string[] = [];
    const c2 = new Date(rangeStart);
    while (c2 <= today) {
      allDs.push(c2.toISOString().split("T")[0]);
      c2.setDate(c2.getDate() + 1);
    }

    const totalDays = allDs.filter((ds) => (wbd[ds]?.length ?? 0) > 0).length;

    // Longest consecutive streak
    let maxStr = 0, curStr = 0, tempStart = allDs[0] ?? "";
    let strStart = allDs[0] ?? "", strEnd = allDs[0] ?? "";
    allDs.forEach((ds) => {
      if ((wbd[ds]?.length ?? 0) > 0) {
        if (curStr === 0) tempStart = ds;
        curStr++;
        if (curStr > maxStr) { maxStr = curStr; strStart = tempStart; strEnd = ds; }
      } else { curStr = 0; }
    });
    const longestStreak: { days: number; start: Date; end: Date } | null = maxStr > 0
      ? { days: maxStr, start: new Date(strStart + "T00:00:00"), end: new Date(strEnd + "T00:00:00") }
      : null;

    // Quietest month (fewest logs, excluding current month)
    const mCounts: Record<string, { count: number; name: string }> = {};
    allDs.forEach((ds) => {
      const d = new Date(ds + "T00:00:00");
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!mCounts[key]) mCounts[key] = { count: 0, name: MONTH_NAMES[d.getMonth()] };
      if ((wbd[ds]?.length ?? 0) > 0) mCounts[key].count++;
    });
    const nowKey = `${today.getFullYear()}-${today.getMonth()}`;
    let quietMonth: { name: string; count: number } | null = null;
    Object.entries(mCounts).forEach(([key, val]) => {
      if (key === nowKey) return;
      if (!quietMonth || val.count < quietMonth.count) quietMonth = { name: val.name, count: val.count };
    });

    // Peak week (most items worn in a single week)
    let peakWeek: { label: string; count: number } | null = null;
    weeks.forEach((week) => {
      const total = week.reduce((s, d) => s + (d.inRange ? d.count : 0), 0);
      const first = week.find((d) => d.inRange);
      if (first) {
        const d = first.date;
        const soy = new Date(d.getFullYear(), 0, 1);
        const wkNum = Math.ceil(((d.getTime() - soy.getTime()) / 86400000 + soy.getDay() + 1) / 7);
        const label = `${MONTH_SHORT[d.getMonth()]} wk ${wkNum}`;
        if (!peakWeek || total > peakWeek.count) peakWeek = { label, count: total };
      }
    });

    // Deduplicate month labels — same month can appear at the start (last year) and
    // end (this year) of the 52-week range. Keep only the rightmost (most recent) occurrence.
    const seenMonths = new Set<number>();
    const dedupedMonthLabels = [...monthLabels]
      .reverse()
      .filter(({ monthIdx }) => {
        if (seenMonths.has(monthIdx)) return false;
        seenMonths.add(monthIdx);
        return true;
      })
      .reverse();

    return { weeks, monthLabels: dedupedMonthLabels, totalDays, longestStreak, quietMonth, peakWeek };
  }, [wbd]);

  function cellBg(count: number, inRange: boolean): string {
    if (!inRange || count === 0) return "transparent";
    return HMAP_COLORS[Math.min(count - 1, HMAP_COLORS.length - 1)];
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const highlights = [
    {
      label: t("calLongestStreak"),
      value: longestStreak
        ? `${longestStreak.days} ${t("calDays")} · ${fmtDate(longestStreak.start)} → ${fmtDate(longestStreak.end)}`
        : "—",
    },
    {
      label: t("calDressedDownMonth"),
      value: quietMonth ? `${quietMonth.name} · ${quietMonth.count} ${t("calLogs")}` : "—",
    },
    {
      label: t("calPeakWeek"),
      value: peakWeek ? `${peakWeek.label} · ${peakWeek.count} ${t("calPieces").toLowerCase()}` : "—",
    },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: HPAD, paddingTop: 12 }}>

        {/* Big "283 days dressed" */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", marginBottom: 4 }}>
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular_Italic",
              fontSize: 80,
              color: Colors.ink,
              lineHeight: 92,
              paddingTop: 8,
            }}
          >
            {totalDays}
          </Text>
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 15,
              color: Colors.muted,
              marginLeft: 10,
              marginBottom: 10,
            }}
          >
            {t("calDaysDressed")}
          </Text>
        </View>

        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          {t("calTrailingWeeks", { n: String(WEEKS) })}
        </Text>

        {/* Month labels row */}
        <View style={{ height: 14, position: "relative", marginBottom: 3 }}>
          {monthLabels.map(({ monthIdx, weekIdx }) => (
            <Text
              key={weekIdx}
              style={{
                position: "absolute",
                left: weekIdx * (CELL + GAP),
                fontFamily: "DMSans_400Regular",
                fontSize: 7,
                color: Colors.muted,
                letterSpacing: 0.3,
              }}
            >
              {MONTH_SHORT[monthIdx]}
            </Text>
          ))}
        </View>

        {/* Heatmap grid: 52 columns (weeks) × 7 rows (days) */}
        <View style={{ flexDirection: "row", gap: GAP }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ gap: GAP }}>
              {week.map((cell, di) => (
                <View
                  key={di}
                  style={{
                    width: CELL,
                    height: CELL,
                    backgroundColor: cellBg(cell.count, cell.inRange),
                    borderWidth: cell.inRange && cell.count === 0 ? 0.5 : 0,
                    borderColor: Colors.border,
                  }}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Legend: LESS □□□□□ MORE */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 3,
            marginTop: 8,
          }}
        >
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.muted, marginRight: 3 }}>
            {t("calLess")}
          </Text>
          <View style={{ width: CELL + 2, height: CELL + 2, borderWidth: 0.5, borderColor: Colors.border }} />
          {HMAP_COLORS.map((c) => (
            <View key={c} style={{ width: CELL + 2, height: CELL + 2, backgroundColor: c }} />
          ))}
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.muted, marginLeft: 3 }}>
            {t("calMore")}
          </Text>
        </View>

        {/* Highlights */}
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginTop: 28,
            marginBottom: 4,
          }}
        >
          {t("calHighlights")}
        </Text>

        {highlights.map(({ label, value }, i) => (
          <View key={label}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 14,
              }}
            >
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 9,
                  color: Colors.muted,
                  letterSpacing: 1.5,
                }}
              >
                {label}
              </Text>
              {/* Values use italic serif — same as all data displays in the app */}
              <Text
                style={{
                  fontFamily: "InstrumentSerif_400Regular_Italic",
                  fontSize: 14,
                  color: Colors.ink,
                }}
              >
                {value}
              </Text>
            </View>
            {i < highlights.length - 1 && (
              <View style={{ borderTopWidth: 1, borderTopColor: Colors.border, borderStyle: "dashed" }} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ wbd }: { wbd: Record<string, ItemWithWears[]> }) {
  const router = useRouter();
  const sortedDates = useMemo(
    () =>
      Object.keys(wbd)
        .filter((ds) => wbd[ds].length > 0)
        .sort((a, b) => b.localeCompare(a)),
    [wbd]
  );

  if (!sortedDates.length) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: Colors.muted }}>
          {t("calNoWears")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 20 }}>
        {sortedDates.map((ds, i) => {
          const d = new Date(ds + "T00:00:00");
          const items = wbd[ds];
          return (
            <View key={ds}>
              <TouchableOpacity
                onPress={() => router.push(`/(app)/day/${ds}` as never)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingVertical: 13,
                }}
              >
                <View>
                  <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                    {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
                  </Text>
                  <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 15, color: Colors.ink, marginTop: 2 }} numberOfLines={1}>
                    {items.map((it) => it.name.split(" ")[0]).join(" · ")}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 3 }}>
                  {items.slice(0, 4).map((item) => (
                    <ItemSwatch key={item.id} item={item} style={{ width: 18, height: 22 }} />
                  ))}
                </View>
              </TouchableOpacity>
              {i < sortedDates.length - 1 && <View style={{ height: 1, backgroundColor: Colors.border }} />}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const sLabel = {
  fontFamily: "DMSans_400Regular" as const,
  fontSize: 8,
  color: Colors.muted,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  marginBottom: 2,
};

const sValue = {
  fontFamily: "InstrumentSerif_400Regular_Italic" as const,
  fontSize: 28,
  lineHeight: 32,
};

const legendTxt = {
  fontFamily: "DMSans_400Regular" as const,
  fontSize: 9,
  color: Colors.muted,
  letterSpacing: 1,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Calendar() {
  const [activeTab, setActiveTab] = useState<CalTab>("month");
  const router = useRouter();
  const { items } = useItemStore();

  const wbd = useMemo(() => buildWearsByDate(items), [items]);

  const HEADER: Record<CalTab, string> = {
    month:   t("calOutfitHistory"),
    heatmap: t("calAnnualHeatmap"),
    list:    t("calWearLog"),
  };

  const TAB_LABELS: Record<CalTab, string> = {
    month:   t("calTabMonth"),
    heatmap: t("calTabHeatmap"),
    list:    t("calTabList"),
  };

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
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.muted }}>{"<"}</Text>
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
          {HEADER[activeTab]}
        </Text>

        {activeTab === "month" ? (
          <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Feather name="search" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === "month"   && <MonthView   wbd={wbd} />}
        {activeTab === "heatmap" && <HeatmapView wbd={wbd} />}
        {activeTab === "list"    && <ListView    wbd={wbd} />}
      </View>

      {/* MONTH / HEATMAP / LIST pill switcher */}
      <View
        style={{
          marginHorizontal: 20,
          marginBottom: 10,
          backgroundColor: Colors.border,
          borderRadius: 100,
          flexDirection: "row",
          padding: 3,
        }}
      >
        {(["month", "heatmap", "list"] as CalTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 9,
              borderRadius: 100,
              backgroundColor: activeTab === tab ? Colors.ink : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 10,
                color: activeTab === tab ? Colors.white : Colors.muted,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}
