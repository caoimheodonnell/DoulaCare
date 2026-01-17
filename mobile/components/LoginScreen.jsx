/*
  Login Screen

  What this screen does:
  - Presents a simple login form (email and password).
  - Calls Supabase Auth (signInWithPassword) via the signIn() helper in ../auth.
  - On success, resets navigation to the main authenticated area (AppGate).

  Similar to AddUserFormMobile:
  - Uses controlled TextInput fields with useState.
  - Uses React Native UI components (View/Text/TextInput/TouchableOpacity/Image).
  - Uses native alerts for user feedback (Alert.alert or showMessage wrapper).
  - Submits user-entered form data to a backend service.

  References used:
  - React Native components:
    TextInput:        https://reactnative.dev/docs/textinput
    TouchableOpacity: https://reactnative.dev/docs/touchableopacity
    Image:            https://reactnative.dev/docs/image
    Alert:            https://reactnative.dev/docs/alert
    StyleSheet:       https://reactnative.dev/docs/stylesheet
  - Supabase Auth (Email and Password):
    https://supabase.com/docs/guides/auth/auth-email
  - React Navigation (navigation/reset patterns):
    https://reactnavigation.org/docs/navigation-actions
    -Get Session
    https://supabase.com/docs/reference/javascript/auth-getsession
*/
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";

import { signIn, getMyRole } from "../auth";
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

const LOGO = require("../assets/doulacare-logo.png");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    try {
      // 1) Sign in
      // Reference: Supabase Auth email/password sign-in
      await signIn(email.trim().toLowerCase(), password);

      // 2) Get role (from Supabase user_metadata)
      const role = await getMyRole();
      if (!role) {
        Alert.alert(
          "Login incomplete",
          "Your account does not exist yet or Incorrect input. Please try again."
        );
        return;
      }

      // 3) Ensure this auth user exists in your SQL users table
      // https://supabase.com/docs/reference/javascript/auth-getsession
      const { data } = await supabase.auth.getSession();
      const authId = data?.session?.user?.id;

      // call the backend to create/update the SQL user row
      if (authId) {
        await api.post("/users/bootstrap", {
  auth_id: authId,
  role,
});

      }

      // 4) Go to MainTabs
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs", params: { role } }],
      });
    } catch (e) {
      // Show a simple error message if login fails
      Alert.alert("Login failed", e?.message || "Unknown error");
    }
  };

  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} />
      <Text style={styles.title}>DoulaCare</Text>
      <Text style={styles.subtitle}>Log in to continue</Text>

      {/* Email input  */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Login button */}
      <TouchableOpacity style={styles.primaryButton} onPress={onLogin}>
        <Text style={styles.primaryButtonText}>Log In</Text>
      </TouchableOpacity>

      {/* Link to Register screen */}
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.link}>Create an account</Text>
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
  logo: { width: 100, height: 100, alignSelf: "center", marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.accent,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  link: {
    marginTop: 14,
    textAlign: "center",
    color: COLORS.accent,
    fontWeight: "700",
  },
});

