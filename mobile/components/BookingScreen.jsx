/*

  How this was adapted (from my AddUserFormMobile):
  - Kept the same overall form pattern as AddUserFormMobile:
  -Added cross-platform date/time selection:
      - Native iOS/Android = @react-native-community/datetimepicker
      - Web= hidden <input type="date"> and <input type="time">
  - Added “Lookup Mother” convenience:
      - Similar to how AddUser handled inputs before posting, but here we search
        /users for a mother whose name/email/location matches the user’s search
  References used:
  - React Native (official docs):
      - TouchableOpacity:  https://reactnative.dev/docs/touchableopacity
      - TextInput:         https://reactnative.dev/docs/textinput
      - Alert:             https://reactnative.dev/docs/alert
      - KeyboardAvoidingView: https://reactnative.dev/docs/keyboardavoidingview
      - ScrollView:        https://reactnative.dev/docs/scrollview
      - View/Text:         https://reactnative.dev/docs/view, https://reactnative.dev/docs/text
      - Platform:          https://reactnative.dev/docs/platform
  - Date and Time picker: https://www.youtube.com/watch?v=Imkw-xFFLeE
  -ChatGpt error fixing for web for date and time only IOS in Youtube video - https://chatgpt.com/c/690c7dd0-7b44-8327-af99-6b685dae18a5
*/

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
//  From Date and Time picker youtube video tutorial: import the native DateTimePicker-https://www.youtube.com/watch?v=Imkw-xFFLeE
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "../api";
import { scheduleBookingReminder } from "../notifications"; // notification to mother when booking is accepted
import { supabase } from "../supabaseClient";



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
 *  -  Alert:             https://reactnative.dev/docs/alert
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
  WebHiddenPickers — web-only HTML date/time inputs
  - On iOS/Android, we return null (we use DateTimePicker instead).
  - We keep the inputs visually hidden but programmatically accessible so
   openPicker('date'|'time') can call .showPicker() or .click().
 -Chatgpt error fixing for web- https://chatgpt.com/c/690c7dd0-7b44-8327-af99-6b685dae18a5
 */
const HiddenWebPickers = ({ dateRef, timeRef, onDate, onTime }) => {
  if (Platform.OS !== "web") return null;
  return (
    <View
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {React.createElement("input", {
        ref: dateRef,
        type: "date",
        onChange: (e) => onDate(e.target.value),
        style: { position: "absolute", opacity: 0, width: 0, height: 0 },
      })}
      {React.createElement("input", {
        ref: timeRef,
        type: "time",
        onChange: (e) => onTime(e.target.value),
        style: { position: "absolute", opacity: 0, width: 0, height: 0 },
      })}
    </View>
  );
};

// same layout as adduserformmobile
// Skeleton form chatgpt chat for addusermobile but used for booking -  https://chatgpt.com/c/68f40a4c-6598-8325-9399-b695370996ed
export default function BookingScreen({ onBooked }) {
  const route = useRoute();
  const presetName = route.params?.presetDoulaName;

  // User-typed mother search key (free text) and resolved motherId is seen by  POST
  const [motherId, setMotherId] = React.useState(null); // number (app users.id)


  // Doula ID (prefilled when navigating from DoulaDetails)
  const [doulaId, setDoulaId] = React.useState("");

  // All bookings for this doula (used to show already-booked times)
  const [doulaBookings, setDoulaBookings] = React.useState([]);
  // Date/time strings sent to backend
  const [date, setDate] = React.useState(""); // "YYYY-MM-DD"
  const [startTime, setStartTime] = React.useState(""); // "HH:MM"

  const [duration, setDuration] = React.useState("60");
  const [mode, setMode] = React.useState("online"); // "online" | "in_person"

  // From Date and Time picker Youtube video tutorial: define state for date/time and show-https://www.youtube.com/watch?v=Imkw-xFFLeE
  const [pickerDate, setPickerDate] = React.useState(new Date());
  const [showPicker, setShowPicker] = React.useState(false);
  const [pickerMode, setPickerMode] = React.useState("date"); // "date" | "time"

  // Web fallback inputs (not display:none so showPicker() works)
  const dateRef = React.useRef(null);
  const timeRef = React.useRef(null);

  React.useEffect(() => {
  const loadMotherId = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const authId = sessionData?.session?.user?.id;
      if (!authId) return;

      const { data } = await api.get("/users");
      const me = (data || []).find(
        (u) => u.role === "mother" && String(u.auth_id) === String(authId)
      );

      if (!me) {
        showMessage(
          "Account not ready",
          "Your user row isn't in the app database yet. Try logging out and back in, or ensure /users/bootstrap succeeds."
        );
        return;
      }

      setMotherId(me.id); // <- numeric mother_id to use for bookings
    } catch (e) {
      console.error("loadMotherId error", e);
    }
  };

  loadMotherId();
}, []);

  // Prefill doula id if we came from the profile screen
  React.useEffect(() => {
    const preset = route.params?.presetDoulaId;
    if (preset && !doulaId) setDoulaId(String(preset));
  }, [route.params?.presetDoulaId, doulaId]);

    // When doulaId is known, load all bookings for that doula
  React.useEffect(() => {
    const id = Number(doulaId);
    if (!id || Number.isNaN(id)) return;

    const loadBookings = async () => {
      try {
        const { data } = await api.get(`/bookings/by-doula/${id}`);
        setDoulaBookings(data || []);
      } catch (err) {
        console.error("Error loading doula bookings:", err);
      }
    };

    loadBookings();
  }, [doulaId]);

    // Bookings that fall on the currently selected date
  const bookingsForSelectedDate = React.useMemo(() => {
    if (!date) return [];
    return (doulaBookings || []).filter((b) => {
      if (!b.starts_at) return false;
      const d = new Date(b.starts_at).toISOString().slice(0, 10);
      return d === date;
    });
  }, [date, doulaBookings]);




  // Native picker change
   //  From Date and Time picker video tutorial: onChange event — hides picker (Android) and updates date/time https://www.youtube.com/watch?v=Imkw-xFFLeE
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

  //From Date and Time youtube video tutorial: open the picker, toggling "date" or "time"-https://www.youtube.com/watch?v=Imkw-xFFLeE
  // Web picker support:
// Adapted from community examples and MDN docs.
// Since React Native has no web-native date/time picker, we trigger a hidden
// <input type="date/time"> using el.showPicker() or el.click().
// References:
// - MDN: https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker


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
    if (!motherId) {
  showMessage(
    "Account not ready",
    "We couldn’t find your mother profile yet. Make sure /users/bootstrap succeeded, then log out and log back in."
  );
  return;
}

if (!doulaId || !date || !startTime || !duration) {
  showMessage("Missing info", "Please select doula, date, time and duration.");
  return;
}

const mother_id = Number(motherId);
const doula_id = Number(doulaId);
const dur = Number(duration);

if ([mother_id, doula_id, dur].some((n) => Number.isNaN(n)) || dur <= 0) {
  showMessage("Invalid values", "Doula ID must be a number and duration > 0.");
  return;
}




    const starts = new Date(`${date}T${startTime}:00`);
    const ends = new Date(starts.getTime() + dur * 60000);

     // Check for overlap with existing bookings for this doula
    const conflict = (doulaBookings || []).find((b) => {
      if (!b.starts_at || !b.ends_at) return false;
      // ignore declined/cancelled bookings
      if (b.status === "declined" || b.status === "cancelled") return false;

      const s = new Date(b.starts_at);
      const e = new Date(b.ends_at);

      // only compare bookings on the same day
      const dayExisting = s.toISOString().slice(0, 10);
      const dayNew = starts.toISOString().slice(0, 10);
      if (dayExisting !== dayNew) return false;

      // overlap if start < existing end AND end > existing start
      return starts < e && ends > s;
    });

    if (conflict) {
      const s = new Date(conflict.starts_at);
      const e = new Date(conflict.ends_at);
      const timeRange = `${s.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} – ${e.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      showMessage(
        "Time not available",
        `This doula already has a booking on ${date} at ${timeRange}. Please choose another time.`
      );
      return;
    }


    try {
      // log to browser console so you can see it on web
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

      //  schedule a local notification for this appointment (mobile only)
      try {
        await scheduleBookingReminder(starts, presetName || "your doula");
      } catch (notifyErr) {
        console.warn("Failed to schedule notification:", notifyErr);
      }

      showMessage("Booked", "Your consultation has been requested.");


      // reset
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

          {/* Doula ID */}
          <TextInput
            placeholder="Doula ID *"
            value={doulaId}
            onChangeText={setDoulaId}
            style={styles.input}
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
          />
          {/* If doula has bookings on this date, show them */}
          {date && bookingsForSelectedDate.length > 0 && (
            <View style={{ marginBottom: 8 }}>
              <Text
                style={{
                  fontWeight: "700",
                  color: COLORS.accent,
                  marginBottom: 4,
                }}
              >
                Existing bookings on {date}:
              </Text>
              {bookingsForSelectedDate.map((b) => {
                const s = new Date(b.starts_at);
                const e = new Date(b.ends_at);
                const range = `${s.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })} – ${e.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`;
                return (
                  <Text key={b.booking_id} style={{ color: COLORS.text, fontSize: 13 }}>
                    • {range} ({b.status})
                  </Text>
                );
              })}
            </View>
          )}

          {/* Date row */}
          {/* From Date and Time youtube video tutorial: picker buttons that toggle modes */}
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

          {/* Web-only hidden inputs
           - Chatgpt error fixing for web -https://chatgpt.com/c/690c7dd0-7b44-8327-af99-6b685dae18a5*/}
          <HiddenWebPickers
            dateRef={dateRef}
            timeRef={timeRef}
            onDate={setDate}
            onTime={setStartTime}
          />

          {/* Native picker (iOS/Android) */}
          {/* From Date and Time youtube video tutorial: datetime picker https://www.youtube.com/watch?v=Imkw-xFFLeE*/}
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

          {/* Echo date/time - displays the currently selected date and time underneath your picker.*/}
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

          {/* Mode chips - Uses TouchableOpacity from React Native to create two toggle buttons- https://reactnative.dev/docs/touchableopacity
          - customised toggle buttons*/}
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
//https://reactnative.dev/docs/stylesheet modified for booking screen
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

