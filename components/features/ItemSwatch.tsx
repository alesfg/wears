import { View, Image } from "react-native";
import { Colors } from "@/constants/theme";
import type { ItemWithWears } from "@/lib/database.types";

// Category → swatch color (used as background fill — both behind a contained
// photo so it never looks cropped, and standalone when there's no image).
const CATEGORY_COLORS: Record<string, string> = {
  outerwear:   "#C4A882",
  knitwear:    "#6B5744",
  denim:       "#2A3F5C",
  shoes:       "#1A1A1A",
  bags:        "#9B7A5A",
  tops:        "#D4C5B2",
  dresses:     "#C8B8E8",
  skirts:      "#E8C8A8",
  pants:       "#4A5568",
  accessories: "#9B8054",
};

export function itemSwatchColor(item: ItemWithWears): string {
  return CATEGORY_COLORS[item.category ?? ""] ?? Colors.muted;
}

// Renders the item's photo (always fully visible, never cropped) over a
// category-color fill, or just the fill when the item has no photo.
export function ItemSwatch({
  item, style,
}: {
  item: ItemWithWears;
  style: { width?: number | `${number}%`; height?: number | `${number}%`; flex?: number };
}) {
  return (
    <View style={{ ...style, backgroundColor: itemSwatchColor(item), overflow: "hidden" }}>
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}
