
/*
  AdminHomeScreen (Admin Landing Page) - Same layout as doula and mother home

  Navigation:
    - This screen is reached from LoginScreen when role === "admin".
    - Uses `navigation.navigate()` to open admin-only screens registered in your Root stack:
        - "PendingDoulas"      (verify doulas)
        - "AdminManageUsers"   (delete users)
        - "AdminAnalytics"     (stats)
      React Navigation (navigate / reset):

        - https://reactnavigation.org/docs/navigation-actions/

    - Uses `navigation.reset()` on logout to return to AppGate (clears back history),
      matching the pattern use in Mother/Doula Home screens.


  UI / Components:
    - View/Text: core layout and labels
      https://reactnative.dev/docs/view
      https://reactnative.dev/docs/text
    - TouchableOpacity: pressable buttons and menu items
      https://reactnative.dev/docs/touchableopacity
    - Image: shows DoulaCare logo from local assets
      https://reactnative.dev/docs/image
    - Modal: overlay dropdown menu (same pattern as HomeScreen.jsx menu)
      https://reactnative.dev/docs/modal
    - Alert: shows "coming soon" placeholder messages
      https://reactnative.dev/docs/alert
    - Ionicons from @expo/vector-icons (same as doula/mother HomeScreen)
      https://icons.expo.fyi/
      https://ionic.io/ionicons
    - Acts as the admin dashboard entry point.

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
   // Local UI state for showing/hiding the modal menu
  // useState is used for local component state
  // https://react.dev/reference/react/useState
  const [menuVisible, setMenuVisible] = useState(false);


   // Menu helpers (same pattern as Mother/Doula Home screens)
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

// Navigate to the pending doula approvals list
  // This matches the backend logic:
  // GET /admin/doulas/pending to doulas where verified == false
  const goPendingDoulas = () => {
  closeMenu();
  navigation.navigate("PendingDoulas");
};

   // Logout helper:
  // - calls signOut() (Supabase logout)
  // - resets navigation stack to AppGate so you can't go "Back" into admin pages
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


      {/* MAIN CONTENT
          View/Text/Image mirrors  Mother/Doula home layout
      */}
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
  onPress={() => navigation.navigate("AdminResourcesScreen")}
>
  <Ionicons
    name="book-outline"
    size={20}
    color={COLORS.accent}
    style={styles.menuIcon}
  />
  <Text style={styles.menuItemText}>Manage Resources</Text>
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

//https://reactnative.dev/docs/stylesheet- Modified for admin home screen same as mother and doula
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
