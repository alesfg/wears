import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Colors } from "@/constants/theme";
import { DashedLine } from "@/components/ui/DashedLine";
import { posthog, Events } from "@/lib/posthog";

const ONBOARDING_KEY = "@wears/onboarding_complete";

const STEPS = [
  {
    step: "01 / 02",
    eyebrow: "THE MATH IS SIMPLE",
    title: "Every wear\nlowers the price.",
    body: "A $200 jacket worn once costs $200/wear.\nWorn 10 times? $20/wear.\nWorn 100 times? $2/wear.\n\nThat's not spending. That's investing.",
    cta: "I GET IT",
    cpw: "$2.00",
    label: "after 100 wears",
  },
  {
    step: "02 / 02",
    eyebrow: "READY TO START",
    title: "Add your\nfirst piece.",
    body: "Pick anything from your closet. A jacket, a bag, a pair of jeans. Add the price you paid and start logging wears.",
    cta: "ADD FIRST ITEM",
    cpw: "$—",
    label: "cost per wear",
  },
];

async function completeOnboarding() {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_KEY);
  return v === "true";
}

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const advance = async () => {
    posthog.capture(Events.ONBOARDING_STEP, { step: step + 1 });
    if (step === 0) {
      setStep(1);
    } else {
      await completeOnboarding();
      router.replace("/(app)");
      setTimeout(() => router.push("/modal/add-item"), 600);
    }
  };

  const skip = async () => {
    await completeOnboarding();
    router.replace("/(app)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.cream }} edges={["top", "bottom"]}>
      <View style={{ flex: 1, paddingHorizontal: 28, paddingTop: 40, paddingBottom: 32, justifyContent: "space-between" }}>

        {/* Top: step + headline */}
        <View>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>
            {current.step}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.cpw, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
            {current.eyebrow}
          </Text>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 36, color: Colors.ink, lineHeight: 42, marginBottom: 24 }}>
            {current.title}
          </Text>
          <DashedLine marginVertical={0} />
        </View>

        {/* Middle: CPW hero + body */}
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={{ fontFamily: "InstrumentSerif_400Regular", fontSize: 72, color: Colors.cpw, letterSpacing: -1 }}>
            {current.cpw}
          </Text>
          <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 9, color: Colors.muted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 28 }}>
            {current.label}
          </Text>
          <DashedLine marginVertical={0} />
          <View style={{ paddingTop: 20, width: "100%" }}>
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 12, color: Colors.ink, lineHeight: 22, letterSpacing: 0.3 }}>
              {current.body}
            </Text>
          </View>
        </View>

        {/* Bottom: CTAs + dots */}
        <View style={{ gap: 12 }}>
          {/* Progress dots */}
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  backgroundColor: i === step ? Colors.ink : Colors.border,
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={advance}
            style={{ backgroundColor: Colors.ink, paddingVertical: 16, alignItems: "center" }}
            activeOpacity={0.85}
          >
            <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 11, color: Colors.cream, letterSpacing: 2, textTransform: "uppercase" }}>
              {current.cta}
            </Text>
          </TouchableOpacity>

          {step === 1 && (
            <TouchableOpacity onPress={skip} style={{ paddingVertical: 14, alignItems: "center" }}>
              <Text style={{ fontFamily: "DMSans_400Regular", fontSize: 10, color: Colors.muted, letterSpacing: 1 }}>
                Skip for now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
