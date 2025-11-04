import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { CommonActions } from "@react-navigation/native";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};


const LOGO_URL = "http://localhost:8000/static/images/doulacare-logo.png";


export default function HomeScreen({ navigation }) {
  const goBrowse = () => {
    navigation.dispatch(
      CommonActions.navigate({ name: "Doulas", params: { screen: "Browse" } })
    );
  };

  const goAdd = () => {
    navigation.dispatch(
      CommonActions.navigate({ name: "Doulas", params: { screen: "AddDoula" } })
    );
  };

  const goHome = () => {
    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      {/* 🩷 Logo as clickable Home button */}
      <TouchableOpacity onPress={goHome}>
        <Image
          source={{ uri: LOGO_URL }}
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Text style={styles.title}>DoulaCare</Text>
      <Text style={styles.subtitle}>Find, book, and manage doulas with ease.</Text>

      <TouchableOpacity style={styles.cta} onPress={goBrowse}>
        <Text style={styles.ctaText}>Browse Doulas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.cta, styles.ghost]} onPress={goAdd}>
        <Text style={[styles.ctaText, { color: COLORS.accent }]}>
          Create a Doula Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: COLORS.accent,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 24,
  },
  cta: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  ctaText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  ghost: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
});
