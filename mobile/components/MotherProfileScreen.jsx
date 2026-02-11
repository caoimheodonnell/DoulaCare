import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert,KeyboardAvoidingView, ScrollView, Keyboard, TouchableWithoutFeedback } from "react-native";
import { supabase } from "../supabaseClient";
import api from "../api";

function showMessage(title, message) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function MotherProfileScreen() {
  const [loading, setLoading] = React.useState(true);

  const [location, setLocation] = React.useState("");
  const [careNeeds, setCareNeeds] = React.useState("");
  const [preferredSupport, setPreferredSupport] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const authIdRef = React.useRef(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const authId = data?.session?.user?.id;
        if (!authId) return;

        authIdRef.current = authId;

        const res = await api.get(`/users/by-auth/${authId}`);
        const me = res?.data;

        setLocation(me?.location || "");
        setCareNeeds(me?.care_needs || "");
        setPreferredSupport(me?.preferred_support || "");
        setNotes(me?.notes || "");
      } catch (e) {
        console.error(e);
        showMessage("Error", "Failed to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const save = async () => {
    try {
      const authId = authIdRef.current;
      if (!authId) return;

      await api.patch(`/users/by-auth/${authId}`, {
  location,
  care_needs: careNeeds,
  preferred_support: preferredSupport,
  notes,
});


      showMessage("Saved", "Your profile info was updated.");
    } catch (e) {
      console.error(e);
      showMessage("Error", "Failed to save profile.");
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>Loading…</Text>
      </View>
    );
  }

   return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={Keyboard.dismiss}
        />

        <Text style={styles.label}>Care needs (what support do you want?)</Text>
        <TextInput
          value={careNeeds}
          onChangeText={setCareNeeds}
          style={[styles.input, styles.multiline]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.label}>Preferred support (online / in-person / both)</Text>
        <TextInput
          value={preferredSupport}
          onChangeText={setPreferredSupport}
          style={styles.input}
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={Keyboard.dismiss}
        />

        <Text style={styles.label}>Anything else your doula should know?</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.multiline]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.button} onPress={save}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);

}


const styles = StyleSheet.create({
  label: { fontWeight: "700", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  button: { backgroundColor: "#8C6A86", padding: 12, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "white", fontWeight: "700" },
});
