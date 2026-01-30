/*
  Admin Home Screen

  What this screen does:
  - Acts as the landing page for admin users after login.
  - Displays the DoulaCare branding and an admin dashboard message.
  - Provides a menu with admin-only actions (placeholders for now).
  - Allows the admin to log out of the application.

  Navigation:
  - This screen is reached from LoginScreen when role === "admin".
  - No navigation to other admin pages yet (prevents route errors).
  - Future admin screens (verify doulas, manage users, analytics)
    can be added later and wired into the menu.

  React Native components used:
  - View, Text: layout and labels
  - TouchableOpacity: pressable menu items and buttons
  - Image: displays DoulaCare logo
  - Modal: overlay menu (same pattern as Mother/Doula Home screens)

  Icons:
  - Ionicons from @expo/vector-icons
*/
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "../auth";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

const LOGO = require("../assets/doulacare-logo.png");

export default function AdminHomeScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);

  // Menu helpers
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // Placeholder handlers (no navigation yet)
  const comingSoon = (feature) => {
    closeMenu();
    Alert.alert("Coming soon", `${feature} will be added next.`);
  };

  const goPendingDoulas = () => {
  closeMenu();
  navigation.navigate("PendingDoulas");
};

  // Logout helper
  const doLogout = async () => {
    await signOut();
    closeMenu();
    navigation.reset({ index: 0, routes: [{ name: "AppGate" }] });
  };

  return (
    <View style={styles.container}>
      {/* HEADER WITH MENU ICON */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu}>
          <Ionicons name="menu" size={26} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.hero}>
        <Image source={LOGO} style={styles.logo} />
        <Text style={styles.title}>DoulaCare</Text>
        <Text style={styles.subtitle}>Administrator Dashboard</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={goPendingDoulas}

        >
          <Text style={styles.primaryButtonText}>Admin Tools</Text>
        </TouchableOpacity>
      </View>

      {/* OVERLAY MENU */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.menu}>
              <Text style={styles.menuTitle}>Admin Menu</Text>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={goPendingDoulas}

              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Verify Doulas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("AdminManageUsers")}

              >
                <Ionicons
                  name="people-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Manage Users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navigation.navigate("AdminAnalytics")}

              >
                <Ionicons
                  name="stats-chart-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => comingSoon("Postpartum resources")}
              >
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Resources</Text>
              </TouchableOpacity>

              {/* LOGOUT */}
              <TouchableOpacity style={styles.menuItem} onPress={doLogout}>
                <Ionicons
                  name="log-out-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Styles (mirrors Mother/Doula HomeScreen)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    position: "absolute",
    top: 48,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: { width: 100, height: 100, marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.accent,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.text,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: "700",
    fontSize: 16,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
    alignItems: "flex-start",
  },
  menu: {
    marginTop: 70,
    marginRight: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    minWidth: 240,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuIcon: {
    marginRight: 10,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.text,
  },
});
