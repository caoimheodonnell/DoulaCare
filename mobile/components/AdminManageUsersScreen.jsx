/*
  AdminManageUsersScreen (Admin) - Manage user accounts

  What this screen does:
  - Displays all user accounts (mothers and doulas and admins if they exist).
  - Lets an admin delete fake / unused accounts.
  - Uses your existing backend endpoints:
      - GET /users                (loads all users)
      - DELETE /admin/users/{id}  (removes a user)

  How this is SIMILAR to MyBookingsScreen accept/decline logic:
  - Same "load data from backend" pattern:
      - MyBookingsScreen:  GET /bookings/by-doula-auth/{doulaId}
      - This screen:       GET /users
  - Same "action button triggers backend update, then refresh list" pattern:
      - MyBookingsScreen:  updateStatus() to  POST /bookings/{id}/status to loadBookings()
      - This screen:       deleteUser()   to  DELETE /admin/users/{id}  to loadUsers()
  - Same "confirm action" pattern using Alert:
      - MyBookingsScreen: Alert.confirm before Accept/Decline
      - This screen:      Alert.confirm before Delete
  - Same "pull to refresh" idea:
      - MyBookingsScreen: FlatList onRefresh -> loadBookings()
      - This screen:      RefreshControl -> loadUsers()

  React Native component references (same ones you used in bookings screen):
  - View/Text: https://reactnative.dev/docs/view , https://reactnative.dev/docs/text
  - FlatList: https://reactnative.dev/docs/flatlist
  - TouchableOpacity (press handlers): https://reactnative.dev/docs/touchableopacity
  - Alert (confirm modal): https://reactnative.dev/docs/alert
  - RefreshControl (pull-to-refresh): https://reactnative.dev/docs/refreshcontrol


*/

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from "react-native";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

export default function AdminManageUsersScreen({ navigation }) {
    // Local state (same pattern as bookings screen)
  // - MyBookingsScreen: bookings, loading, refreshing
  // - This screen: users, loading
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

   // Load all users from backend (equivalent of loadBookings())
  // GET /users iS existing endpoint in main.py
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users"); // existing endpoint
      setUsers(res.data || []);
    } catch (e) {
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Delete a user (similar to Accept/Decline updateStatus())
  // - MyBookingsScreen: POST /bookings/{id}/status then refresh
  // - This screen:      DELETE /admin/users/{id} then refresh
  const deleteUser = async (userId, name) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      Alert.alert("Deleted", `${name} has been removed.`);
      loadUsers();
    } catch (e) {
      Alert.alert("Error", "Failed to delete user");
    }
  };

   // Render each user (similar idea to renderBooking card)
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name || "Unnamed user"}</Text>
      <Text style={styles.meta}>
        Role: {item.role} • {item.email || "No email"}
      </Text>
{/* Delete action (like Accept/Decline buttons in bookings) */}
      {/* ON press -https://reactnative.dev/docs/handling-touches*/}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() =>
          Alert.alert(
            "Delete user?",
            `Remove ${item.name || "this user"} permanently?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteUser(item.id, item.name),
              },
            ]
          )
        }
      >
        <Text style={styles.deleteText}>Delete User</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginBottom: 12 }}
      >
        <Text style={{ color: COLORS.accent, fontWeight: "700" }}>
          ← Back to Admin Home
        </Text>
      </TouchableOpacity>

      <Text style={styles.title}>Manage Users</Text>
 {/* List of users and pull-to-refresh (same refresh idea as bookings screen) */}
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadUsers} />
        }
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No users found.</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
//https://reactnative.dev/docs/stylesheet- Modified for admin manage users
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.accent,
    marginBottom: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 30,
    color: COLORS.text,
    opacity: 0.7,
  },
  card: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  meta: {
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 8,
  },
  deleteBtn: {
    backgroundColor: "#E25C5C",
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  deleteText: {
    color: COLORS.white,
    fontWeight: "800",
  },
});
