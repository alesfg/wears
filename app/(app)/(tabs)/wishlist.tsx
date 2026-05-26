import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";

export default function Wishlist() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: Colors.muted,
            letterSpacing: 2.5,
            textTransform: "uppercase",
          }}
        >
          WISHLIST · COMING SOON
        </Text>
      </View>
    </SafeAreaView>
  );
}
