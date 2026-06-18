import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getTier, isProfitable } from "@/constants/config";
import { useCurrencyStore } from "@/store/currencyStore";
import { t, locale } from "@/lib/i18n";
import type { ItemWithWears } from "@/lib/database.types";

interface Props {
  item: ItemWithWears;
  username: string;
}

const CANVAS_W = 360;
const CARD_W = 300;

function DashedSep() {
  return (
    <View style={{ overflow: "hidden", marginVertical: 14 }}>
      <View style={{ borderBottomWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.18)" }} />
    </View>
  );
}

// 9×9 decorative QR grid (finder-pattern corners + random interior)
const QR_PATTERN = [
  1,1,1,1,1,1,1, 0, 1,
  1,0,0,0,0,0,1, 0, 0,
  1,0,1,1,1,0,1, 0, 1,
  1,0,1,1,1,0,1, 1, 0,
  1,0,1,1,1,0,1, 0, 1,
  1,0,0,0,0,0,1, 0, 0,
  1,1,1,1,1,1,1, 1, 1,
  0, 1, 0, 0, 1, 0, 0, 1, 0,
  1, 0, 1, 1, 0, 1, 1, 0, 1,
];

function QRDecoration() {
  const CELL = 10;
  const COLS = 9;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width: CELL * COLS }}>
      {QR_PATTERN.map((filled, i) => (
        <View
          key={i}
          style={{
            width: CELL,
            height: CELL,
            backgroundColor: filled ? "rgba(20,10,5,0.8)" : "rgba(255,255,255,0.06)",
          }}
        />
      ))}
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.25)",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 6,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 7,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 11,
          color: "#FFFFFF",
          letterSpacing: 0.3,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export function WalletPassShare({ item, username }: Props) {
  const symbol = useCurrencyStore((s) => s.symbol);
  const acquired = new Date(item.purchased_at + "T12:00:00").toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
    month: "short",
    year: "2-digit",
  });
  const itemYear = `'${new Date(item.purchased_at + "T12:00:00").getFullYear().toString().slice(2)}`;
  const tier = getTier(item.cpw);
  const status = isProfitable(item.cpw) ? t("shareProfit") : t("shareInProgress");
  const categoryTag = item.category?.toUpperCase() ?? item.name.split(" ").pop()?.toUpperCase() ?? "ITEM";

  return (
    <View
      style={{
        width: CANVAS_W,
        backgroundColor: "#140C09",
        alignItems: "center",
        paddingTop: 36,
        paddingBottom: 32,
      }}
    >
      {/* Gradient card */}
      <LinearGradient
        colors={["#C48A6A", "#9A4228", "#5C1E08"]}
        start={{ x: 0.25, y: 0 }}
        end={{ x: 0.75, y: 1 }}
        style={{
          width: CARD_W,
          borderRadius: 20,
          paddingHorizontal: 22,
          paddingTop: 24,
          paddingBottom: 22,
          shadowColor: "#000",
          shadowOpacity: 0.55,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 12 },
          elevation: 16,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 7,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              WEARS · {t("shareMember")}
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 30,
                color: "#FFFFFF",
                marginTop: 2,
              }}
            >
              {username}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular_Italic",
              fontSize: 22,
              color: "rgba(255,255,255,0.3)",
              marginTop: 4,
            }}
          >
            W.
          </Text>
        </View>

        <DashedSep />

        {/* Asset */}
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 7,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {t("shareAsset")}
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 22,
            color: "#FFFFFF",
            marginTop: 3,
          }}
        >
          {item.name}, {itemYear}
        </Text>

        <DashedSep />

        {/* CPW hero */}
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 7,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 2,
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          {t("costPerWear")}
        </Text>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 64,
            color: "#FFFFFF",
            textAlign: "center",
            lineHeight: 72,
          }}
        >
          {symbol}{item.cpw.toFixed(2)}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 8,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: 1.5,
            textAlign: "center",
            marginTop: 6,
          }}
        >
          {item.wears.length} {t("wears")} · {symbol}{Math.round(item.price)} {t("shareBasis")}
        </Text>

        <DashedSep />

        {/* 3 stat chips */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <StatChip label={t("shareSince")} value={acquired.toUpperCase()} />
          <StatChip label={t("shareStatus")} value={status} />
          <StatChip label={t("shareTier")} value={tier.toUpperCase()} />
        </View>

        {/* QR decoration */}
        <View style={{ alignItems: "center", marginTop: 18 }}>
          <QRDecoration />
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 7,
              color: "rgba(255,255,255,0.28)",
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            WEARS · {categoryTag} · M
          </Text>
        </View>
      </LinearGradient>

      {/* Tagline */}
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular_Italic",
          fontSize: 20,
          color: "rgba(255,255,255,0.82)",
          textAlign: "center",
          marginTop: 20,
        }}
      >
        {t("shareWalletTagline")}
      </Text>

      {/* Footer */}
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "rgba(255,255,255,0.18)",
          letterSpacing: 2,
          textAlign: "center",
          marginTop: 10,
        }}
      >
        {t("shareDownloadedFooter", { username: username.toLowerCase() })}
      </Text>
    </View>
  );
}
