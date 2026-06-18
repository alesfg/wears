import { View, Text } from "react-native";
import type { ItemWithWears } from "@/lib/database.types";
import { useCurrencyStore } from "@/store/currencyStore";
import { t } from "@/lib/i18n";

interface Props {
  name: string;
  year: string;
  pieces: number;
  totalWears: number;
  blendedCpw: number;
  mostProfitable: ItemWithWears | null;
  busiestMonth: [string, number] | null;
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

function cpwStr(val: number, symbol: string): string {
  if (val >= 100 && Number.isInteger(val)) return `${symbol}${val}`;
  return `${symbol}${val.toFixed(2)}`;
}

export function WrappedReceiptShare({ name, year, pieces, totalWears, blendedCpw, mostProfitable, busiestMonth }: Props) {
  const symbol = useCurrencyStore((s) => s.symbol);
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
            {t("shareAnnualReport")} &apos;{year}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 1.5, marginBottom: 14 }}>
            {t("shareShareholder")} · {name.toUpperCase()}
          </Text>

          <DotLine />

          {/* Summary rows */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, marginTop: 12 }}>
            <Text style={mono}>{t("sharePiecesRow")}</Text>
            <Text style={mono}>{pieces}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
            <Text style={mono}>{t("shareWearsLoggedRow")}</Text>
            <Text style={mono}>{totalWears}</Text>
          </View>
          {busiestMonth && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
              <Text style={mono}>{t("shareBusiestMonth")}</Text>
              <Text style={mono}>{busiestMonth[0].slice(0, 3).toUpperCase()} · {busiestMonth[1]}×</Text>
            </View>
          )}

          <DotLine />

          {/* MVP piece */}
          {mostProfitable && (
            <>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 2, marginTop: 12, marginBottom: 4 }}>
                {t("shareMvpOfYear")}
              </Text>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 20, color: "#1A1A1A", textAlign: "center", marginBottom: 2 }} numberOfLines={1}>
                {mostProfitable.name}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 1.5, marginBottom: 12 }}>
                {mostProfitable.wears.length}× {t("shareWornLabel")} · {cpwStr(mostProfitable.cpw, symbol)}{t("sharePerWearCaps")}
              </Text>

              <DotLine />
            </>
          )}

          {/* Net CPW */}
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: "#8A8070", textAlign: "center", letterSpacing: 2, marginTop: 12, marginBottom: 2 }}>
            {t("shareBlendedCpw")}
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 52, color: "#C4503A", textAlign: "center", lineHeight: 60 }}>
            {cpwStr(blendedCpw, symbol)}
          </Text>

          {blendedCpw > 0 && blendedCpw <= 25 && (
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
            WEARS.APP/WRAPPED
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
