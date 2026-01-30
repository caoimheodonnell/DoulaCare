import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { signOut } from "../auth";

const LOGO = require("../assets/doulacare-logo.png");

export default function DoulaPendingApproval({ navigation }) {
  const logout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={styles.container}>
      <Image source={LOGO} style={styles.logo} />
      <Text style={styles.title}>Profile under review</Text>
      <Text style={styles.text}>
        Your doula profile has been submitted and is waiting for admin approval.
        Once approved, you can log in and access the platform.
      </Text>

      <TouchableOpacity style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7F2", justifyContent: "center", padding: 24 },
  logo: { width: 90, height: 90, alignSelf: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "800", color: "#8C6A86", textAlign: "center", marginBottom: 10 },
  text: { fontSize: 15, color: "#2F2A2A", opacity: 0.8, textAlign: "center", marginBottom: 18 },
  button: { backgroundColor: "#8C6A86", paddingVertical: 12, borderRadius: 999, alignItems: "center" },
  buttonText: { color: "#FFF", fontWeight: "800" },
});
