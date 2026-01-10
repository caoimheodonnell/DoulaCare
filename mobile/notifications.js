
/*
 /*
  notifications.ts — local notification helpers for bookings

  Main reference used:
    “Local Notifications in Expo” by Walter_Bloggins
    https://dev.to/walter_bloggins/local-notifications-in-expo-2p47
    (This article explains foreground handlers, requesting permissions,
     and scheduling a simple one-off notification with Expo Notifications)

  What this module does :
    - Sets a global notification handler so alerts display even when the app
      is open (same concept as the article).
    - Wraps permission requests (get to request) just like the reference.
    - But instead of scheduling one sample notification using `{ seconds: 1 }`,
      this module schedules multiple real reminders tied to a booking time

  My additions beyond the refrence:
    - Added `scheduleIfFuture()` so expired times are never scheduled
    - Created two helper functions:
        scheduleBookingReminder  for clients/mothers
        scheduleDoulaBookingReminder for doulas
    - Each booking triggers up to three notifications:
         1 day before
         1 hour before
         15 minutes before
    - Generates dynamic text with names and the actual appointment time
    - Passes a real Date object to the notification trigger instead of using
      seconds-based triggers

  Notes:
    - These are local notifications, not Expo push notifications.
      No push tokens or backend service is used.
    - All scheduling happens purely on the device via
      `Notifications.scheduleNotificationAsync()`.

  Additional references:
    Expo Notifications (API Docs)
    https://docs.expo.dev/versions/latest/sdk/notifications/
*/
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// same idea as the reference show a visible alert
// Controls how notifications appear while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Ask for permission (on iOS it will show the OS popup)
// Similar to the article - Notifications.requestPermissionsAsync()
export async function requestNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === "granted";
  }
  return true;
}

/*
I do the same thing but instead of a one-off “test notification” with
     `seconds: 1` I schedule multiple reminders based on a real booking time

  What I added:
     - A helper `scheduleIfFuture` so don't schedule anything in the past
     - Three different reminder times: 1 day, 1 hour and 15 minutes before
     - Dynamic text using the doula’s name and the actual `startsAt` date
*/
// permision for notifications
export async function scheduleBookingReminder(startsAt, doulaName) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const now = new Date();
  const name = doulaName || "your doula";

  // Helper: schedule notification only if the trigger time is in the future
    /*
       In the article they schedule exactly ONE notification so they don’t
       need a helper. Here I schedule three different times so a helper keeps
       the code clean and ensures we never schedule notifications in the past.
  */
  async function scheduleIfFuture(triggerDate, body) {
    if (triggerDate <= now) return; // don't schedule notifications in the past
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Doula appointment",
        body,
        data: { startsAt: startsAt.toISOString() },
      },
      trigger: triggerDate,
    });
  }

  // 1 day before
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneDayBefore = new Date(startsAt.getTime() - oneDayMs);
  await scheduleIfFuture(
    oneDayBefore,
    `You have an appointment with ${name} tomorrow.`
  );

  // 1 hour before
  const oneHourMs = 60 * 60 * 1000;
  const oneHourBefore = new Date(startsAt.getTime() - oneHourMs);
  await scheduleIfFuture(
    oneHourBefore,
    `You have an appointment with ${name} in 1 hour.`
  );

  // 15 minutes before
  const fifteenMinutesMs = 15 * 60 * 1000;
  const fifteenMinutesBefore = new Date(startsAt.getTime() - fifteenMinutesMs);
  await scheduleIfFuture(
    fifteenMinutesBefore,
    `You have an appointment with ${name} in 15 minutes.`
  );
}


// for doulas notfications exacts same as mother
export async function scheduleDoulaBookingReminder(startsAt, motherName) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const now = new Date();
  const name = motherName || "a client";

  async function scheduleIfFuture(triggerDate, body) {
    if (triggerDate <= now) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Upcoming booking",
        body,
        data: { startsAt: startsAt.toISOString() },
      },
      trigger: triggerDate,
    });
  }

  // 1 day before
  // javascript wokrs in milleseconds
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneDayBefore = new Date(startsAt.getTime() - oneDayMs);
  await scheduleIfFuture(
    oneDayBefore,
    `You have a booking with ${name} tomorrow.`
  );

  // 1 hour before
  const oneHourMs = 60 * 60 * 1000;
  const oneHourBefore = new Date(startsAt.getTime() - oneHourMs);
  await scheduleIfFuture(
    oneHourBefore,
    `You have a booking with ${name} in 1 hour.`
  );

  // 15 minutes before
  const fifteenMinutesMs = 15 * 60 * 1000;
  const fifteenMinutesBefore = new Date(
    startsAt.getTime() - fifteenMinutesMs
  );
  await scheduleIfFuture(
    fifteenMinutesBefore,
    `You have a booking with ${name} in 15 minutes.`
  );
}
