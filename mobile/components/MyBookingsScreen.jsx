/*
  (MyBookingsScreen.jsx) — Doula view of all booking requests and accept and decline

  How this was adapted / designed:
  - Inspired by my AddUserFormMobile pattern:
      - Uses local React state for form-like data (bookings, loading, refreshing)
      - Uses a backend API layer (api.get / api.post) instead of hard-coded data
  - Calendar:
      - Uses `react-native-calendars` <Calendar> to show a monthly view
      - Each confirmed booking date is marked with a dot
      - When the doula taps a day, the list below filters to only that date
  - Bookings:
      - Data is loaded from the backend endpoint:
          GET /bookings/by-doula/{doula_id}
        which returns bookings with mother_name, location, starts_at, ends_at, etc
  - Status actions:
      - For bookings in "requested" status, the doula can:
          - Accept - sets status to "confirmed"
          - Decline - sets status to "declined"- using for on press button https://reactnative.dev/docs/handling-touches
      - After an Accept, it triggers:
          - An immediate notification (using expo-notifications) to simulate
            notifying the mother
          - Scheduled reminders before the booking time via scheduleBookingReminder()
  - Cross-platform feedback:
      - Uses Alert on native and window.alert on web to show errors / success messages

  References:
  - React Native Docs:
      - View/Text:         https://reactnative.dev/docs/view, https://reactnative.dev/docs/text
      - FlatList:          https://reactnative.dev/docs/flatlist
      - TouchableOpacity:  https://reactnative.dev/docs/touchableopacity
      - ActivityIndicator: https://reactnative.dev/docs/activityindicator
      - Alert:             https://reactnative.dev/docs/alert
      - Platform:          https://reactnative.dev/docs/platform
      -On Press:           https://reactnative.dev/docs/handling-touches
  - Calendar:
      - react-native-calendars -// https://www.youtube.com/watch?v=zaDr6_mYPNA
      - gets date and time to strng - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
  - Notifications:
      - notifications: https://dev.to/walter_bloggins/local-notifications-in-expo-2p47
    -Update Booking Status and load bookings - https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#uploading_json_data
*/
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { scheduleDoulaBookingReminder } from "../notifications"; // notification to mother when booking is accepted
import api from "../api";
import { supabase } from "../supabaseClient";


const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

// Simple helper to show errors/info on both native and web
function showMessage(title, message) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}


  // route.params?.doulaId comes from navigation (Home menu "My Bookings").
export default function MyBookingsScreen() {
  const route = useRoute();
  const [doulaId, setDoulaId] = React.useState(null);

  React.useEffect(() => {
  const loadUser = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;
    if (user) setDoulaId(user.id); // Supabase UUID
  };
  loadUser();
}, []);


// Local component state (React Hooks)
  const [loading, setLoading] = React.useState(true);
  const [bookings, setBookings] = React.useState([]); // all bookings from backend
  const [refreshing, setRefreshing] = React.useState(false); // pull-to-refresh state
  const [markedDates, setMarkedDates] = React.useState({}); // dates highlighted on calendar
  const [selectedDate, setSelectedDate] = React.useState(null); // string "YYYY-MM-DD"
  const [filteredBookings, setFilteredBookings] = React.useState([]); // bookings for clicked day

    // Build the object used by react-native-calendars to show dots / selected days
    // Simlar to Youtube video except i built my own marked dates -https://www.youtube.com/watch?v=zaDr6_mYPNA
  const buildMarkedDates = (data) => {
    const marks = {};

    (data || []).forEach((b) => {
      if (!b.starts_at) return;
      if (b.status !== "confirmed") return; // only confirmed bookings appear as dots

      const d = new Date(b.starts_at);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      // Changed youtube video to get my data from my backend-https://www.youtube.com/watch?v=zaDr6_mYPNA
      // If multiple bookings on same day, we merge settings
      marks[key] = {
        ...(marks[key] || {}),
        marked: true,
        dotColor: COLORS.primary,
      };
    });

    // Always highlight today's date as selected by default
    const todayKey = new Date().toISOString().slice(0, 10);
    marks[todayKey] = {
      ...(marks[todayKey] || {}),
      selected: true,
      selectedColor: COLORS.primary,
    };

    setMarkedDates(marks);
  };

    // Load bookings for this doula from the backend
  // Endpoint: GET /bookings/by-doula/{doula_id}
  // Adapted from the MDN fetch() POST example - same idea of sending JSON in a POST request,
  // but implemented with Axios, which handles headers and JSON.stringify automatically.-https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#uploading_json_data
  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/bookings/by-doula-auth/${doulaId}`)

      const list = data || [];
      setBookings(list);
      buildMarkedDates(list); // update calendar dots

      // if a date is already selected, re-filter for that date
      if (selectedDate) {
        const matches = list.filter((b) => {
          if (!b.starts_at) return false;
          const d = new Date(b.starts_at).toISOString().slice(0, 10);
          return d === selectedDate;
        });
        setFilteredBookings(matches);
      }
    } catch (err) {
      console.error("Load bookings error", err);
      showMessage("Error", err?.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  // When doulaId changes (or first mount), fetch bookings
 React.useEffect(() => {
  if (doulaId) loadBookings();
}, [doulaId]);

  // When a date is tapped on the calendar, filter the list below
  // filtering my bookigns for date selected -https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
  // Based on Array.filter(): only keep bookings whose date matches selectedDate
  //  Added custom logic: check b.starts_at, convert to ISO date and  then compare
  const filterForDate = (dateString) => {
  // 1. If the user taps the SAME date again, clear the selection
  if (selectedDate === dateString) {
    setSelectedDate(null);
    setFilteredBookings([]);

    // Rebuild calendar marks (dots for confirmed bookings, no selected day)
    buildMarkedDates(bookings);
    return;
  }

  // 2. Normal case: user selects a NEW date
  setSelectedDate(dateString);

  const matches = bookings.filter((b) => {
    if (!b.starts_at) return false;
    const d = new Date(b.starts_at).toISOString().slice(0, 10);
    return d === dateString;
  });

  setFilteredBookings(matches);

  // 3. Clear previous `selected` flags & mark only this date as selected
  setMarkedDates((prev) => {
    const updated = {};

    Object.keys(prev).forEach((k) => {
      const { selected, selectedColor, ...rest } = prev[k];
      updated[k] = rest; // keep dots etc., drop selection
    });

    updated[dateString] = {
      ...(updated[dateString] || {}),
      selected: true,
      selectedColor: COLORS.primary,
    };

    return updated;
  });
};

  // Doula updates booking status: requested to confirmed / declined / cancelled.
  // Backend endpoint: POST /bookings/{booking_id}/status
    // Adapted from the MDN fetch() POST example — same idea of sending JSON in a POST request,
  // but implemented with Axios, which handles headers and JSON.stringify automatically.-https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#uploading_json_data
 const updateStatus = async (booking, status) => {
  try {
    // 1. Update status in backend
    await api.post(`/bookings/${booking.booking_id}/status`, { status });

    // 2. Reload bookings so UI and calendar stay in sync
    await loadBookings();

    // 3. If booking is confirmed, schedule doula reminders
    if (status === "confirmed" && booking.starts_at) {
      const startsAt = new Date(booking.starts_at);
      const motherName = booking.mother_name || "a client";

      try {
        await scheduleDoulaBookingReminder(startsAt, motherName);
      } catch (e) {
        console.warn("Doula reminder notifications failed", e);
      }
    }

    showMessage(
      "Updated",
      status === "confirmed"
        ? "Booking confirmed."
        : status === "declined"
        ? "Booking declined."
        : "Booking updated."
    );
  } catch (err) {
    console.error("Update booking status error", err);
    showMessage("Error", err?.message || "Failed to update booking.");
  }
};




 // Pull-to-refresh handler for FlatList
  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  };

   // Renders a single booking card in the FlatList
  const renderBooking = ({ item }) => {
    const starts = item.starts_at ? new Date(item.starts_at) : null;
    const ends = item.ends_at ? new Date(item.ends_at) : null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {item.mother_name || "Unknown mother"}
        </Text>
        <Text style={styles.cardText}>
          {starts
            ? `Starts: ${starts.toLocaleString()}`
            : "Starts: (missing date)"}
        </Text>
        <Text style={styles.cardText}>
          {ends ? `Ends: ${ends.toLocaleString()}` : "Ends: (missing date)"}
        </Text>
        <Text style={styles.cardText}>Mode: {item.mode}</Text>
        <Text style={[styles.status, styles[`status_${item.status}`]]}>
          Status: {item.status}
        </Text>
        {/* ON press -https://reactnative.dev/docs/handling-touches*/}
        {item.status === "requested" && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => updateStatus(item, "confirmed")}

            >
              <Text style={styles.actionText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn]}
              onPress={() => updateStatus(item, "declined")}
            >
              <Text style={styles.actionText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Initial spinner while loading bookings the first time
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

  // If a date has been selected, show only bookings for that date.
  // Otherwise, show all bookings for the doula.
  const listData = selectedDate ? filteredBookings : bookings;

  return (
    <View style={styles.container}>
      {/* Label below the calendar when a day is selected */}
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
 {/* List of bookings (for either the selected day or all days) */}
      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.booking_id)}
        renderItem={renderBooking}
        contentContainerStyle={{ padding: 16 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text
            style={{ textAlign: "center", marginTop: 20, color: COLORS.text }}
          >
            {selectedDate
              ? "No bookings for this day."
              : "No bookings yet."}
          </Text>
        }
      />
    </View>
  );
}
//https://reactnative.dev/docs/stylesheet- Modified for my booking screen
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
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
  },
  declineBtn: {
    backgroundColor: "#F44336",
  },
  actionText: {
    color: "white",
    fontWeight: "700",
  },
});

