import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { DashedLine } from "@/components/ui/DashedLine";
import { Colors } from "@/constants/theme";
import { CATEGORIES } from "@/constants/config";
import { analyzeGarment } from "@/lib/anthropic";
import type { ItemInsert } from "@/lib/database.types";
import { t } from "@/lib/i18n";

type Category = (typeof CATEGORIES)[number];

function toIsoDate(input: string): string {
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
}

export default function AddItem() {
  const router = useRouter();
  const { user } = useUserStore();
  const { addItem } = useItemStore();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [purchasedAt, setPurchasedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);

      if (asset.base64) {
        setScanning(true);
        const analysis = await analyzeGarment(asset.base64);
        if (analysis) {
          if (analysis.name && !name) setName(analysis.name);
          if (analysis.brand && !brand) setBrand(analysis.brand);
          if (analysis.category && !category) setCategory(analysis.category);
        }
        setScanning(false);
      }
    }
  };

  const uploadImage = async (uri: string, userId: string): Promise<string | null> => {
    try {
      const rawExt = (uri.split(".").pop() ?? "jpg").split("?")[0].toLowerCase();
      const ext = rawExt === "jpg" ? "jpeg" : rawExt;
      const path = `${userId}/${Date.now()}.${ext}`;
      const arraybuffer = await fetch(uri).then((r) => r.arrayBuffer());
      const { error } = await supabase.storage
        .from("item-images")
        .upload(path, arraybuffer, { contentType: `image/${ext}` });
      if (error) return null;
      const { data } = supabase.storage.from("item-images").getPublicUrl(path);
      return data.publicUrl;
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setError(t("validCostBasis"));
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    let image_url: string | null = null;
    if (imageUri) {
      image_url = await uploadImage(imageUri, user.id);
    }

    const itemData: ItemInsert = {
      user_id: user.id,
      name: name.trim(),
      brand: brand.trim() || null,
      category: category || null,
      price: parsedPrice,
      purchased_at: toIsoDate(purchasedAt),
      image_url,
    };

    const result = await addItem(itemData, user.id);
    setLoading(false);
    if (result) {
      router.back();
    } else {
      setError(t("failedToSave"));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
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
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>
              {t("cancel")}
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.ink, letterSpacing: 2, textTransform: "uppercase" }}>
            {t("newAsset")}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <DashedLine />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo + scan */}
          <TouchableOpacity
            onPress={pickImage}
            disabled={scanning}
            style={{
              width: "100%",
              aspectRatio: 1,
              backgroundColor: "#EDE8DF",
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: Colors.border,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              overflow: "hidden",
            }}
            activeOpacity={0.7}
          >
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {scanning && (
                  <View
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(26,26,26,0.55)",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    <ActivityIndicator color={Colors.cream} />
                    <Text style={{
                      fontFamily: "DMSans_400Regular",
                      fontSize: 9,
                      color: Colors.cream,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}>
                      ANALYZING...
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={{ alignItems: "center", gap: 10 }}>
                <Text style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 10,
                  color: Colors.muted,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}>
                  {t("tapToAddPhoto")}
                </Text>
                <Text style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 8,
                  color: Colors.border,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}>
                  ✦ AI WILL FILL THE FORM
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Field label={t("itemName")} scanning={scanning && !name}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. The Trench"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
              editable={!scanning}
            />
          </Field>

          {/* Brand */}
          <Field label={t("brand")} scanning={scanning && !brand}>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Aritzia"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
              editable={!scanning}
            />
          </Field>

          {/* Cost Basis — never pre-filled, always user input */}
          <Field label={t("costBasisField")}>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              keyboardType="decimal-pad"
            />
          </Field>

          {/* Date Acquired */}
          <Field label={t("acquiredDate")}>
            <TextInput
              value={purchasedAt}
              onChangeText={setPurchasedAt}
              placeholder="2024-09-01"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              keyboardType="numbers-and-punctuation"
            />
          </Field>

          {/* Category */}
          <View style={{ marginBottom: 24 }}>
            <Text style={[labelStyle, scanning && !category ? { color: Colors.cpw } : {}]}>
              {t("category")}
              {scanning && !category ? " · SCANNING..." : ""}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat === category ? "" : cat)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderWidth: 1,
                      borderColor: category === cat ? Colors.ink : Colors.border,
                      backgroundColor: category === cat ? Colors.ink : "transparent",
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        fontFamily: "DMSans_400Regular",
                        fontSize: 10,
                        color: category === cat ? Colors.cream : Colors.muted,
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {error && (
            <Text
              style={{
                fontFamily: "DMSans_400Regular",
                fontSize: 10,
                color: Colors.cpw,
                marginBottom: 12,
                letterSpacing: 0.5,
              }}
            >
              {error}
            </Text>
          )}

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || scanning}
            style={{
              backgroundColor: Colors.ink,
              paddingVertical: 16,
              alignItems: "center",
              opacity: scanning ? 0.5 : 1,
            }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 11,
                  color: Colors.cream,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                {t("logAsset")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  children,
  scanning,
}: {
  label: string;
  children: React.ReactNode;
  scanning?: boolean;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Text style={labelStyle}>{label}</Text>
        {scanning && (
          <ActivityIndicator size="small" color={Colors.cpw} style={{ transform: [{ scale: 0.6 }] }} />
        )}
      </View>
      {children}
    </View>
  );
}

const labelStyle = {
  fontFamily: "DMSans_400Regular",
  fontSize: 9,
  color: Colors.muted,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
};

const inputStyle = {
  fontFamily: "InstrumentSerif_400Regular",
  fontSize: 18,
  color: Colors.ink,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  paddingBottom: 8,
};
