// components/BookingScreen.jsx
//Youtube video - Date & Time Picker Dialog Tutorial in React Native (DateTimePicker)
import React from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

/** Cross-platform alert helper:
 *  - native: Alert.alert
 *  - web: window.alert (so you SEE the popup in the browser)
 */
function showMessage(title, message) {
  if (Platform.OS === "web") {
    // Keep it simple for web
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Web-only hidden pickers. Returns null on native so we don't render DOM nodes there.
 */
const WebHiddenPickers = ({ dateRef, timeRef, onDate, onTime }) =>
  Platform.OS === "web" ? (
    <View style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      {/* @ts-ignore web-only */}
      <input ref={dateRef} type="date" onChange={(e) => onDate(e.target.value)} />
      {/* @ts-ignore web-only */}
      <input ref={timeRef} type="time" onChange={(e) => onTime(e.target.value)} />
    </View>
  ) : null;

export default function BookingScreen({ onBooked }) {
  const route = useRoute();

  // Mother search (what user types) and the resolved motherId (what we POST)
  const [motherKey, setMotherKey] = React.useState("");
  const [motherId, setMotherId] = React.useState("");

  // Doula ID (prefilled when navigating from DoulaDetails)
  const [doulaId, setDoulaId] = React.useState("");

  // Date/time strings sent to backend
  const [date, setDate] = React.useState(""); // "YYYY-MM-DD"
  const [startTime, setStartTime] = React.useState(""); // "HH:MM"

  const [duration, setDuration] = React.useState("60");
  const [mode, setMode] = React.useState("online"); // "online" | "in_person"

  // Native picker state
  const [pickerDate, setPickerDate] = React.useState(new Date());
  const [showPicker, setShowPicker] = React.useState(false);
  const [pickerMode, setPickerMode] = React.useState("date"); // "date" | "time"

  // Web fallback inputs (not display:none so showPicker() works)
  const dateRef = React.useRef(null);
  const timeRef = React.useRef(null);

  // Prefill doula id if we came from the profile screen
  React.useEffect(() => {
    const preset = route.params?.presetDoulaId;
    if (preset && !doulaId) setDoulaId(String(preset));
  }, [route.params?.presetDoulaId, doulaId]);

  // Mother lookup (accepts full name, partial, or email)
  const lookupMother = async () => {
    const q = motherKey.trim();
    if (!q) {
      showMessage("Missing info", "Please enter your name or email.");
      return;
    }
    try {
      const { data } = await api.get("/users");
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

      const match = (data || []).find((u) => {
        if (u.role !== "mother") return false;
        const haystack = `${u.name || ""} ${u.email || ""} ${u.location || ""}`.toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      });

      if (!match) {
        showMessage(
          "Not found",
          "No mother matched that name/email/location. Try first name only or the email address."
        );
        return;
      }
      setMotherId(String(match.id));
      showMessage("Found", `Matched: ${match.name} (id ${match.id})`);
    } catch (e) {
      console.error("Mother lookup error:", e);
      showMessage("Lookup failed", e?.message || "Unknown error");
    }
  };

  // Native picker change
  const onNativeChange = (_evt, selected) => {
    if (Platform.OS !== "ios") setShowPicker(false);
    const d = selected || pickerDate;
    setPickerDate(d);
    if (pickerMode === "date") {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setDate(`${y}-${m}-${dd}`);
    } else {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      setStartTime(`${hh}:${mm}`);
    }
  };

  // Open date/time picker based on platform
  const openPicker = (kind) => {
    if (Platform.OS === "web") {
      const el = kind === "date" ? dateRef.current : timeRef.current;
      if (!el) return;
      if (typeof el.showPicker === "function") el.showPicker();
      else {
        el.focus();
        el.click();
      }
      return;
    }
    setPickerMode(kind);
    setShowPicker(true);
  };

  const handleSubmit = async () => {
    if (!motherId || !doulaId || !date || !startTime || !duration) {
      showMessage(
        "Missing info",
        "Please fill mother (use Lookup), doula, date, time and duration."
      );
      return;
    }
    const mother_id = Number(motherId);
    const doula_id = Number(doulaId);
    const dur = Number(duration);
    if ([mother_id, doula_id, dur].some((n) => Number.isNaN(n)) || dur <= 0) {
      showMessage("Invalid values", "IDs must be numbers and duration > 0.");
      return;
    }

    const starts = new Date(`${date}T${startTime}:00`);
    const ends = new Date(starts.getTime() + dur * 60000);

    try {
      // Optional: log to browser console so you can see it on web
      console.log("Submitting booking", {
        mother_id,
        doula_id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        mode,
      });

      await api.post("/bookings", {
        mother_id,
        doula_id,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        mode,
      });
      showMessage("Booked", "Your consultation has been requested.");

      // reset
      setMotherKey("");
      setMotherId("");
      setDoulaId("");
      setDate("");
      setStartTime("");
      setDuration("60");
      setMode("online");
      onBooked?.();
    } catch (err) {
      const msg = err?.response
        ? `${err.response.status} ${err.response.statusText}\n${JSON.stringify(
            err.response.data
          )}`
        : err?.message || "Unknown error";
      console.error("POST /bookings error:", err);
      showMessage("Booking failed", msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, alignItems: "center" }}
      >
        <View style={styles.form}>
          {/* Mother search & lookup */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TextInput
              placeholder="Your name or email (e.g., Emma Fenton or emma@...)"
              value={motherKey}
              onChangeText={setMotherKey}
              style={[styles.input, { flex: 1 }]}
              autoCapitalize="words"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.smallBtn} onPress={lookupMother}>
              <Text style={styles.smallBtnText}>Lookup</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Mother ID (auto-filled)"
            value={motherId}
            onChangeText={setMotherId}
            style={styles.input}
            editable={false}
          />

          {/* Doula ID */}
          <TextInput
            placeholder="Doula ID *"
            value={doulaId}
            onChangeText={setDoulaId}
            style={styles.input}
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
          />

          {/* Date row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Date (YYYY-MM-DD) *"
                value={date}
                onChangeText={setDate}
                style={styles.input}
              />
            </View>
            <TouchableOpacity style={styles.smallBtn} onPress={() => openPicker("date")}>
              <Text style={styles.smallBtnText}>Pick Date</Text>
            </TouchableOpacity>
          </View>

          {/* Time row */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="Start Time (HH:MM) *"
                value={startTime}
                onChangeText={setStartTime}
                style={styles.input}
              />
            </View>
            <TouchableOpacity style={styles.smallBtn} onPress={() => openPicker("time")}>
              <Text style={styles.smallBtnText}>Pick Time</Text>
            </TouchableOpacity>
          </View>

          {/* Web-only hidden inputs */}
          <WebHiddenPickers
            dateRef={dateRef}
            timeRef={timeRef}
            onDate={setDate}
            onTime={setStartTime}
          />

          {/* Native picker (iOS/Android) */}
          {showPicker && Platform.OS !== "web" && (
            <DateTimePicker
              value={pickerDate}
              mode={pickerMode}
              is24Hour
              display={
                Platform.OS === "ios"
                  ? pickerMode === "date"
                    ? "inline"
                    : "spinner"
                  : "default"
              }
              onChange={onNativeChange}
            />
          )}

          {/* Echo date/time */}
          <Text style={{ marginTop: 4, color: COLORS.text }}>
            {date ? `Date: ${date}` : "Date: —"}
            {"\n"}
            {startTime ? `Time: ${startTime}` : "Time: —"}
          </Text>

          {/* Duration */}
          <TextInput
            placeholder="Duration (minutes) *"
            value={duration}
            onChangeText={setDuration}
            style={styles.input}
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
          />

          {/* Mode chips */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => setMode("online")}
              style={[styles.modeChip, mode === "online" && styles.modeChipActive]}
            >
              <Text style={[styles.modeText, mode === "online" && styles.modeTextActive]}>
                Online
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("in_person")}
              style={[styles.modeChip, mode === "in_person" && styles.modeChipActive]}
            >
              <Text style={[styles.modeText, mode === "in_person" && styles.modeTextActive]}>
                In-person
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Book Consultation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  form: {
    backgroundColor: COLORS.background,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginVertical: 10,
    width: "100%",
    maxWidth: 520,
  },
  input: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    width: "100%",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  smallBtn: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  smallBtnText: { color: COLORS.accent, fontWeight: "700" },
  modeRow: { flexDirection: "row", gap: 10, marginVertical: 6 },
  modeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  modeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeText: { color: COLORS.accent, fontWeight: "700" },
  modeTextActive: { color: COLORS.white },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
});

