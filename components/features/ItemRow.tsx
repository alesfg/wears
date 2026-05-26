import { View, Text, TouchableOpacity, Image } from "react-native";
import { Colors } from "@/constants/theme";
import type { ItemWithWears } from "@/lib/database.types";

interface Props {
  item: ItemWithWears;
  onPress: () => void;
}

function getTierDotColor(cpw: number): string {
  if (cpw <= 10) return "#5B9966";
  if (cpw <= 25) return "#C9A84C";
  if (cpw <= 80) return "#D4813A";
  return "#C4503A";
}

// Deterministic muted swatch color for placeholder thumbnails
const SWATCH_PALETTE = [
  "#E8DDD0", "#D4C5B0", "#C9B99A", "#DDD4C5",
  "#B8A898", "#CFC4B4", "#D8CFBE", "#C4BAA8",
];
function swatchColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return SWATCH_PALETTE[hash % SWATCH_PALETTE.length];
}

export function ItemRow({ item, onPress }: Props) {
  const cpwFormatted = item.cpw.toFixed(2);
  const wearCount = item.wears.length;
  const dotColor = getTierDotColor(item.cpw);

  const meta = [
    item.brand ? item.brand.toUpperCase() : null,
    `${wearCount}×`,
    `$${item.price}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 14,
      }}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: 60,
          height: 60,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: 60, height: 60 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: swatchColor(item.id) }} />
        )}
      </View>

      {/* Name + meta */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular",
            fontSize: 17,
            color: Colors.ink,
            lineHeight: 22,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 5 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: dotColor,
              marginTop: 1,
            }}
          />
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 10,
              color: Colors.muted,
              letterSpacing: 0.8,
              flexShrink: 1,
            }}
            numberOfLines={1}
          >
            {meta}
          </Text>
        </View>
      </View>

      {/* CPW */}
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={{
            fontFamily: "InstrumentSerif_400Regular_Italic",
            fontSize: 18,
            color: Colors.cpw,
          }}
        >
          ${cpwFormatted}
        </Text>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 0.5,
          }}
        >
          /wear
        </Text>
      </View>
    </TouchableOpacity>
  );
}
