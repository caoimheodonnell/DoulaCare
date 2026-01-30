/*
  AdminAnalyticsScreen (Admin)

  What this screen does:
  - Fetches platform analytics from GET /admin/analytics.
  - Displays booking counts and user engagement metrics.
  - Includes in-page back button (no header required).
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

function StatCard({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

export default function AdminAnalyticsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

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
            <Text style={styles.section}>Users</Text>
            <View style={styles.grid}>
              <StatCard title="Total users" value={data.total_users} />
              <StatCard title="Mothers" value={data.total_mothers} />
              <StatCard title="Doulas" value={data.total_doulas} />
              <StatCard title="Admins" value={data.total_admins} />
              <StatCard title="Pending doulas" value={data.pending_doulas} />
              <StatCard title="Verified doulas" value={data.verified_doulas} />
            </View>

            <Text style={styles.section}>Bookings</Text>
            <View style={styles.grid}>
              <StatCard title="Total bookings" value={data.total_bookings} />
              <StatCard title="Requested" value={data.bookings_requested} />
              <StatCard title="Confirmed" value={data.bookings_confirmed} />
              <StatCard title="Declined" value={data.bookings_declined} />
              <StatCard title="Cancelled" value={data.bookings_cancelled} />
              <StatCard title="Paid" value={data.bookings_paid} />
            </View>

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
