import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState, useMemo } from "react";
import ViewShot, { type ViewShotRef } from "react-native-view-shot";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { ReceiptShare } from "@/components/features/shares/ReceiptShare";
import { PolaroidShare } from "@/components/features/shares/PolaroidShare";
import { WalletPassShare } from "@/components/features/shares/WalletPassShare";
import { DashedLine } from "@/components/ui/DashedLine";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";

type Format = "receipt" | "polaroid" | "wallet";
const FORMATS: { key: Format; label: string }[] = [
  { key: "receipt", label: "RECEIPT" },
  { key: "polaroid", label: "POLAROID" },
  { key: "wallet", label: "WALLET" },
];

export default function ShareModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { items } = useItemStore();
  const { user } = useUserStore();
  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);

  const [format, setFormat] = useState<Format>("receipt");
  const [saving, setSaving] = useState(false);
  const shotRef = useRef<ViewShotRef>(null);

  const username = user?.email?.split("@")[0] ?? "you";

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
        <ActivityIndicator style={{ flex: 1 }} color={Colors.ink} />
      </SafeAreaView>
    );
  }

  const capture = async (): Promise<string | null> => {
    try {
      if (!shotRef.current) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (shotRef.current as any).capture();
    } catch {
      return null;
    }
  };

  const saveToRoll = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to save.");
      return;
    }
    setSaving(true);
    const uri = await capture();
    if (uri) {
      await MediaLibrary.saveToLibraryAsync(uri);
      posthog.capture(Events.SHARE_EXPORTED, { format, item_id: id });
      Alert.alert("Saved!", "Image saved to your camera roll.");
    }
    setSaving(false);
  };

  const shareOut = async () => {
    setSaving(true);
    const uri = await capture();
    if (uri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
      posthog.capture(Events.SHARE_EXPORTED, { format, item_id: id, action: "share" });
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>
            CLOSE
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.ink, letterSpacing: 2, textTransform: "uppercase" }}>
          Share Asset
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <DashedLine />

      {/* Format tabs */}
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        {FORMATS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFormat(f.key)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: format === f.key ? Colors.ink : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontFamily: "Courier",
                fontSize: 9,
                color: format === f.key ? Colors.ink : Colors.muted,
                letterSpacing: 1.5,
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview */}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ViewShot ref={shotRef} options={{ format: "png", quality: 1.0 }}>
          {format === "receipt" && <ReceiptShare item={item} username={username} />}
          {format === "polaroid" && <PolaroidShare item={item} username={username} />}
          {format === "wallet" && <WalletPassShare item={item} username={username} />}
        </ViewShot>
      </ScrollView>

      {/* Actions */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: 20,
          paddingTop: 12,
          gap: 10,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <TouchableOpacity
          onPress={saveToRoll}
          disabled={saving}
          style={{ backgroundColor: Colors.ink, paddingVertical: 14, alignItems: "center" }}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={Colors.cream} />
          ) : (
            <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
              Save to Camera Roll
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={shareOut}
          disabled={saving}
          style={{
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: Colors.border,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.ink, letterSpacing: 2, textTransform: "uppercase" }}>
            Share...
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
