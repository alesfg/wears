import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useWatchlistStore } from "@/store/watchlistStore";
import { useUserStore } from "@/store/userStore";
import { useCurrencyStore } from "@/store/currencyStore";
import { DashedLine } from "@/components/ui/DashedLine";
import { Colors } from "@/constants/theme";
import { CATEGORIES } from "@/constants/config";
import { t } from "@/lib/i18n";
import { posthog, Events } from "@/lib/posthog";

type Category = (typeof CATEGORIES)[number];

const SWATCH_COLORS = [
  "#2A2018",
  "#1E1810",
  "#C4A882",
  "#2A3F5C",
  "#C8B8E8",
  "#5C5347",
  "#8A8070",
  "#C4503A",
];

export default function AddWatchlistItem() {
  const router = useRouter();
  const { user } = useUserStore();
  const { addItem } = useWatchlistStore();
  const symbol = useCurrencyStore((s) => s.symbol);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [projectedWears, setProjectedWears] = useState("50");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      setError(t("validPrice"));
      return;
    }
    if (!user?.id) return;

    const parsedWears = parseInt(projectedWears, 10);

    setLoading(true);
    setError(null);

    const imageColor = SWATCH_COLORS[Math.floor(Math.random() * SWATCH_COLORS.length)];

    await addItem(
      {
        name: name.trim(),
        brand: brand.trim(),
        price: parsedPrice,
        category: category,
        imageColor,
        projectedWears: isNaN(parsedWears) || parsedWears <= 0 ? 50 : parsedWears,
        note: note.trim(),
      },
      user.id
    );

    setLoading(false);
    posthog.capture(Events.WATCHLIST_ADDED, {
      category: category || "none",
      price: parsedPrice,
    });
    router.back();
  };

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
            {t("newWatchlistItem")}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <DashedLine />

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <Field label={t("itemName")}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. The Row Margaux"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
            />
          </Field>

          {/* Brand */}
          <Field label={t("brand")}>
            <TextInput
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g. The Row"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              autoCapitalize="words"
            />
          </Field>

          {/* Price */}
          <Field label={t("costBasisField", { symbol })}>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              keyboardType="decimal-pad"
            />
          </Field>

          {/* Projected wears */}
          <Field label={t("projectedWearsField")}>
            <TextInput
              value={projectedWears}
              onChangeText={setProjectedWears}
              placeholder="50"
              placeholderTextColor={Colors.muted}
              style={inputStyle}
              keyboardType="number-pad"
            />
          </Field>

          {/* Note */}
          <Field label={t("noteField")}>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t("notePlaceholder")}
              placeholderTextColor={Colors.muted}
              style={inputStyle}
            />
          </Field>

          {/* Category */}
          <View style={{ marginBottom: 24 }}>
            <Field label={t("category")}>
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

          {error && (
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.cpw, marginBottom: 12, letterSpacing: 0.5 }}>
              {error}
            </Text>
          )}

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center", opacity: loading ? 0.6 : 1 }}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cream} />
            ) : (
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
                {t("addToWatchlist")}
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
      <View style={{ marginTop: 6 }}>{children}</View>
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
