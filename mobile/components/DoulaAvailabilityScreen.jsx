import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { supabase } from "../supabaseClient";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

function showMessage(title, message) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

const DAYS = [
  { label: "Monday", value: 0 },
  { label: "Tuesday", value: 1 },
  { label: "Wednesday", value: 2 },
  { label: "Thursday", value: 3 },
  { label: "Friday", value: 4 },
  { label: "Saturday", value: 5 },
  { label: "Sunday", value: 6 },
];

function isValidHHMM(s) {
  // 24h "09:00"
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(s || "").trim());
}

export default function DoulaAvailabilityScreen() {
  const [doulaAuthId, setDoulaAuthId] = React.useState(null);
  const [saving, setSaving] = React.useState(false);

  // One row per day (simple V1)
  const [rows, setRows] = React.useState(
    DAYS.map((d) => ({
      day_of_week: d.value,
      label: d.label,
      active: false,
      start_time: "09:00",
      end_time: "17:00",
    }))
  );

  // Load current logged-in doula auth id (Supabase UUID string)
  React.useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      const authId = data?.session?.user?.id;
      setDoulaAuthId(authId || null);
    };
    load();
  }, []);

  const toggleDay = (day) => {
    setRows((prev) =>
      prev.map((r) => (r.day_of_week === day ? { ...r, active: !r.active } : r))
    );
  };

  const setField = (day, key, value) => {
    setRows((prev) =>
      prev.map((r) => (r.day_of_week === day ? { ...r, [key]: value } : r))
    );
  };

  const saveWeekly = async () => {
    if (!doulaAuthId) {
      showMessage("Not logged in", "Please log in again.");
      return;
    }

    // Validate only the active rows
    for (const r of rows) {
      if (!r.active) continue;

      const st = String(r.start_time || "").trim();
      const et = String(r.end_time || "").trim();

      if (!isValidHHMM(st) || !isValidHHMM(et)) {
        showMessage("Invalid time", `${r.label}: use HH:MM (e.g. 09:00).`);
        return;
      }
      if (et <= st) {
        showMessage("Invalid range", `${r.label}: end time must be after start time.`);
        return;
      }
    }

    // Payload expected by backend
    const payload = rows.map((r) => ({
      day_of_week: r.day_of_week,
      start_time: String(r.start_time || "").trim(),
      end_time: String(r.end_time || "").trim(),
      active: !!r.active,
    }));

    try {
      setSaving(true);

      // POST /availability/weekly/by-doula-auth/{doula_auth_id}
      await api.post(`/availability/weekly/by-doula-auth/${doulaAuthId}`, payload);

      showMessage("Saved", "Your weekly availability has been updated.");
    } catch (err) {
      console.error("saveWeekly error", err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to save availability.";
      showMessage("Error", String(detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>My Weekly Availability</Text>
      <Text style={styles.subtitle}>
        Set when you’re available each week. Mothers can only book inside these times.
      </Text>

      {rows.map((r) => (
        <View key={r.day_of_week} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.dayText}>{r.label}</Text>

            <TouchableOpacity
              onPress={() => toggleDay(r.day_of_week)}
              style={[
                styles.chip,
                r.active ? styles.chipActive : styles.chipInactive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  r.active ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {r.active ? "Available" : "Off"}
              </Text>
            </TouchableOpacity>
          </View>

          {r.active && (
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Start</Text>
                <TextInput
                  value={r.start_time}
                  onChangeText={(v) => setField(r.day_of_week, "start_time", v)}
                  placeholder="09:00"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>End</Text>
                <TextInput
                  value={r.end_time}
                  onChangeText={(v) => setField(r.day_of_week, "end_time", v)}
                  placeholder="17:00"
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        onPress={saveWeekly}
        disabled={saving}
      >
        <Text style={styles.saveText}>{saving ? "Saving..." : "Save Availability"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.accent,
    marginBottom: 6,
  },
  subtitle: {
    color: COLORS.text,
    marginBottom: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipInactive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
  },
  chipText: { fontWeight: "800" },
  chipTextActive: { color: COLORS.white },
  chipTextInactive: { color: COLORS.text },

  timeRow: { flexDirection: "row", marginTop: 12 },
  label: { fontSize: 12, color: COLORS.accent, fontWeight: "700", marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },

  saveBtn: {
    marginTop: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { color: COLORS.white, fontWeight: "800" },
});
