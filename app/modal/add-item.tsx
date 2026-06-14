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
  Alert,
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
import { removeBackground } from "@/lib/removebg";
import type { ItemInsert } from "@/lib/database.types";
import { t } from "@/lib/i18n";
import { posthog, Events } from "@/lib/posthog";

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
  const [cleanImageUri, setCleanImageUri] = useState<string | null>(null);
  const [scanningAI, setScanningAI] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceWarning, setServiceWarning] = useState<string | null>(null);

  const processing = scanningAI || removingBg;

  const overlayLabel = !scanningAI && removingBg ? "CLEANING BG..." : "ANALYZING...";

  const pickImage = async (source: "camera" | "library") => {
    const pickerOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    };

    let result: ImagePicker.ImagePickerResult;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") return;
      result = await ImagePicker.launchCameraAsync(pickerOptions);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    }
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setCleanImageUri(null);

      if (asset.base64) {
        setScanningAI(true);
        setRemovingBg(true);
        setServiceWarning(null);

        const warnings: string[] = [];

        analyzeGarment(asset.base64)
          .then((analysis) => {
            if (analysis) {
              if (analysis.name && !name) setName(analysis.name);
              if (analysis.brand && !brand) setBrand(analysis.brand);
              if (analysis.category && !category) setCategory(analysis.category);
            } else {
              warnings.push("AI scan unavailable");
            }
          })
          .catch(() => { warnings.push("AI scan unavailable"); })
          .finally(() => {
            setScanningAI(false);
            if (warnings.length) setServiceWarning(warnings.join(" · ") + " — fill in manually");
          });

        removeBackground(asset.uri, asset.base64)
          .then((clean) => { if (clean) setCleanImageUri(clean); })
          .catch(() => {})
          .finally(() => setRemovingBg(false));
      }
    }
  };

  const choosePhotoSource = () => {
    Alert.alert(t("addPhotoTitle"), undefined, [
      { text: t("takePhoto"), onPress: () => pickImage("camera") },
      { text: t("chooseFromLibrary"), onPress: () => pickImage("library") },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  const uploadImage = async (uri: string, userId: string): Promise<string | null> => {
    try {
      let arraybuffer: ArrayBuffer;
      let contentType: string;

      if (uri.startsWith("data:")) {
        // PNG data URI from background removal
        const [header, base64] = uri.split(",");
        contentType = header.split(":")[1].split(";")[0];
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        arraybuffer = bytes.buffer;
      } else {
        const rawExt = (uri.split(".").pop() ?? "jpg").split("?")[0].toLowerCase();
        const ext = rawExt === "jpg" ? "jpeg" : rawExt;
        contentType = `image/${ext}`;
        arraybuffer = await fetch(uri).then((r) => r.arrayBuffer());
      }

      const ext = contentType.includes("png") ? "png" : "jpeg";
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("item-images")
        .upload(path, arraybuffer, { contentType });
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
    const sourceToUpload = cleanImageUri ?? imageUri;
    if (sourceToUpload) {
      image_url = await uploadImage(sourceToUpload, user.id);
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
      posthog.capture(Events.ITEM_ADDED, {
        category: itemData.category ?? "none",
        price: itemData.price,
        has_image: !!image_url,
      });
      router.back();
    } else {
      setError(t("failedToSave"));
    }
  };

  const displayImage = cleanImageUri ?? imageUri;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 }}>
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* Photo */}
          <TouchableOpacity
            onPress={choosePhotoSource}
            disabled={processing}
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
            {displayImage ? (
              <>
                <Image
                  source={{ uri: displayImage }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode={cleanImageUri ? "contain" : "cover"}
                />

                {/* Processing overlay */}
                {processing && (
                  <View style={{
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(26,26,26,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}>
                    <ActivityIndicator color={Colors.cream} />
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.cream, letterSpacing: 2 }}>
                      {overlayLabel}
                    </Text>
                  </View>
                )}

                {/* BG removed badge */}
                {!processing && cleanImageUri && (
                  <View style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    backgroundColor: Colors.badge,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                  }}>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 7, color: Colors.cream, letterSpacing: 1.5 }}>
                      ✦ BG REMOVED
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  {t("tapToAddPhoto")}
                </Text>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 8, color: Colors.border, letterSpacing: 1.5, textTransform: "uppercase" }}>
                  ✦ AI SCANS + REMOVES BG
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Field label={t("itemName")} spinning={scanningAI && !name}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. The Trench"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
              editable={!scanningAI}
            />
          </Field>

          {/* Brand */}
          <Field label={t("brand")} spinning={scanningAI && !brand}>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Aritzia"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
              editable={!scanningAI}
            />
          </Field>

          {/* Cost Basis — always manual */}
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
            <Field label={t("category")} spinning={scanningAI && !category}>
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
                      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: category === cat ? Colors.cream : Colors.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </Field>
          </View>

          {serviceWarning && !processing && (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, marginBottom: 8, letterSpacing: 0.3 }}>
              ⚠ {serviceWarning}
            </Text>
          )}

          {error && (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.cpw, marginBottom: 12, letterSpacing: 0.5 }}>
              {error}
            </Text>
          )}

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading || processing}
            style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center", opacity: processing ? 0.45 : 1 }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
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
  label, children, spinning,
}: {
  label: string; children: React.ReactNode; spinning?: boolean;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Text style={labelStyle}>{label}</Text>
        {spinning && (
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
