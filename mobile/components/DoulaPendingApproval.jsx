/*
  DoulaPendingApproval Screen

  Purpose:
  - Shown to doulas who have created a profile but are not yet approved.
  - Prevents access to the main app until an admin verifies the profile.
  - Acts as a holding screen between profile submission and approval.

  Behaviour:
  - Displays a clear status message explaining the approval process.
  - Allows the user to log out while waiting for approval.
  - On next login, approval status is re-checked in LoginScreen routing logic.

  References:
  - React Native View/Text/Image: https://reactnative.dev/docs/components-and-apis
  - TouchableOpacity (buttons): https://reactnative.dev/docs/touchableopacity
  - React Navigation reset(): https://reactnavigation.org/docs/navigation-actions/#reset
*/
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { signOut } from "../auth";

const LOGO = require("../assets/doulacare-logo.png");

export default function DoulaPendingApproval({ navigation }) {
    // Logs the user out and clears navigation history
  // Prevents returning to protected screens via back gesture
  const logout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={styles.container}>
         {/* Branding logo for consistency across auth-related screens */}
      <Image source={LOGO} style={styles.logo} />
        {/* Status heading */}
      <Text style={styles.title}>Profile under review</Text>
         {/* Explanation of approval process */}
      <Text style={styles.text}>
        Your doula profile has been submitted and is waiting for admin approval.
        Once approved, you can log in and access the platform.
      </Text>

         {/* Logout action while waiting for approval */}
      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

//https://reactnative.dev/docs/stylesheet- Modified for doula pending approval
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F2", justifyContent: "center", padding: 24 },
  logo: { width: 90, height: 90, alignSelf: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "800", color: "#8C6A86", textAlign: "center", marginBottom: 10 },
  text: { fontSize: 15, color: "#2F2A2A", opacity: 0.8, textAlign: "center", marginBottom: 18 },
  button: { backgroundColor: "#8C6A86", paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "800" },
});
