import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getTier, isProfitable } from "@/constants/config";
import type { ItemWithWears } from "@/lib/database.types";

interface Props {
  item: ItemWithWears;
  username: string;
}

// Stable decorative QR-like pattern (computed once on mount)
const STATIC_QR = Array.from({ length: 49 }, (_, i) =>
  [1,0,1,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0][i] === 1
);

function QRDecoration() {
  const cells = STATIC_QR;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", width: 56 }}>
      {cells.map((filled, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            backgroundColor: filled ? "rgba(255,255,255,0.85)" : "transparent",
          }}
        />
      ))}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.35)",
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontFamily: "Courier",
          fontSize: 8,
          color: "rgba(255,255,255,0.85)",
          letterSpacing: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function WalletPassShare({ item, username }: Props) {
  const acquired = new Date(item.purchased_at).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
  const tier = getTier(item.cpw).toUpperCase();
  const status = isProfitable(item.cpw) ? "PROFIT." : "IN PROGRESS";

  return (
    <LinearGradient
      colors={["#6B3F2A", "#C4503A", "#8B4513"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: 320, height: 190, padding: 20 }}
    >
      {/* Top row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: 7,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            WEARS · MEMBER
          </Text>
          <Text
            style={{
              fontFamily: "DMSerifDisplay_400Regular",
              fontSize: 16,
              color: "#FFFFFF",
              marginTop: 2,
            }}
          >
            {username}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: "DMSerifDisplay_400Regular",
            fontSize: 20,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          W.
        </Text>
      </View>

      {/* Asset label + name */}
      <Text
        style={{
          fontFamily: "Courier",
          fontSize: 7,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: 2,
          marginTop: 14,
        }}
      >
        ASSET
      </Text>
      <Text
        style={{
          fontFamily: "DMSerifDisplay_400Regular",
          fontSize: 14,
          color: "#FFFFFF",
          marginTop: 1,
        }}
      >
        {item.name}
        {item.purchased_at ? `, '${new Date(item.purchased_at).getFullYear().toString().slice(2)}` : ""}
      </Text>

      {/* CPW hero */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: 7,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: 2,
            }}
          >
            COST PER WEAR
          </Text>
          <Text
            style={{
              fontFamily: "DMSerifDisplay_400Regular",
              fontSize: 32,
              color: "#FFFFFF",
              lineHeight: 38,
            }}
          >
            ${item.cpw.toFixed(2)}
          </Text>
          <Text
            style={{
              fontFamily: "Courier",
              fontSize: 7,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: 1,
            }}
          >
            {item.wears.length} WEARS · ${item.price} BASIS
          </Text>
        </View>
        <QRDecoration />
      </View>

      {/* Chips + tagline row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
        }}
      >
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Chip label={`SINCE ${acquired.toUpperCase()}`} />
          <Chip label={`STATUS ${status}`} />
          <Chip label={`TIER ${tier}`} />
        </View>
      </View>

      {/* Tagline */}
      <Text
        style={{
          position: "absolute",
          bottom: 12,
          right: 20,
          fontFamily: "Courier",
          fontSize: 7,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: 1,
          fontStyle: "italic",
        }}
      >
        she&apos;s earning her keep.
      </Text>
    </LinearGradient>
  );
}
