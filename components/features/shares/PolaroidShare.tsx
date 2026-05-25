import { View, Text, Image } from "react-native";
import type { ItemWithWears } from "@/lib/database.types";

interface Props {
  item: ItemWithWears;
  username: string;
}

export function PolaroidShare({ item, username }: Props) {
  return (
    <View
      style={{
        width: 280,
        backgroundColor: "#FAF7F2",
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 12,
      }}
    >
      {/* Tape decoration */}
      <View
        style={{
          width: 40,
          height: 16,
          backgroundColor: "rgba(212, 205, 192, 0.7)",
          position: "absolute",
          top: -8,
          alignSelf: "center",
        }}
      />

      {/* Photo frame */}
      <View
        style={{
          width: 256,
          height: 256,
          backgroundColor: "#E8E2D8",
          overflow: "hidden",
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#D9D3C7",
        }}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: 256, height: 256 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: "#E8E2D8", justifyContent: "flex-end", padding: 10 }}>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: "#8A8070",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {item.category ?? ""} · {item.name.split(" ").pop()?.toUpperCase()}
            </Text>
          </View>
        )}

        {/* PROFITABLE badge overlay */}
        {item.cpw <= 25 && (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              backgroundColor: "#5C5347",
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 7,
                color: "#F5F2EB",
                letterSpacing: 1.5,
              }}
            >
              PROFITABLE
            </Text>
          </View>
        )}
      </View>

      {/* Caption */}
      <Text
        style={{
          fontFamily: "InstrumentSerif_400Regular",
          fontSize: 18,
          color: "#1A1A1A",
          textAlign: "center",
        }}
      >
        ${item.cpw.toFixed(2)}/wear{" "}
        <Text style={{ fontSize: 14 }}>🌸</Text>
      </Text>
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 9,
          color: "#8A8070",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginTop: 4,
          textAlign: "center",
        }}
      >
        {item.name.toUpperCase()} · {item.wears.length}+ WORN
      </Text>

      {/* Sticky note */}
      <View
        style={{
          position: "absolute",
          bottom: 16,
          right: 12,
          width: 90,
          backgroundColor: "#F5F0E0",
          padding: 8,
          transform: [{ rotate: "3deg" }],
          shadowColor: "#000",
          shadowOffset: { width: 1, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text
          style={{
            fontFamily: "DMSans_400Regular",
            fontSize: 9,
            color: "#1A1A1A",
            lineHeight: 14,
          }}
        >
          cost basis:{"\n"}
          <Text style={{ fontWeight: "bold" }}>justified</Text>
        </Text>
      </View>

      {/* Footer */}
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 7,
          color: "#8A8070",
          letterSpacing: 1,
          marginTop: 8,
          textAlign: "center",
        }}
      >
        © wears · @{username.toLowerCase()}
      </Text>
    </View>
  );
}
