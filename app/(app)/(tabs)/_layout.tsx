import { Tabs, useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Colors } from "@/constants/theme";
import { posthog, Events } from "@/lib/posthog";
import { t } from "@/lib/i18n";

const TAB_HEIGHT = 68;
const CENTER_SIZE = 58;

function tabLabels(): Record<string, string> {
  return {
    index:    t("tabCloset"),
    calendar: t("tabCalendar"),
    wishlist: t("tabWishlist"),
    me:       t("tabMe"),
  };
}

function TabIcon({ name, size, color }: { name: string; size: number; color: string }) {
  if (name === "index")
    return <MaterialCommunityIcons name="hanger" size={size + 2} color={color} />;
  if (name === "calendar") return <Feather name="calendar" size={size} color={color} />;
  if (name === "wishlist") return <Feather name="bookmark" size={size} color={color} />;
  if (name === "me")       return <Feather name="user" size={size} color={color} />;
  return null;
}

function TabItem({
  routeName, focused, onPress,
}: {
  routeName: string; focused: boolean; onPress: () => void;
}) {
  const color = focused ? Colors.ink : Colors.muted;
  const label = tabLabels()[routeName];
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 8 }}
      activeOpacity={0.7}
    >
      <TabIcon name={routeName} size={20} color={color} />
      <Text
        style={{
          fontFamily: "DMSans_400Regular",
          fontSize: 9,
          color,
          letterSpacing: 1.5,
          marginTop: 4,
        }}
      >
        {label}
      </Text>
      {/* Active dot — always in layout so items don't shift */}
      <View
        style={{
          width: 4, height: 4, borderRadius: 2,
          backgroundColor: focused ? Colors.cpw : "transparent",
          marginTop: 3,
        }}
      />
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const TAB_LABELS = tabLabels();

  const visibleRoutes = state.routes.filter((r) => TAB_LABELS[r.name] !== undefined);
  const leftRoutes  = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2, 4);

  const isFocused = (routeName: string) =>
    state.routes[state.index]?.name === routeName;

  const handleTabPress = (routeName: string) => {
    const route = state.routes.find((r) => r.name === routeName);
    if (!route) return;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused(routeName) && !event.defaultPrevented) {
      posthog.capture(Events.TAB_VIEWED, { tab: routeName });
      navigation.navigate(routeName, undefined);
    }
  };

  return (
    <View style={{ backgroundColor: Colors.cream, borderTopWidth: 1, borderTopColor: Colors.border }}>
      <View style={{ flexDirection: "row", height: TAB_HEIGHT, position: "relative" }}>
        {leftRoutes.map((route) => (
          <TabItem
            key={route.key}
            routeName={route.name}
            focused={isFocused(route.name)}
            onPress={() => handleTabPress(route.name)}
          />
        ))}

        {/* Center spacer */}
        <View style={{ flex: 1 }} />

        {rightRoutes.map((route) => (
          <TabItem
            key={route.key}
            routeName={route.name}
            focused={isFocused(route.name)}
            onPress={() => handleTabPress(route.name)}
          />
        ))}

        {/* Center W button — top: -8 makes it poke 8px above the tab border */}
        <View
          style={{
            position: "absolute",
            top: -8,
            left: 0,
            right: 0,
            alignItems: "center",
            pointerEvents: "box-none",
          }}
        >
          <TouchableOpacity
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push("/modal/add-item" as any)}
            style={{
              width: CENTER_SIZE,
              height: CENTER_SIZE,
              borderRadius: CENTER_SIZE / 2,
              backgroundColor: Colors.ink,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.28,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 10,
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                fontFamily: "InstrumentSerif_400Regular_Italic",
                fontSize: 26,
                color: "#FFFFFF",
                lineHeight: 30,
              }}
            >
              W
            </Text>
            <View
              style={{
                position: "absolute",
                top: 3,
                right: 3,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: Colors.cpw,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "DMSans_400Regular",
                  fontSize: 12,
                  color: "#FFFFFF",
                  lineHeight: 14,
                  marginTop: -1,
                }}
              >
                +
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom safe area */}
      <View style={{ height: insets.bottom, backgroundColor: Colors.cream }} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="wishlist" />
      <Tabs.Screen name="me" />
      {/* Stats is a hidden route — still navigable but has no tab button */}
      <Tabs.Screen name="stats" options={{ href: null } as object} />
    </Tabs>
  );
}
