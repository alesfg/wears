import { View, Text, Image } from "react-native";
import type { ItemWithWears } from "@/lib/database.types";
import { isProfitable } from "@/constants/config";
import { useCurrencyStore } from "@/store/currencyStore";
import { t } from "@/lib/i18n";

interface Props {
  item: ItemWithWears;
  username: string;
}

const CANVAS_W = 360;
const POLAROID_W = 272;
const PHOTO_SIZE = 230;
const FRAME_PAD = 11; // white border on top + sides
const BOTTOM_H = 82;  // white polaroid bottom section

export function PolaroidShare({ item, username }: Props) {
  const symbol = useCurrencyStore((s) => s.symbol);
  const photoW = POLAROID_W - FRAME_PAD * 2;
  const categoryLabel = [item.category?.toUpperCase(), item.brand?.toUpperCase()]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={{
        width: CANVAS_W,
        backgroundColor: "#EDE8DF",
        alignItems: "center",
        paddingTop: 52,
        paddingBottom: 40,
      }}
    >
      {/* Wrapper: defines stacking context for polaroid + sticky note */}
      <View style={{ width: POLAROID_W + 40 }}>

        {/* Tape — sits above and overlaps the top of the polaroid */}
        <View
          style={{
            alignSelf: "center",
            width: 48,
            height: 18,
            backgroundColor: "rgba(190,170,142,0.55)",
            marginBottom: -9,
            zIndex: 3,
          }}
        />

        {/* Polaroid card */}
        <View
          style={{
            width: POLAROID_W,
            alignSelf: "center",
            backgroundColor: "#FAF8F4",
            transform: [{ rotate: "-2.5deg" }],
            shadowColor: "#000",
            shadowOpacity: 0.16,
            shadowRadius: 20,
            shadowOffset: { width: 4, height: 8 },
            elevation: 8,
            zIndex: 1,
          }}
        >
          {/* Top frame */}
          <View style={{ height: FRAME_PAD }} />

          {/* Photo area */}
          <View
            style={{
              marginHorizontal: FRAME_PAD,
              height: PHOTO_SIZE,
              width: photoW,
              backgroundColor: "#C5B49A",
              overflow: "hidden",
            }}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: photoW, height: PHOTO_SIZE }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ flex: 1, backgroundColor: "#C5B49A" }} />
            )}

            {/* PROFITABLE badge — top-right, outlined */}
            {isProfitable(item.cpw) && (
              <View
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  borderWidth: 1.5,
                  borderColor: "rgba(255,255,255,0.85)",
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 7,
                    color: "rgba(255,255,255,0.9)",
                    letterSpacing: 1.5,
                  }}
                >
                  PROFITABLE
                </Text>
              </View>
            )}

            {/* Category + color label — bottom-left */}
            {categoryLabel ? (
              <View style={{ position: "absolute", bottom: 10, left: 10 }}>
                <Text
                  style={{
                    fontFamily: "DMSans_400Regular",
                    fontSize: 7,
                    color: "rgba(255,255,255,0.6)",
                    letterSpacing: 1.5,
                  }}
                >
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
          </View>

          {/* White bottom section */}
          <View
            style={{
              height: BOTTOM_H,
              paddingHorizontal: 16,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 24,
                color: "#1A1A1A",
                lineHeight: 30,
              }}
            >
              {symbol}{item.cpw.toFixed(2)} {t("sharePerWear")}{" "}
              <Text style={{ fontSize: 17 }}>🌸</Text>
            </Text>
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 9,
                color: "#8A8070",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginTop: 5,
              }}
            >
              {item.name.toUpperCase()} · {item.wears.length}× {t("shareWornLabel")}
            </Text>
          </View>
        </View>

        {/* Sticky note — overlapping bottom-right of polaroid */}
        <View
          style={{
            position: "absolute",
            right: 0,
            bottom: 10,
            width: 90,
            backgroundColor: "#F4EFD8",
            paddingVertical: 10,
            paddingHorizontal: 10,
            transform: [{ rotate: "4deg" }],
            shadowColor: "#000",
            shadowOffset: { width: 1, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
            zIndex: 5,
          }}
        >
          <Text
            style={{
              fontFamily: "DMSans_400Regular",
              fontSize: 8,
              color: "#5A4E40",
              lineHeight: 13,
            }}
          >
            {t("shareCostBasisLower")}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSerif_400Regular_Italic",
              fontSize: 19,
              color: "#1A1A1A",
              lineHeight: 24,
            }}
          >
            {t("shareJustified")}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 8,
          color: "rgba(100,88,74,0.45)",
          letterSpacing: 1.5,
          textAlign: "center",
          marginTop: 28,
        }}
      >
        ◦ wears · @{username.toLowerCase()}
      </Text>
    </View>
  );
}
