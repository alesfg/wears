import { View, Text } from "react-native";
import { isProfitable, getTier } from "@/constants/config";
import { Colors } from "@/constants/theme";

interface Props {
  cpw: number;
}

export function TierBadge({ cpw }: Props) {
  const label = isProfitable(cpw) ? "PROFITABLE" : getTier(cpw).toUpperCase();

  return (
    <View
      style={{
        backgroundColor: Colors.badge,
        paddingHorizontal: 8,
        paddingVertical: 3,
      }}
    >
      <Text
        style={{
          fontFamily: "Courier",
          fontSize: 9,
          color: Colors.cream,
          letterSpacing: 1.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
