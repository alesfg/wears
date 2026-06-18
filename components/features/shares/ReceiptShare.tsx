import { View, Text } from "react-native";
import { useMemo } from "react";
import type { ItemWithWears } from "@/lib/database.types";
import { useCurrencyStore } from "@/store/currencyStore";
import { t, locale } from "@/lib/i18n";

interface Props {
  item: ItemWithWears;
  username: string;
}

const CANVAS_W = 360;
const CARD_W = 300;
const CREAM = "#F5F2EB";

// ─── Perforated edge ─────────────────────────────────────────────────────────
function PerforatedEdge({ flip }: { flip?: boolean }) {
  const count = 23;
  const size = 7;
  return (
    <View style={{ flexDirection: "row", width: CARD_W, height: size, overflow: "hidden" }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: CARD_W / count,
            height: size * 2,
            backgroundColor: "#111111",
            borderBottomLeftRadius: flip ? 0 : size,
            borderBottomRightRadius: flip ? 0 : size,
            borderTopLeftRadius: flip ? size : 0,
            borderTopRightRadius: flip ? size : 0,
            marginTop: flip ? 0 : -size,
          }}
        />
      ))}
    </View>
  );
}

// ─── Dashed separator ────────────────────────────────────────────────────────
function DotLine() {
  return (
    <View style={{ overflow: "hidden", marginVertical: 0 }}>
      <View style={{ borderBottomWidth: 1, borderStyle: "dashed", borderColor: "#C8C0B4" }} />
    </View>
  );
}

// ─── Barcode ─────────────────────────────────────────────────────────────────
function Barcode() {
  const seq = [2,1,3,1,2,1,1,3,2,1,1,2,3,1,2,1,3,1,1,2,1,3,2,1,2,1,1,3,1,2,3,1,1,2,1,3,1,2,1,1,3,2,1,2,1,3,1,1];
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "flex-end", height: 40, gap: 1 }}>
      {seq.map((w, i) => (
        <View
          key={i}
          style={{ width: w, height: i % 7 === 0 ? 40 : i % 3 === 0 ? 30 : 22, backgroundColor: "#1A1A1A" }}
        />
      ))}
    </View>
  );
}

export function ReceiptShare({ item, username }: Props) {
  const symbol = useCurrencyStore((s) => s.symbol);
  // Chronological order (oldest first) for receipt rows
  const wearsChron = useMemo(
    () => [...item.wears].sort((a, b) => new Date(a.worn_at).getTime() - new Date(b.worn_at).getTime()),
    [item.wears]
  );

  const acquired = new Date(item.purchased_at + "T12:00:00").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <View style={{ width: CANVAS_W, backgroundColor: "#111111", alignItems: "center", paddingVertical: 48 }}>
      {/* Receipt card */}
      <View
        style={{
          width: CARD_W,
          backgroundColor: CREAM,
          transform: [{ rotate: "-1.5deg" }],
          shadowColor: "#000",
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 6 },
          elevation: 10,
        }}
      >
        {/* Top perforated edge */}
        <PerforatedEdge />

        {/* Content */}
        <View style={{ paddingHorizontal: 22, paddingVertical: 20 }}>
          {/* Wordmark */}
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 30, color: "#1A1A1A", textAlign: "center", marginBottom: 4 }}>
            Wears
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 2 }}>
            {t("shareQuarterlyReport")}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 1.5, marginBottom: 14 }}>
            {t("shareOperator")} · {username.toUpperCase()}
          </Text>

          <DotLine />

          {/* Item */}
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 22, color: "#1A1A1A", textAlign: "center", marginTop: 12, marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 1.5, marginBottom: 12 }}>
            {item.brand ? `${item.brand.toUpperCase()} · ` : ""}{t("shareAcquired")} {acquired.toUpperCase()}
          </Text>

          <DotLine />

          {/* Summary rows */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
            <Text style={mono}>{t("shareBasis")}</Text>
            <Text style={mono}>{symbol}{item.price.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 2 }}>
            <Text style={mono}>{t("shareUnits")}</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={mono}>{item.wears.length}</Text>
              <Text style={{ ...mono, fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 9, color: "#C8C0B4" }}>
                {t("shareWearsLower")}
              </Text>
            </View>
          </View>

          <DotLine />

          {/* Column headers */}
          <View style={{ flexDirection: "row", paddingVertical: 6 }}>
            <Text style={[mono, { width: 36 }]}>{t("shareDateCol")}</Text>
            <Text style={[mono, { flex: 1 }]}>{t("shareOccasionCol")}</Text>
            <Text style={[mono, { width: 56, textAlign: "right" }]}>{t("shareCpwCol")}</Text>
          </View>

          {/* Wear rows — chronological, oldest first, up to 12 */}
          {wearsChron.slice(0, 12).map((wear, i) => (
            <View key={wear.id} style={{ flexDirection: "row", paddingVertical: 2.5 }}>
              <Text style={[monoInk, { width: 36 }]}>
                {wear.worn_at.slice(5).replace("-", "/")}
              </Text>
              <Text style={[monoInk, { flex: 1 }]} numberOfLines={1}>
                {wear.occasion ?? "—"}
              </Text>
              <Text style={[monoInk, { width: 56, textAlign: "right", color: "#C4503A" }]}>
                {symbol}{(item.price / (i + 1)).toFixed(2)}
              </Text>
            </View>
          ))}

          <DotLine />

          {/* Net CPW */}
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 2, marginTop: 12, marginBottom: 2 }}>
            {t("shareNetCpw")}
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 52, color: "#C4503A", textAlign: "center", lineHeight: 60 }}>
            {symbol}{item.cpw.toFixed(2)}
          </Text>

          {item.cpw <= 25 && (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#1A1A1A", textAlign: "center", letterSpacing: 2, marginBottom: 12 }}>
              {t("shareProfitableStatus")}
            </Text>
          )}

          <DotLine />

          {/* Barcode */}
          <View style={{ marginVertical: 14, alignItems: "center" }}>
            <Barcode />
          </View>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 7, color: "#8A8070", textAlign: "center", letterSpacing: 2.5 }}>
            WEARS.APP/M
          </Text>
        </View>

        {/* Bottom perforated edge */}
        <PerforatedEdge flip />
      </View>

      {/* Canvas footer */}
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textAlign: "center", marginTop: 20 }}>
        {t("shareCostBasisJustified")}
      </Text>
    </View>
  );
}

const mono = {
  fontFamily: "DMSans_400Regular",
  fontSize: 8,
  color: "#8A8070",
  letterSpacing: 0.5,
};

const monoInk = {
  fontFamily: "DMSans_400Regular",
  fontSize: 8,
  color: "#1A1A1A",
  letterSpacing: 0.5,
};
