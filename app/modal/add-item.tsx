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
import type { ItemInsert } from "@/lib/database.types";

type Category = (typeof CATEGORIES)[number];

function toIsoDate(input: string): string {
  // Accepts YYYY-MM-DD or tries to parse
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
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string, userId: string): Promise<string | null> => {
    try {
      const rawExt = (uri.split(".").pop() ?? "jpg").split("?")[0].toLowerCase();
      // jpg is not a valid MIME type — must be jpeg
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
      setError("Name is required.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a valid cost basis.");
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
      setError("Failed to save. Try again.");
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
            <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>
              CANCEL
            </Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: "Courier", fontSize: 10, color: Colors.ink, letterSpacing: 2, textTransform: "uppercase" }}>
            New Asset
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <DashedLine />

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo */}
          <TouchableOpacity
            onPress={pickImage}
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
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text
                style={{
                  fontFamily: "Courier",
                  fontSize: 10,
                  color: Colors.muted,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                TAP TO ADD PHOTO
              </Text>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Field label="Item Name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. The Trench"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
            />
          </Field>

          {/* Brand */}
          <Field label="Brand">
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. Aritzia"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
            />
          </Field>

          {/* Cost Basis */}
          <Field label="Cost Basis ($)">
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
          <Field label="Acquired (YYYY-MM-DD)">
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
            <Text style={labelStyle}>Category</Text>
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
                        fontFamily: "Courier",
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
                fontFamily: "Courier",
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
            disabled={loading}
            style={{
              backgroundColor: Colors.ink,
              paddingVertical: 16,
              alignItems: "center",
            }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text
                style={{
                  fontFamily: "Courier",
                  fontSize: 11,
                  color: Colors.cream,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Log Asset
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={labelStyle}>{label}</Text>
      {children}
    </View>
  );
}

const labelStyle = {
  fontFamily: "Courier",
  fontSize: 9,
  color: Colors.muted,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  marginBottom: 6,
};

const inputStyle = {
  fontFamily: "DMSerifDisplay_400Regular",
  fontSize: 18,
  color: Colors.ink,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  paddingBottom: 8,
};
