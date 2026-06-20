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
import { useCurrencyStore } from "@/store/currencyStore";
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

function formatCpw(val: number, symbol: string): string {
  if (val >= 100 && Number.isInteger(val)) return `${symbol}${val}`;
  return `${symbol}${val.toFixed(2)}`;
}

// ─── Quiz data ─────────────────────────────────────────────────────────────────

type StyleAnswer = "minimalist" | "trendy" | "investment" | "thrifted";
type ClosetAnswer = "small" | "medium" | "large";
type PainAnswer = "impulse" | "unworn" | "unknown";
type FrequencyAnswer = "daily" | "weekly" | "whenever";

interface QuizAnswers {
  style?: StyleAnswer;
  closetSize?: ClosetAnswer;
  painPoint?: PainAnswer;
  frequency?: FrequencyAnswer;
}

type DiscoverSub = "intro" | "style" | "closet" | "pain" | "frequency" | "recap";
const DISCOVER_ORDER: DiscoverSub[] = ["intro", "style", "closet", "pain", "frequency", "recap"];

const FEATURES = [
  { icon: "trending-down" as const, titleKey: "featureCpwTitle" as const, descKey: "featureCpwDesc" as const },
  { icon: "award" as const, titleKey: "featureProfitableTitle" as const, descKey: "featureProfitableDesc" as const },
  { icon: "gift" as const, titleKey: "featureWrappedTitle" as const, descKey: "featureWrappedDesc" as const },
];

const STYLE_OPTIONS: { id: StyleAnswer; labelKey: "styleMinimalist" | "styleTrendy" | "styleInvestment" | "styleThrifted" }[] = [
  { id: "minimalist", labelKey: "styleMinimalist" },
  { id: "trendy", labelKey: "styleTrendy" },
  { id: "investment", labelKey: "styleInvestment" },
  { id: "thrifted", labelKey: "styleThrifted" },
];

const CLOSET_OPTIONS: { id: ClosetAnswer; labelKey: "closetSmall" | "closetMedium" | "closetLarge" }[] = [
  { id: "small", labelKey: "closetSmall" },
  { id: "medium", labelKey: "closetMedium" },
  { id: "large", labelKey: "closetLarge" },
];

const PAIN_OPTIONS: { id: PainAnswer; labelKey: "painImpulse" | "painUnworn" | "painUnknown" }[] = [
  { id: "impulse", labelKey: "painImpulse" },
  { id: "unworn", labelKey: "painUnworn" },
  { id: "unknown", labelKey: "painUnknown" },
];

const FREQUENCY_OPTIONS: { id: FrequencyAnswer; labelKey: "freqDaily" | "freqWeekly" | "freqWhenever" }[] = [
  { id: "daily", labelKey: "freqDaily" },
  { id: "weekly", labelKey: "freqWeekly" },
  { id: "whenever", labelKey: "freqWhenever" },
];

const STYLE_SHORT_KEYS = {
  minimalist: "styleShortMinimalist",
  trendy: "styleShortTrendy",
  investment: "styleShortInvestment",
  thrifted: "styleShortThrifted",
} as const;

const CLOSET_SHORT_KEYS = {
  small: "closetShortSmall",
  medium: "closetShortMedium",
  large: "closetShortLarge",
} as const;

const PAIN_SHORT_KEYS = {
  impulse: "painShortImpulse",
  unworn: "painShortUnworn",
  unknown: "painShortUnknown",
} as const;

const NAME_PLACEHOLDER_KEYS = {
  minimalist: "namePlaceholderMinimalist",
  trendy: "namePlaceholderTrendy",
  investment: "namePlaceholderInvestment",
  thrifted: "namePlaceholderThrifted",
} as const;

const HOOK_HINT_KEYS = {
  impulse: "hookHintImpulse",
  unworn: "hookHintUnworn",
  unknown: "hookHintUnknown",
} as const;

const MATH_FREQ_KEYS = {
  daily: "mathFreqDaily",
  weekly: "mathFreqWeekly",
  whenever: "mathFreqWhenever",
} as const;

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

function ProgressBar({ filled, total }: { filled: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 4, paddingBottom: 14 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{ flex: 1, height: 3, backgroundColor: i < filled ? Colors.cpw : Colors.border }}
        />
      ))}
    </View>
  );
}

function SubDots({ index, total }: { index: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 24, marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{ flex: 1, height: 2, backgroundColor: i <= index ? Colors.ink : Colors.border }}
        />
      ))}
    </View>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingHorizontal: 24, paddingBottom: 12 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Feather name="chevron-left" size={20} color={Colors.muted} />
    </TouchableOpacity>
  );
}

// ─── Discover: feature intro ──────────────────────────────────────────────────

function DiscoverIntro({ onContinue }: { onContinue: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 36, color: Colors.ink, lineHeight: 44, marginBottom: 32 }}>
          {t("discoverIntroHeadline")}
        </Text>

        {FEATURES.map((f, i) => (
          <View key={f.titleKey} style={{ flexDirection: "row", gap: 16, marginBottom: i < FEATURES.length - 1 ? 28 : 0 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Feather name={f.icon} size={18} color={Colors.cpw} />
            </View>
            <View style={{ flex: 1, paddingTop: 4 }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 19, color: Colors.ink, marginBottom: 4 }}>
                {t(f.titleKey)}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 19 }}>
                {t(f.descKey)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12, backgroundColor: Colors.cream }}>
        <TouchableOpacity
          onPress={onContinue}
          style={{ backgroundColor: Colors.ink, paddingVertical: 18, alignItems: "center", borderRadius: 100 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.cream }}>
            {t("continueCta")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Discover: one quiz question ──────────────────────────────────────────────

function QuizScreen<TId extends string>({
  questionKey, options, onSelect,
}: {
  questionKey: "quizStyleQuestion" | "quizClosetQuestion" | "quizPainQuestion" | "quizFrequencyQuestion";
  options: { id: TId; labelKey: Parameters<typeof t>[0] }[];
  onSelect: (id: TId) => void;
}) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 30, color: Colors.ink, lineHeight: 38, marginBottom: 28 }}>
        {t(questionKey)}
      </Text>
      <View style={{ gap: 10 }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 18,
              paddingVertical: 16,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 14, color: Colors.ink, flex: 1, paddingRight: 12 }}>
              {t(opt.labelKey)}
            </Text>
            <Feather name="chevron-right" size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── Discover: personalized recap ─────────────────────────────────────────────

function DiscoverRecap({ answers, onContinue }: { answers: QuizAnswers; onContinue: () => void }) {
  const closet = t(CLOSET_SHORT_KEYS[answers.closetSize ?? "medium"]);
  const style = t(STYLE_SHORT_KEYS[answers.style ?? "minimalist"]);
  const pain = t(PAIN_SHORT_KEYS[answers.painPoint ?? "unknown"]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center" }}>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          {t("recapHeadline")}
        </Text>
        <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 30, color: Colors.ink, lineHeight: 40 }}>
          {t("recapSentence", { closet, style, pain })}
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12 }}>
        <TouchableOpacity
          onPress={onContinue}
          style={{ backgroundColor: Colors.ink, paddingVertical: 18, alignItems: "center", borderRadius: 100 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 18, color: Colors.cream }}>
            {t("continueCta")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const { user } = useUserStore();
  const { addItem } = useItemStore();
  const symbol = useCurrencyStore((s) => s.symbol);

  // step 0 = discover (intro + quiz + recap), 1 = "THE HOOK", 2 = "THE MATH"
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [discoverSub, setDiscoverSub] = useState<DiscoverSub>("intro");
  const [answers, setAnswers] = useState<QuizAnswers>({});

  // form
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savedName, setSavedName] = useState("");
  const [savedPrice, setSavedPrice] = useState(0);

  const goNextSub = () => {
    const idx = DISCOVER_ORDER.indexOf(discoverSub);
    const next = DISCOVER_ORDER[idx + 1];
    if (next) setDiscoverSub(next);
  };

  const goPrevSub = () => {
    const idx = DISCOVER_ORDER.indexOf(discoverSub);
    const prev = DISCOVER_ORDER[idx - 1];
    if (prev) setDiscoverSub(prev);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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
    setStep(2);
  };

  const openCloset = async () => {
    posthog.capture(Events.ONBOARDING_STEP, { step: 3, action: "complete" });
    await completeOnboarding();
    router.replace("/(app)");
  };

  // ─── STEP 2/4: DISCOVER ────────────────────────────────────────────────────
  if (step === 0) {
    const subIndex = DISCOVER_ORDER.indexOf(discoverSub);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
        <ProgressBar filled={2} total={4} />
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", paddingHorizontal: 24, paddingBottom: 16 }}>
          {t("step1DiscoverLabel")}
        </Text>

        {subIndex > 0 && <BackButton onPress={goPrevSub} />}
        <SubDots index={subIndex} total={DISCOVER_ORDER.length} />

        {discoverSub === "intro" && <DiscoverIntro onContinue={goNextSub} />}
        {discoverSub === "style" && (
          <QuizScreen
            questionKey="quizStyleQuestion"
            options={STYLE_OPTIONS}
            onSelect={(id) => { setAnswers((a) => ({ ...a, style: id })); goNextSub(); }}
          />
        )}
        {discoverSub === "closet" && (
          <QuizScreen
            questionKey="quizClosetQuestion"
            options={CLOSET_OPTIONS}
            onSelect={(id) => { setAnswers((a) => ({ ...a, closetSize: id })); goNextSub(); }}
          />
        )}
        {discoverSub === "pain" && (
          <QuizScreen
            questionKey="quizPainQuestion"
            options={PAIN_OPTIONS}
            onSelect={(id) => { setAnswers((a) => ({ ...a, painPoint: id })); goNextSub(); }}
          />
        )}
        {discoverSub === "frequency" && (
          <QuizScreen
            questionKey="quizFrequencyQuestion"
            options={FREQUENCY_OPTIONS}
            onSelect={(id) => { setAnswers((a) => ({ ...a, frequency: id })); goNextSub(); }}
          />
        )}
        {discoverSub === "recap" && <DiscoverRecap answers={answers} onContinue={() => setStep(1)} />}
      </SafeAreaView>
    );
  }

  // ─── STEP 3/4: THE HOOK ──────────────────────────────────────────────────────
  if (step === 1) {
    const namePlaceholder = t(NAME_PLACEHOLDER_KEYS[answers.style ?? "minimalist"]);
    const hookHint = answers.painPoint ? t(HOOK_HINT_KEYS[answers.painPoint]) : null;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
        <ProgressBar filled={3} total={4} />

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
            <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 38, color: Colors.ink, lineHeight: 46, marginBottom: 12 }}>
              {t("guiltPieceHeadline")}
              <Text style={{ color: Colors.cpw }}>{t("guiltPieceAccent")}</Text>
            </Text>
            {hookHint && (
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 14, color: Colors.cpw, lineHeight: 20, marginBottom: 16 }}>
                {hookHint}
              </Text>
            )}
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
                <Image source={{ uri: imageUri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
              ) : (
                <View style={{ alignItems: "center", gap: 10 }}>
                  <Feather name="camera" size={32} color="rgba(255,255,255,0.55)" />
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: 2, textTransform: "uppercase" }}>
                      {t("tapToAddPhoto")}
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
                placeholder={namePlaceholder}
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
              <Text style={labelStyle}>{t("costBasisLabel", { symbol })}</Text>
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

  // ─── STEP 4/4: THE MATH ──────────────────────────────────────────────────────
  const displayName = savedName.toLowerCase();
  const mathHint = answers.frequency ? t(MATH_FREQ_KEYS[answers.frequency]) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      <ProgressBar filled={4} total={4} />

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
          The {displayName}{"\n"}cost {symbol}{savedPrice % 1 === 0 ? savedPrice : savedPrice.toFixed(2)}.
        </Text>

        {/* Table header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
            {t("everyWearDrops")}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1.5, textTransform: "uppercase" }}>
            {t("cpwCol")}
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
                  {formatCpw(cpw, symbol)}
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
        {mathHint && (
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.muted, lineHeight: 20, marginTop: 12 }}>
            {mathHint}
          </Text>
        )}
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
