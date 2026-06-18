import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";
import { DashedLine } from "@/components/ui/DashedLine";
import { TIERS } from "@/constants/config";
import { useCurrencyStore } from "@/store/currencyStore";
import { t } from "@/lib/i18n";

function Section({ title, body }: { title?: string; body: string }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
      {title && (
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
          {title}
        </Text>
      )}
      <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.ink, lineHeight: 21 }}>
        {body}
      </Text>
    </View>
  );
}

export default function About() {
  const router = useRouter();
  const symbol = useCurrencyStore((s) => s.symbol);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top"]}>
      {/* Nav bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 1 }}>
            {"< "}{t("back")}
          </Text>
        </TouchableOpacity>
        <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2.5, textTransform: "uppercase" }}>
          {t("aboutHeader")}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      <DashedLine />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 36, color: Colors.ink, lineHeight: 42 }}>
            {t("aboutTitle")}
          </Text>
        </View>

        <Section body={t("aboutIntro")} />
        <DashedLine />

        <Section title={t("aboutFormulaTitle")} body={t("aboutFormulaBody", { symbol })} />
        <DashedLine />

        {/* Tier ladder */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            {t("aboutTiersTitle")}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.ink, lineHeight: 21, marginBottom: 16 }}>
            {t("aboutTiersBody")}
          </Text>

          {TIERS.map((tier, i) => (
            <View key={tier.name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: Colors.border, borderStyle: "dashed" }}>
              <Text style={{ fontFamily: "InstrumentSerif_400Regular_Italic", fontSize: 16, color: Colors.ink, textTransform: "capitalize" }}>
                {tier.name}
              </Text>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cpw }}>
                {tier.maxCpw === Infinity ? `> ${symbol}80/wear` : `≤ ${symbol}${tier.maxCpw}/wear`}
              </Text>
            </View>
          ))}
        </View>
        <DashedLine />

        <Section title={t("aboutProfitableTitle")} body={t("aboutProfitableBody")} />
        <DashedLine />

        <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            {t("aboutGlossaryTitle")}
          </Text>
          {t("aboutGlossaryBody", { symbol }).split("\n").map((line, i) => {
            const [term, ...rest] = line.split(" — ");
            return (
              <View key={i} style={{ marginBottom: 10 }}>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1, textTransform: "uppercase" }}>
                  {term}
                </Text>
                <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 13, color: Colors.ink, lineHeight: 19, marginTop: 2 }}>
                  {rest.join(" — ")}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
