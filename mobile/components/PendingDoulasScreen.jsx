/*
  PendingDoulasScreen (Admin)

  What this screen does:
  - Fetches all doula profiles waiting for approval (verified=false).
  - Displays basic info + certificate link if provided.
  - Allows an admin to approve a doula (sets verified=true) via PATCH /users/{id}.
*/

import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Linking, RefreshControl } from "react-native";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};


export default function PendingDoulasScreen({ navigation }) {

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/doulas/pending");
      setPending(res.data || []);
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to load pending doulas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const approveDoula = async (doulaId) => {
    try {
      await api.patch(`/users/${doulaId}`, { verified: true });
      Alert.alert("Approved", "Doula has been verified.");
      // refresh list
      loadPending();
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to approve doula");
    }
  };

  const openCertificate = async (url) => {
    if (!url) return;
    // If your backend returns "/static/..." you may need your base URL in api to be correct.
    // Linking.openURL needs a full URL in mobile if it's not already absolute.
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Can't open link", "Certificate link could not be opened on this device.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.meta}>{item.location} • €{item.price}</Text>

      {item.years_experience != null ? (
        <Text style={styles.meta}>Experience: {item.years_experience} years</Text>
      ) : null}

      {item.certificate_url ? (
        <TouchableOpacity onPress={() => openCertificate(item.certificate_url)}>
          <Text style={styles.link}>View certificate</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.meta}>No certificate uploaded</Text>
      )}

      <TouchableOpacity
        style={styles.approveBtn}
        onPress={() =>
          Alert.alert(
            "Approve doula?",
            `Verify ${item.name}?`,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Approve", onPress: () => approveDoula(item.id) },
            ]
          )
        }
      >
        <Text style={styles.approveText}>Approve</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
  onPress={() => navigation.goBack()}
  style={{ marginBottom: 12 }}
>
  <Text style={{ color: "#8C6A86", fontWeight: "700" }}>
    ← Back to Admin Home
  </Text>
</TouchableOpacity>

      <Text style={styles.title}>Pending Doulas</Text>

      <FlatList
        data={pending}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPending} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No pending doulas right now.</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.accent, marginBottom: 12 },
  empty: { textAlign: "center", marginTop: 30, color: COLORS.text, opacity: 0.7 },

  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 16, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  meta: { color: COLORS.text, opacity: 0.8, marginBottom: 6 },
  link: { color: COLORS.accent, fontWeight: "700", marginBottom: 10 },

  approveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 4,
  },
  approveText: { color: COLORS.white, fontWeight: "800" },
});
