// Local appointment reminders via expo-notifications.
//
// Schedules an on-device notification ~1h before an appointment (or immediately
// if the appointment is sooner than that). Entirely best-effort: any failure
// (permission denied, unsupported platform/Expo Go limitation) is swallowed so
// it never breaks the booking flow. Server-side push can be layered on later.

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

let configured = false;

async function ensureSetup(): Promise<boolean> {
  try {
    if (!configured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("reminders", {
          name: "Rappels de RDV",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      configured = true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

const REMINDER_LEAD_MS = 60 * 60 * 1000; // 1 hour before

// Schedules a reminder for an appointment. Returns the notification id or null.
export async function scheduleAppointmentReminder(input: {
  startAt: string;
  businessName?: string;
  serviceName?: string;
}): Promise<string | null> {
  const granted = await ensureSetup();
  if (!granted) return null;

  const start = new Date(input.startAt).getTime();
  const fireAt = start - REMINDER_LEAD_MS;
  const now = Date.now();
  // Don't schedule reminders for past appointments.
  if (start <= now) return null;
  const seconds = Math.max(5, Math.round((fireAt - now) / 1000));

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rappel de rendez-vous ⏰",
        body: `${input.serviceName ?? "Votre RDV"}${input.businessName ? ` chez ${input.businessName}` : ""} bientôt.`,
      },
      trigger: { seconds, channelId: "reminders" } as Notifications.TimeIntervalTriggerInput,
    });
  } catch {
    return null;
  }
}
