import { View, Text, TouchableOpacity, Image } from "react-native";
import { Colors } from "@/constants/theme";
import type { ItemWithWears } from "@/lib/database.types";

interface Props {
  item: ItemWithWears;
  onPress: () => void;
}

export function ItemRow({ item, onPress }: Props) {
  const cpwFormatted = item.cpw.toFixed(2);
  const wearCount = item.wears.length;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 12,
      }}
      activeOpacity={0.7}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: 44,
          height: 44,
          backgroundColor: Colors.border,
          overflow: "hidden",
        }}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: 44, height: 44 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              flex: 1,
              backgroundColor: "#E8E2D8",
            }}
          />
        )}
      </View>

      {/* Name + meta */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "DMSerifDisplay_400Regular",
            fontSize: 15,
            color: Colors.ink,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text
          style={{
            fontFamily: "Courier",
            fontSize: 10,
            color: Colors.muted,
            marginTop: 2,
          }}
        >
          {[item.brand, wearCount > 0 ? `${wearCount}×` : "0×", `$${item.price}`]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>

      {/* CPW */}
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={{
            fontFamily: "DMSerifDisplay_400Regular",
            fontSize: 17,
            color: Colors.cpw,
          }}
        >
          ${cpwFormatted}
        </Text>
        <Text
          style={{
            fontFamily: "Courier",
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
