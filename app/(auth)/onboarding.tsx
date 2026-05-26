import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useItemStore } from "@/store/itemStore";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";
import type { ItemInsert } from "@/lib/database.types";
import { t } from "@/lib/i18n";

const ONBOARDING_KEY = "@wears/onboarding_complete";

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === "true";
}

async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

const WEAR_MILESTONES = [1, 5, 10, 20, 30];

function formatCpw(val: number): string {
  if (val >= 100 && Number.isInteger(val)) return `$${val}`;
  return `$${val.toFixed(2)}`;
}

function ProgressBar({ filled }: { filled: number }) {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 4, paddingBottom: 14 }}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{ flex: 1, height: 3, backgroundColor: i <= filled ? Colors.cpw : Colors.border }}
        />
      ))}
    </View>
  );
}

async function uploadImage(uri: string, userId: string): Promise<string | null> {
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
}

export default function Onboarding() {
  const router = useRouter();
  const { user } = useUserStore();
  const { addItem } = useItemStore();

  // form
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // step 0 = "THE HOOK" (STEP 2/3), step 1 = "THE MATH" (STEP 3/3)
  const [step, setStep] = useState<0 | 1>(0);
  const [savedName, setSavedName] = useState("");
  const [savedPrice, setSavedPrice] = useState(0);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const runTheNumbers = async () => {
    if (!name.trim()) { setError(t("giveAName")); return; }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) { setError(t("enterCostBasis")); return; }
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    posthog.capture(Events.ONBOARDING_STEP, { step: 2, action: "run_numbers" });

    let image_url: string | null = null;
    if (imageUri) image_url = await uploadImage(imageUri, user.id);

    const itemData: ItemInsert = {
      user_id: user.id,
      name: name.trim(),
      brand: brand.trim() || null,
      category: null,
      price: parsedPrice,
      purchased_at: new Date().toISOString().split("T")[0],
      image_url,
    };

    const saved = await addItem(itemData, user.id);
    setLoading(false);
    if (!saved) { setError(t("couldntSave")); return; }

    setSavedName(name.trim());
    setSavedPrice(parsedPrice);
    setStep(1);
  };

  const openCloset = async () => {
    posthog.capture(Events.ONBOARDING_STEP, { step: 3, action: "complete" });
    await completeOnboarding();
    router.replace("/(app)");
  };

  // ─── STEP 2/3: THE HOOK ──────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
        <ProgressBar filled={2} />

        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", paddingHorizontal: 24, paddingBottom: 20 }}>
          {t("step2Label")}
        </Text>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Headline */}
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 38, color: Colors.ink, lineHeight: 46, marginBottom: 16 }}>
              {t("guiltPieceHeadline")}
              <Text style={{ color: Colors.cpw }}>{t("guiltPieceAccent")}</Text>
            </Text>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.muted, lineHeight: 22, marginBottom: 28 }}>
              {t("onboardingDesc")}
            </Text>

            {/* Photo picker */}
            <TouchableOpacity
              onPress={pickImage}
              style={{ width: "100%", aspectRatio: 1, backgroundColor: "#7A6B5A", alignItems: "center", justifyContent: "center", marginBottom: 28, overflow: "hidden" }}
              activeOpacity={0.85}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: "center", gap: 10 }}>
                  <Feather name="camera" size={32} color="rgba(255,255,255,0.55)" />
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: 2, textTransform: "uppercase" }}>
                      TAP TO ADD PHOTO
                    </Text>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase" }}>
                      {t("orScanReceipt")}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>

            {/* Name */}
            <View style={{ marginBottom: 24 }}>
              <Text style={labelStyle}>{t("nameCostBasis")}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Bias Slip Dress"
                placeholderTextColor={Colors.border}
                style={inputStyle}
                autoCapitalize="words"
              />
            </View>

            {/* Brand */}
            <View style={{ marginBottom: 24 }}>
              <Text style={labelStyle}>{t("brandLabel")}</Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="Khaite"
                placeholderTextColor={Colors.border}
                style={inputStyle}
                autoCapitalize="words"
              />
            </View>

            {/* Price */}
            <View style={{ marginBottom: 8 }}>
              <Text style={labelStyle}>{t("costBasisLabel")}</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={Colors.border}
                style={inputStyle}
                keyboardType="decimal-pad"
              />
            </View>

            {error && (
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.cpw, marginTop: 8, letterSpacing: 0.5 }}>
                {error}
              </Text>
            )}
          </ScrollView>

          {/* Sticky CTA */}
          <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12, backgroundColor: Colors.cream }}>
            <TouchableOpacity
              onPress={runTheNumbers}
              disabled={loading}
              style={{ backgroundColor: Colors.ink, paddingVertical: 18, alignItems: "center", borderRadius: 100 }}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.cream} />
              ) : (
                <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.cream }}>
                  {t("runNumbers")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── STEP 3/3: THE MATH ──────────────────────────────────────────────────────
  const displayName = savedName.toLowerCase();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      <ProgressBar filled={3} />

      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", paddingHorizontal: 24, paddingBottom: 20 }}>
        {t("step3Label")}
      </Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Eyebrow + headline */}
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          {t("heresDeal")}
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 40, color: Colors.ink, lineHeight: 48, marginBottom: 32 }}>
          The {displayName}{"\n"}cost ${savedPrice % 1 === 0 ? savedPrice : savedPrice.toFixed(2)}.
        </Text>

        {/* Table header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
            {t("everyWearDrops")}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
            CPW
          </Text>
        </View>

        {/* CPW rows */}
        {WEAR_MILESTONES.map((wears, idx) => {
          const cpw = savedPrice / wears;
          const isLast = idx === WEAR_MILESTONES.length - 1;
          const barFraction = 1 / wears;
          const barColor = isLast ? Colors.cpw : "#C8C0B4";
          const cpwColor = isLast ? Colors.cpw : Colors.ink;
          const label = String(wears).padStart(2, "0") + "×";

          return (
            <View key={wears}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.muted, letterSpacing: 0.5, width: 32 }}>
                  {label}
                </Text>
                {/* Bar track */}
                <View style={{ flex: 1, height: 8, backgroundColor: Colors.border }}>
                  <View style={{ width: `${Math.max(barFraction * 100, 1.5)}%`, height: 8, backgroundColor: barColor }} />
                </View>
                <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 18, color: cpwColor, textAlign: "right", width: 72 }}>
                  {formatCpw(cpw)}
                </Text>
              </View>
              <View style={{ height: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, borderStyle: "dashed" }} />
            </View>
          );
        })}

        {/* Pull quote */}
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 22, color: Colors.ink, lineHeight: 32, marginTop: 32 }}>
          {(([pre, post]) => <>{pre}<Text style={{ color: Colors.cpw }}>30</Text>{post}</>)(t("oatMilkQuote").split("{n}"))}
        </Text>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12, backgroundColor: Colors.cream }}>
        <TouchableOpacity
          onPress={openCloset}
          style={{ backgroundColor: Colors.ink, paddingVertical: 18, alignItems: "center", borderRadius: 100 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.cream }}>
            {t("openCloset")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const labelStyle = {
  fontFamily: "DMSans_400Regular",
  fontSize: 9,
  color: Colors.muted,
  letterSpacing: 1.5,
  textTransform: "uppercase" as const,
  marginBottom: 8,
};

const inputStyle = {
  fontFamily: "InstrumentSerif_400Regular_Italic",
  fontSize: 22,
  color: Colors.ink,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  paddingBottom: 10,
};
