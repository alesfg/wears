import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="item/[id]" />
      <Stack.Screen name="watchlist/[id]" />
      <Stack.Screen name="day/[ds]" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
