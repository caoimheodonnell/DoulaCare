// components/AdminAnalyticsScreen.jsx
/*
  Purpose:
    - This is the admin “analytics dashboard” screen.
    - It loads summary stats from your FastAPI endpoint:
        GET /admin/analytics
      and displays them in simple “stat cards”.

  How this is similar to other screens:
    - Same loading pattern as PendingDoulasScreen / AdminManageUsersScreen:
        - local state for data and loading
        - fetch on mount (useEffect)
        - pull-to-refresh (RefreshControl)
        - show Alert on error
      This is the same fetch  to setState to render list/cards

    - Similar to  booking screens:
        -  call a backend endpoint (api.get)
        - store the response in state
        - render UI based on whether data exists
      (booking screen is more complex because it filters by date and updates status,
       but the fetch and state and refresh pattern is the same)

  React / React Native concepts used:
    - useState / useEffect hooks:
      https://react.dev/reference/react/useState
      https://react.dev/reference/react/useEffect
    - Layout and text:
      View: https://reactnative.dev/docs/view
      Text: https://reactnative.dev/docs/text
    - Scroll container:
      ScrollView: https://reactnative.dev/docs/scrollview
    - Pressable back button:
      TouchableOpacity: https://reactnative.dev/docs/touchableopacity
    - Pull-to-refresh:
      RefreshControl: https://reactnative.dev/docs/refreshcontrol
    - Error feedback:
      Alert: https://reactnative.dev/docs/alert

  Backend dependency:
    - Expects  FastAPI endpoint /admin/analytics to return:
        total_users, total_mothers, total_doulas, total_admins,
        pending_doulas, verified_doulas,
        total_bookings, bookings_requested, bookings_confirmed, bookings_declined, bookings_cancelled, bookings_paid,
        total_reviews, total_messages

*/

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from "react-native";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

/*
  StatCard component
  - Similar idea to Booking cards:
    it receives props (title/value) and renders a styled “card” container.
  - Props usage in React:
    https://react.dev/learn/passing-props-to-a-component
*/
function StatCard({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

export default function AdminAnalyticsScreen({ navigation }) {
  // data: stores the backend analytics payload
  // loading: drives RefreshControl spinner and prevents showing old UI
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

   /*
    loadAnalytics()
    - Fetches analytics from FastAPI (GET /admin/analytics)
    - Same try/catch/finally pattern in:
        - PendingDoulasScreen (api.get and Alert on error)
        - AdminManageUsersScreen (api.get and Alert on error)
  */
  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/analytics");
      setData(res.data);
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  return (
    <View style={styles.container}>
      {/* In-page Back button (so  not dependent on header/back UI)
          goBack() pops the current screen off the stack.
      */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
        <Text style={{ color: COLORS.accent, fontWeight: "700" }}>← Back to Admin Home</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Platform Analytics</Text>

      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadAnalytics} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {!data ? (
          <Text style={styles.empty}>No data yet.</Text>
        ) : (
          <>
              {/* USERS SECTION */}
            <Text style={styles.section}>Users</Text>
            <View style={styles.grid}>
              <StatCard title="Total users" value={data.total_users} />
              <StatCard title="Mothers" value={data.total_mothers} />
              <StatCard title="Doulas" value={data.total_doulas} />
              <StatCard title="Admins" value={data.total_admins} />
              <StatCard title="Pending doulas" value={data.pending_doulas} />
              <StatCard title="Verified doulas" value={data.verified_doulas} />
            </View>
           {/* BOOKINGS SECTION
                These counts directly mirror booking workflow:
                - Requested / Confirmed / Declined / Cancelled / Paid
                (same status values used in booking accept/decline logic)
            */}
            <Text style={styles.section}>Bookings</Text>
            <View style={styles.grid}>
              <StatCard title="Total bookings" value={data.total_bookings} />
              <StatCard title="Requested" value={data.bookings_requested} />
              <StatCard title="Confirmed" value={data.bookings_confirmed} />
              <StatCard title="Declined" value={data.bookings_declined} />
              <StatCard title="Cancelled" value={data.bookings_cancelled} />
              <StatCard title="Paid" value={data.bookings_paid} />
            </View>
            {/* ENGAGEMENT SECTION */}
            <Text style={styles.section}>Engagement</Text>
            <View style={styles.grid}>
              <StatCard title="Reviews" value={data.total_reviews} />
              <StatCard title="Messages" value={data.total_messages} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
//https://reactnative.dev/docs/stylesheet- Modified for admin analytiucs
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.accent, marginBottom: 10 },
  section: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginTop: 14, marginBottom: 10 },
  empty: { textAlign: "center", marginTop: 30, color: COLORS.text, opacity: 0.7 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  card: {
    width: "48%",
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: { color: COLORS.text, opacity: 0.75, fontWeight: "700", marginBottom: 6 },
  cardValue: { color: COLORS.accent, fontSize: 20, fontWeight: "900" },
});
