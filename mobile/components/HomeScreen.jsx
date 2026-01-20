// components/HomeScreen.jsx
/*
  Navigation:
    - Uses `CommonActions.navigate()` from @react-navigation/native - https://reactnavigation.org/docs/navigation-actions/
      to move between screens within the Doulas stack
    - The logo is a clickable button that brings you back to Home
    - used this video for icons for bottom navigation and menu- https://www.youtube.com/watch?v=AnjyzruZ36E
    - Icons - https://ionic.io/ionicons

    React Native components used in this screen:
     - TouchableOpacity (pressable button): https://reactnative.dev/docs/touchableopacity
     - Navigate : https://reactnavigation.org/docs/navigation-actions/ - seen for each menu option
     - TextInput (form fields):              https://reactnative.dev/docs/textinput
     - View - base container for layout (like a <div> on web):  https://reactnative.dev/docs/view
     - Text - displays static text: https://reactnative.dev/docs/text
     - Image - renders the local DoulaCare logo: https://reactnative.dev/docs/image
     - Modal - menu modal view - https://reactnative.dev/docs/modal


  Purpose:
    This Home screen acts as the entry point of the app,
    allowing users to browse doulas or create a new profile.
*/
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "../auth";
import { supabase } from "../supabaseClient";
import { checkMessageNotifications } from "../notifications";


const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

const LOGO = require("../assets/doulacare-logo.png");

export default function HomeScreen({ navigation }) {
  const [menuVisible, setMenuVisible] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
  const run = async () => {
    const { data } = await supabase.auth.getSession();
    const authId = data?.session?.user?.id;
    if (!authId) return;

    //  DIFFERENT FROM DOULA: role is "mother"
    const count = await checkMessageNotifications(authId, "mother");
    setUnreadCount(count);
  };

  run();
}, []);

  // Open and close menu helpers
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // Navigate to Browse Doulas screen
  const goBrowse = () => {
    closeMenu();
    navigation.dispatch(
      CommonActions.navigate({ name: "Doulas", params: { screen: "Browse" } })
    );
  };

  // Navigate to Community Chat screen
  const goChat = () => {
    closeMenu();
    navigation.dispatch(
      CommonActions.navigate({
        name: "Doulas",
        params: { screen: "CommunityChat" },
      })
    );
  };

  // Navigate to Help and Support screen
  const goHelp = () => {
    closeMenu();
    navigation.dispatch(
      CommonActions.navigate({
        name: "Doulas",
        params: { screen: "Help" },
      })
    );
  };

  // Navigate to Postpartum Tips screen
  const goPostpartumTips = () => {
    closeMenu();
    navigation.dispatch(
      CommonActions.navigate({
        name: "Doulas",
        params: { screen: "PostpartumTips" },
      })
    );
  };

  // Navigate to Coping Tools screen
const goCopingTools = () => {
  closeMenu();
  navigation.dispatch(
    CommonActions.navigate({
      name: "Doulas",
      params: { screen: "CopingTools" },
    })
  );
};

  // Navigate to bookings screen for the logged-in mother
  const goMotherBookings = () => {
    closeMenu();
    navigation.dispatch(
      CommonActions.navigate({
        name: "Doulas",
        params: { screen: "MotherBookings" },
      })
    );
  };

  // Navigate to favourites screen for the logged-in mother
const goMotherFavourites = () => {
  closeMenu();
  navigation.dispatch(
    CommonActions.navigate({
      name: "Doulas",
      params: { screen: "MotherFavourites" },
    })
  );
};

const goMessages = () => {
  closeMenu();
  navigation.dispatch(
    CommonActions.navigate({
      name: "Doulas",
      params: { screen: "MessagesInbox", params: { role: "mother" } },
    })
  );
};



  // logout helper
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
        <Text style={styles.subtitle}>
          Find, book, and manage doulas with ease.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={goBrowse}>
          <Text style={styles.primaryButtonText}>Browse Doulas</Text>
        </TouchableOpacity>
      </View>

      {/* OVERLAY MENU - https://reactnative.dev/docs/modal*/}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        {/* tap outside to close */}
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          {/* IMPORTANT: stop taps inside menu from closing it */}
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.menu}>
              <Text style={styles.menuTitle}>Menu</Text>

              <TouchableOpacity style={styles.menuItem} onPress={goBrowse}>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Browse Doulas</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={goMotherBookings}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>My Bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={goChat}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Community Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={goHelp}>
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Helplines & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={goPostpartumTips}>
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={COLORS.accent}
                  style={styles.menuIcon}
                />
                <Text style={styles.menuItemText}>Postpartum Tips</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={goCopingTools}>
  <Ionicons
    name="sparkles-outline"
    size={20}
    color={COLORS.accent}
    style={styles.menuIcon}
  />
  <Text style={styles.menuItemText}>Coping Tools</Text>
</TouchableOpacity>


              <TouchableOpacity style={styles.menuItem} onPress={goMotherFavourites}>
  <Ionicons
    name="heart"
    size={20}
    color={COLORS.accent}
    style={styles.menuIcon}
  />
  <Text style={styles.menuItemText}>My Favourites</Text>
</TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={goMessages}>
  <Ionicons
    name="chatbubble-ellipses-outline"
    size={20}
    color={COLORS.accent}
    style={styles.menuIcon}
  />
  <Text style={styles.menuItemText}>
    Messages{unreadCount > 0 ? ` (${unreadCount})` : ""}
  </Text>
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

//https://reactnative.dev/docs/stylesheet- Modified for homescreen
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
  headerLogo: { width: 36, height: 36, borderRadius: 18 },
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
    minWidth: 220,
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


