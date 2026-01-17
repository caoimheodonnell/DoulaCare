/*
  How this was adapted (from MyBookingsScreen - doula version):
  - Switched data source:
      - Uses GET /bookings/by-mother/{mother_id} instead of /bookings/by-doula/{id}
      - Cards show the doula_name instead of mother_name
  - Removed doula-only actions:
      - No Accept / Decline buttons (mothers cannot update booking status)
      - No updateStatus() logic in this version
  - Calendar and filtering:
      - Kept the same react-native-calendars monthly view
      - Marks only the mother's confirmed bookings as dots (same pattern)
      - Tapping a date filters the list below, just like the doula screen
  - Notifications:
      - When a booking is confirmed (handled by the doula’s screen)
        this screen schedules reminders using scheduleBookingReminder()

  References used:
  - React Native (official docs):
      - View/Text:           https://reactnative.dev/docs/view
                             https://reactnative.dev/docs/text
      - FlatList:            https://reactnative.dev/docs/flatlist
      - TouchableOpacity:    https://reactnative.dev/docs/touchableopacity
      - ActivityIndicator:   https://reactnative.dev/docs/activityindicator
      - Alert:               https://reactnative.dev/docs/alert
      - Platform:            https://reactnative.dev/docs/platform
      - Handling touches:    https://reactnative.dev/docs/handling-touches
  - Calendar:
       - react-native-calendars -// https://www.youtube.com/watch?v=zaDr6_mYPNA
      - YouTube idea for marked dates/filtering:
        https://www.youtube.com/watch?v=zaDr6_mYPNA
  - Notifications:
      - Expo local notifications pattern:
        https://dev.to/walter_bloggins/local-notifications-in-expo-2p47
      - Fixed my notification duplication error - https://chatgpt.com/c/691ee73a-9c1c-832c-aeae-c59f11e9b133
*/


import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Calendar } from "react-native-calendars";
import api from "../api";
import * as Notifications from "expo-notifications";
import {
  scheduleBookingReminder,
  requestNotificationPermission,
} from "../notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseClient";




const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

// Same helper as MyBookingsScreen: shows an alert on native, window.alert on web
function showMessage(title, message) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

const NOTIFIED_KEY = "mother_notified_booking_ids";

async function getNotifiedIds() {
  const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function addNotifiedIds(newIds) {
  const existing = await getNotifiedIds();
  const merged = Array.from(new Set([...existing, ...newIds]));
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(merged));
}

export default function MotherBookingsScreen() {
  const [motherId, setMotherId] = React.useState(null);

  const [loading, setLoading] = React.useState(true);
  const [bookings, setBookings] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [markedDates, setMarkedDates] = React.useState({});
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [filteredBookings, setFilteredBookings] = React.useState([]);

  // Remember previous bookings so we can detect newly-confirmed ones in-session
  const prevBookingsRef = React.useRef([]);

  // Tracks which booking is currently opening Stripe
  const [payingBookingId, setPayingBookingId] = React.useState(null);




 // Build marks for the calendar
 // Simlar to Youtube video except i built my own marked dates -https://www.youtube.com/watch?v=zaDr6_mYPNA
 // Very similar to buildMarkedDates in MyBookingsScreen:
 // loops over bookings
 // only marks confirmed bookings as dots
 // always selects "today" by default to show how close the appointment is

  const buildMarkedDates = (data) => {
    const marks = {};

    (data || []).forEach((b) => {
      if (!b.starts_at) return;
      if (b.status !== "confirmed" && b.status !== "paid") return;

      const d = new Date(b.starts_at);
      const key = d.toISOString().slice(0, 10);
      marks[key] = {
        ...(marks[key] || {}),
        marked: true,
        dotColor: COLORS.primary,
      };
    });

    const todayKey = new Date().toISOString().slice(0, 10);
    marks[todayKey] = {
      ...(marks[todayKey] || {}),
      selected: true,
      selectedColor: COLORS.primary,
    };

    setMarkedDates(marks);
  };



 // Load bookings for this mother from the backend
   // This is the mother-equivalent of loadBookings in MyBookingsScreen:
 // MyBookingsScreen: GET /bookings/by-doula/{doulaId}
 // MotherBookingsScreen: GET /bookings/by-mother/{motherId}/details
 // Adapted from the MDN fetch() POST example — same idea of sending JSON in a POST request,
 // but implemented with Axios, which handles headers and JSON.stringify automatically.-https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#uploading_json_data
 // fixewd my notifiacaiton duplication errro https://chatgpt.com/c/691ee73a-9c1c-832c-aeae-c59f11e9b133

  const loadBookings = async () => {
    try {
      setLoading(true);

      if (!motherId) return;

      // safe here (motherId exists)
      console.log("Fetching:", `/bookings/by-mother-auth/${motherId}/details`);

      const { data } = await api.get(
        `/bookings/by-mother-auth/${motherId}/details`
      );
      const list = data || [];

      const prev = prevBookingsRef.current;

      // 1) already-notified IDs from storage
      const notifiedIds = (await getNotifiedIds()).map(String);

      // 2) detect newly confirmed this session
      const newlyConfirmed = list.filter((b) => {
  if (!b.starts_at) return false;
  if (b.status !== "confirmed") return false;

  const id = String(b.booking_id);

  // Notify once per booking if we have never notified it before
  return !notifiedIds.includes(id);
});


      // 3) schedule notifications for newly confirmed
      for (const b of newlyConfirmed) {
        const startsAt = new Date(b.starts_at);
        const doulaName = b.doula_name || "your doula";

        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Booking confirmed",
              body: `Your booking with ${doulaName} has been confirmed.`,
              data: { startsAt: startsAt.toISOString() },
            },
            trigger: null,
          });
        } catch (e) {
          console.warn("Immediate notification failed", e);
        }

        try {
          await scheduleBookingReminder(startsAt, doulaName);
        } catch (e) {
          console.warn("Reminder notifications failed", e);
        }
      }

      // 4) mark notified so we don’t repeat
      if (newlyConfirmed.length > 0) {
        await addNotifiedIds(newlyConfirmed.map((b) => String(b.booking_id)));

      }

      // update state
      setBookings(list);
      buildMarkedDates(list);

      if (selectedDate) {
        const matches = list.filter((b) => {
          if (!b.starts_at) return false;
          const d = new Date(b.starts_at).toISOString().slice(0, 10);
          return d === selectedDate;
        });
        setFilteredBookings(matches);
      }

      prevBookingsRef.current = list;
    } catch (err) {
      console.error("Load bookings error", err);
      const detail =
        err?.response?.data?.detail || err?.message || "Failed to load bookings.";
      showMessage("Error", String(detail));
    } finally {
      setLoading(false);
    }
  };

  // Load mother auth id (UUID) from Supabase session
  React.useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;
      if (user) setMotherId(user.id); // UUID string
      else setMotherId(null);
    };
    loadUser();
  }, []);

  //  only load bookings AFTER motherId exists
  React.useEffect(() => {
    if (motherId) loadBookings();
  }, [motherId]);

  // notifications permission once
  React.useEffect(() => {
    requestNotificationPermission().catch((e) =>
      console.warn("Notification permission error", e)
    );
  }, []);

  // When a day is tapped, filter bookings for that date
  const filterForDate = (dateString) => {
  // Tap same date again = clear selection
  if (selectedDate === dateString) {
    setSelectedDate(null);
    setFilteredBookings([]);

    // rebuild marks (dots + today highlight only)
    buildMarkedDates(bookings);
    return;
  }

  // normal selection
  setSelectedDate(dateString);

  const matches = bookings.filter((b) => {
    if (!b.starts_at) return false;
    const d = new Date(b.starts_at).toISOString().slice(0, 10);
    return d === dateString;
  });

  setFilteredBookings(matches);

  // Clear previous selected flags, keep dots, then select ONLY this date
  setMarkedDates((prev) => {
    const updated = {};

    Object.keys(prev).forEach((k) => {
      const { selected, selectedColor, ...rest } = prev[k];
      updated[k] = rest; // keep dot marks etc, remove selection
    });

    updated[dateString] = {
      ...(updated[dateString] || {}),
      selected: true,
      selectedColor: COLORS.primary,
    };

    return updated;
  });
};


  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };
/*
 Stripe checkout flow (Mother):
 - Only allowed after booking is confirmed by the doula
 - Calls backend POST /payments/checkout with { booking_id }
 - Backend returns Stripe Checkout URL
 - We open that URL using React Native Linking


 References:
 - React Native Linking (open external URLs):
   https://reactnative.dev/docs/linking
 - Axios POST (your api wrapper):
   https://axios-http.com/docs/post_example
*/

  const startCheckout = async (bookingId) => {
    try {
      setPayingBookingId(bookingId);

      const res = await api.post("/payments/checkout", {
        booking_id: bookingId,
      });

      const url = res?.data?.url;
      if (!url) throw new Error("No checkout URL returned from backend.");

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) throw new Error("Cannot open Stripe checkout URL.");

      await Linking.openURL(url);

      showMessage(
        "Stripe Checkout opened",
        "Complete payment in the browser, then return to the app."
      );
    } catch (err) {
      console.error("Checkout error", err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to start payment.";
      showMessage("Payment error", String(detail));
    } finally {
      setPayingBookingId(null);
    }
  };

   // Show a single booking card for the mother
 // This corresponds to renderBooking in MyBookingsScreen, but:
 // title = doula_name instead of mother_name
 // no Accept/Decline buttons (mother cannot change status)
 // Show a single booking card for the mother
// title = doula_name instead of mother_name
// no Accept/Decline buttons (mother cannot change status)

  const renderBooking = ({ item }) => {
    const starts = item.starts_at ? new Date(item.starts_at) : null;
    const ends = item.ends_at ? new Date(item.ends_at) : null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.doula_name || "Your doula"}</Text>

        <Text style={styles.cardText}>
          {starts ? `Starts: ${starts.toLocaleString()}` : "Starts: (missing date)"}
        </Text>

        <Text style={styles.cardText}>
          {ends ? `Ends: ${ends.toLocaleString()}` : "Ends: (missing date)"}
        </Text>

        <Text style={styles.cardText}>Mode: {item.mode}</Text>

        <Text style={[styles.status, styles[`status_${item.status}`]]}>
          {item.status === "paid"
            ? "Confirmed — Paid"
            : item.status === "confirmed"
            ? "Confirmed — payment due"
            : `Status: ${item.status}`}
        </Text>

        {item.status === "confirmed" && (
          <TouchableOpacity
            style={[
              styles.payButton,
              payingBookingId === item.booking_id && { opacity: 0.6 },
            ]}
            disabled={payingBookingId === item.booking_id}
            onPress={() => startCheckout(item.booking_id)}
          >
            <Text style={styles.payButtonText}>
              {payingBookingId === item.booking_id
                ? "Opening Stripe..."
                : "Pay Now"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8, color: COLORS.text }}>
          Loading bookings…
        </Text>
      </View>
    );
  }

  const listData = selectedDate ? filteredBookings : bookings;

  return (
    <View style={styles.container}>
      <Calendar
        style={styles.calendar}
        markedDates={markedDates}
        theme={{
          backgroundColor: COLORS.background,
          calendarBackground: COLORS.white,
          selectedDayBackgroundColor: COLORS.primary,
          selectedDayTextColor: COLORS.white,
          todayTextColor: COLORS.primary,
          dayTextColor: COLORS.text,
          arrowColor: COLORS.primary,
          monthTextColor: COLORS.accent,
        }}
        onDayPress={(day) => filterForDate(day.dateString)}
      />

      {selectedDate && (
        <Text style={styles.selectedDateLabel}>
          Showing bookings for {selectedDate}
        </Text>
      )}

      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.booking_id)}
        renderItem={renderBooking}
        contentContainerStyle={{ padding: 16 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: COLORS.text }}>
            {selectedDate ? "No bookings for this day." : "No bookings yet."}
          </Text>
        }
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  calendar: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  selectedDateLabel: {
    marginHorizontal: 16,
    marginBottom: 4,
    color: COLORS.accent,
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  status: {
    marginTop: 6,
    fontWeight: "700",
  },
  status_requested: { color: "#c47f00" },
  status_confirmed: { color: "green" },
  status_declined: { color: "red" },
  status_cancelled: { color: "#666" },

  payButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  payButtonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  paidText: {
    marginTop: 8,
    fontWeight: "700",
    color: "green",
  },
});

