import { View, Text } from "react-native";
import { useMemo } from "react";
import type { ItemWithWears } from "@/lib/database.types";
import type { Wear } from "@/lib/database.types";

interface Props {
  item: ItemWithWears;
  username: string;
}


export function ReceiptShare({ item, username }: Props) {
  const wearsAsc = useMemo(() => {
    return [...item.wears].sort(
      (a, b) => new Date(a.worn_at).getTime() - new Date(b.worn_at).getTime()
    );
  }, [item.wears]);

  const cpwAtIndex = (i: number) => (item.price / (i + 1)).toFixed(2);

  const acquired = new Date(item.purchased_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const wearRows = useMemo<
    { wear: Wear; index: number }[]
  >(() => {
    const result = wearsAsc.map((wear, i) => ({ wear, index: i }));
    return result.reverse();
  }, [wearsAsc]);

  return (
    <View
      style={{
        width: 320,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 24,
        paddingVertical: 28,
      }}
    >
      {/* Wordmark */}
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 22,
          color: "#1A1A1A",
          textAlign: "center",
          letterSpacing: 2,
          marginBottom: 4,
        }}
      >
        Wears
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "#8A8070",
          textAlign: "center",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        QUARTERLY EARNINGS REPORT
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "#8A8070",
          textAlign: "center",
          letterSpacing: 1,
          marginBottom: 14,
        }}
      >
        OPERATOR · {username.toUpperCase()}
      </Text>

      <DotLine />

      {/* Item header */}
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 18,
          color: "#1A1A1A",
          textAlign: "center",
          marginVertical: 8,
        }}
      >
        {item.name}
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "#8A8070",
          textAlign: "center",
          letterSpacing: 1,
          marginBottom: 12,
        }}
      >
        {item.brand?.toUpperCase() ?? ""}
        {item.brand ? " · " : ""}ACQUIRED {acquired.toUpperCase()}
      </Text>

      <DotLine />

      {/* Summary */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
        <Text style={monoSmall}>BASIS</Text>
        <Text style={monoSmall}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingBottom: 8 }}>
        <Text style={monoSmall}>UNITS</Text>
        <Text style={monoSmall}>{item.wears.length}</Text>
      </View>

      <DotLine />

      {/* Column headers */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 6,
        }}
      >
        <Text style={[monoSmall, { flex: 2 }]}>DATE</Text>
        <Text style={[monoSmall, { flex: 3 }]}>OCCASION</Text>
        <Text style={[monoSmall, { textAlign: "right", flex: 2 }]}>CPW</Text>
      </View>

      {/* Wear rows (cap at 12 for space) */}
      {wearRows.slice(0, 12).map(({ wear, index }) => (
        <View
          key={wear.id}
          style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}
        >
          <Text style={[monoSmall, { flex: 2, color: "#1A1A1A" }]}>
            {wear.worn_at.slice(5).replace("-", "/")}
          </Text>
          <Text style={[monoSmall, { flex: 3, color: "#1A1A1A" }]} numberOfLines={1}>
            {wear.occasion ?? "—"}
          </Text>
          <Text style={[monoSmall, { flex: 2, textAlign: "right", color: "#C4503A" }]}>
            ${cpwAtIndex(wearsAsc.length - 1 - (wearRows.length - 1 - wearRows.indexOf({ wear, index })))}
          </Text>
        </View>
      ))}

      <DotLine style={{ marginTop: 12 }} />

      {/* Net CPW */}
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "#8A8070",
          textAlign: "center",
          letterSpacing: 1.5,
          marginTop: 10,
          marginBottom: 4,
        }}
      >
        NET COST PER WEAR
      </Text>
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 36,
          color: "#C4503A",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        ${item.cpw.toFixed(2)}
      </Text>

      {item.cpw <= 25 && (
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 8,
            color: "#1A1A1A",
            textAlign: "center",
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          * STATUS: PROFITABLE *
        </Text>
      )}

      <DotLine />

      {/* Barcode decoration */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "flex-end",
          height: 28,
          gap: 1,
          marginVertical: 10,
        }}
      >
        {Array.from({ length: 48 }).map((_, i) => (
          <View
            key={i}
            style={{
              width: i % 5 === 0 ? 3 : 1,
              height: i % 3 === 0 ? 28 : i % 2 === 0 ? 20 : 14,
              backgroundColor: "#1A1A1A",
            }}
          />
        ))}
      </View>

      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 7,
          color: "#8A8070",
          textAlign: "center",
          letterSpacing: 2,
        }}
      >
        WEARS.APP/M
      </Text>
    </View>
  );
}

function DotLine({ style }: { style?: object }) {
  return (
    <View style={[{ overflow: "hidden", marginVertical: 0 }, style]}>
      <View
        style={{
          borderBottomWidth: 1,
          borderStyle: "dashed",
          borderColor: "#D9D3C7",
          marginBottom: -1,
        }}
      />
    </View>
  );
}

const monoSmall = {
  fontFamily: "DMSans_400Regular",
  fontSize: 8,
  color: "#8A8070",
  letterSpacing: 0.5,
};
