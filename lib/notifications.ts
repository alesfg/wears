import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getTier } from "@/constants/config";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleTierMilestoneNotification(
  itemName: string,
  cpw: number,
  wears: number
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;

    const tier = getTier(cpw);
    const tierMessages: Partial<Record<ReturnType<typeof getTier>, string>> = {
      workhorse:      `${itemName} just hit Workhorse. ${wears} wears, $${cpw.toFixed(2)}/wear.`,
      normal:         `${itemName} dropped to Normal tier — $${cpw.toFixed(2)}/wear.`,
      "free basically": `${itemName} is basically free — $${cpw.toFixed(2)}/wear. 🌸`,
    };

    const body = tierMessages[tier];
    if (!body) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Tier unlocked ★",
        body,
        data: {},
      },
      trigger: null, // immediate
    });
  } catch { /* silently skip if notifications unavailable */ }
}

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("wears", {
      name: "Wears",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

const DAILY_REMINDER_ID = "daily-wear-reminder";
export const DAILY_REMINDER_HOUR = 20;
export const DAILY_REMINDER_MINUTE = 0;

export async function scheduleDailyReminder(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: "What are you wearing today?",
      body: "Log it before you forget — every wear drops your cost per wear.",
      data: {},
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: DAILY_REMINDER_HOUR,
      minute: DAILY_REMINDER_MINUTE,
    },
  });
  return true;
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
}
