import { View, ViewStyle } from "react-native";
import { Colors } from "@/constants/theme";

interface Props {
  color?: string;
  marginVertical?: number;
  style?: ViewStyle;
}

export function DashedLine({ color = Colors.border, marginVertical = 0, style }: Props) {
  return (
    <View style={[{ marginVertical, overflow: "hidden" }, style]}>
      <View
        style={{
          borderBottomWidth: 1,
          borderStyle: "dashed",
          borderColor: color,
          marginBottom: -1,
        }}
      />
    </View>
  );
}
