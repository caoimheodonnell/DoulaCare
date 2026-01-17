/*
  Register Screen

  What this screen does:
  - Presents a registration form (role, name, email, password).
  - Creates a new auth user via Supabase Auth (email/password).
  - Stores the selected role in Supabase user metadata.
  - Bootstraps a corresponding SQL user record via FastAPI
    (/users/bootstrap) using the Supabase auth user ID.
  - Redirects the user back to the Login screen after successful signup.

  Auth and Data Flow:
  1) User submits registration form.
  2) Supabase Auth creates the auth user (signUp).
  3) Supabase returns a stable auth user ID (UUID).
  4) Backend FastAPI endpoint /users/bootstrap:
     - Creates a new SQL user if one does not exist
     - Or updates missing/default fields if it already exists
  5) User is returned to Login to authenticate.

  Similar to LoginScreen:
  - Uses controlled TextInput fields with useState.
  - Uses native alerts for user feedback (Alert / window.alert).
  - Communicates with Supabase Auth and a FastAPI backend.
  - Uses navigation.reset for post-auth flow control.


  References used:
  - React Native components:
    View:              https://reactnative.dev/docs/view
    Text:              https://reactnative.dev/docs/text
    TextInput:         https://reactnative.dev/docs/textinput
    TouchableOpacity:  https://reactnative.dev/docs/touchableopacity
    StyleSheet:        https://reactnative.dev/docs/stylesheet
    Alert:             https://reactnative.dev/docs/alert
    Platform:          https://reactnative.dev/docs/platform

  - Supabase Auth (Email and Password Signup):
    https://supabase.com/docs/guides/auth/auth-email
  - React Navigation (reset after registration):
    https://reactnavigation.org/docs/navigation-actions
  - SQLModel sessions and updates:
    https://sqlmodel.tiangolo.com/tutorial/select/
    https://sqlmodel.tiangolo.com/tutorial/update/
*/

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { signUp } from "../auth";
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

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("mother");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    // Require a name before continuing
if (!cleanName) {
  showMessage("Missing data", "Please enter your name.");
  return;
}

 // Require email and password
    if (!cleanEmail || !cleanPassword) {
      showMessage("Missing data", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      // 1) Supabase signup
      // Role is stored in Supabase user metadata (extra data attached to the auth user)
      // Based on Supabase auth signUp example.
// Extended to also create/update a backend user record with app-specific data.

      const data = await signUp(cleanEmail, cleanPassword, role);

      // 2) Create or update the backend user record
    // using the auth user ID
      const authId = data?.user?.id;
      if (authId) {
        await api.post("/users/bootstrap", {
          auth_id: authId,
          role,
          name: cleanName,
          location: "",
        });
      }

       // Let the user know registration worked
      showMessage("Account created", "You can now log in.");

      // back to login
      // using react native navigation
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (e) {
      console.error("Register error:", e);
      showMessage("Error", String(e?.message || "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* Role selector */}
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === "mother" && styles.roleSelected]}
          onPress={() => setRole("mother")}
        >
          <Text style={[styles.roleText, role === "mother" && styles.roleTextSelected]}>
            Mother
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, role === "doula" && styles.roleSelected]}
          onPress={() => setRole("doula")}
        >
          <Text style={[styles.roleText, role === "doula" && styles.roleTextSelected]}>
            Doula
          </Text>
        </TouchableOpacity>
      </View>

       {/* Full name input */}
 <TextInput
  value={name}
  onChangeText={setName}
  placeholder="Full name"
  autoCapitalize="words"
  style={styles.input}
/>

         {/* Email input */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      {/* Password input */}
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        style={styles.input}
      />

       {/* Register button */}
      <TouchableOpacity
        style={[styles.primaryButton, loading && { opacity: 0.7 }]}
        onPress={onRegister}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? "Registering…" : "Register"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already registered? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 18,
  },
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  roleSelected: { borderColor: COLORS.accent },
  roleText: { fontWeight: "700", color: COLORS.text },
  roleTextSelected: { color: COLORS.accent },

  input: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 16,
  },
  link: {
    marginTop: 14,
    textAlign: "center",
    color: COLORS.accent,
    fontWeight: "700",
  },
});


