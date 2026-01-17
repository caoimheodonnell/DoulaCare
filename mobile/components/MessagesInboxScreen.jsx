/*
  Messages Inbox Screen

  What this screen does:
  - Displays a list of private chat conversations (threads) for the logged-in user.
  - Shows one row per mother ↔ doula conversation.
  - Displays the last message preview and unread message count per thread.
  - Navigates to the PrivateChatScreen when a thread is selected.

  How this fits into the messaging system:
  - Acts as the entry point to private messaging.
  - Uses REST APIs to fetch conversation metadata (not message-by-message).
  - Complements PrivateChatScreen, which handles full message history.

  References used:
  - React Native FlatList (efficient list rendering):
    https://reactnative.dev/docs/flatlist
  - React Native TouchableOpacity (pressable thread rows):
    https://reactnative.dev/docs/touchableopacity
  - React hooks (useState / useEffect):
    https://react.dev/reference/react/useState
    https://react.dev/reference/react/useEffect
  - REST-based inbox architecture:
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
*/
import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

export default function MessagesInboxScreen({ navigation, route }) {
  // Role determines whether unread counts are based on read_by_mother or read_by_doula
  const role = route.params?.role || "mother"; // pass "doula" or "mother"
   // Stores the authenticated user's Supabase auth UUID
  const [authId, setAuthId] = React.useState(null);

  // Stores the list of conversation threads returned from the backend
  const [threads, setThreads] = React.useState([]);
  // Loading flag for initial inbox fetch
  const [loading, setLoading] = React.useState(true);

  // Load the current user's auth ID from Supabase
  // Reference: Supabase auth.getSession()
  React.useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setAuthId(data?.session?.user?.id || null);
    };
    load();
  }, []);

  // Fetch inbox threads for the logged-in user
  // GET /messages/inbox returns grouped conversations instead of raw messages
  const loadInbox = async () => {
    if (!authId) return;
    try {
      setLoading(true);
      const res = await api.get("/messages/inbox", {
        params: { user_auth_id: authId, role },
      });
      setThreads(res.data || []);
    } catch (e) {
      console.warn("Inbox load failed", e?.message || e);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  // Load inbox once auth ID is available
  // Reference: useEffect dependency pattern

  React.useEffect(() => {
    if (authId) loadInbox();
  }, [authId]);

   // Show a loading indicator while inbox data is being fetched
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

   /*
            Each row is pressable and navigates to PrivateChatScreen.
            TouchableOpacity provides visual feedback on press.
            Reference: https://reactnative.dev/docs/touchableopacity
          */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={threads}
        keyExtractor={(t) => String(t.thread_key)}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={{ marginTop: 8, color: COLORS.text }}>
            No messages yet.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              navigation.navigate("PrivateChat", {
                role,
                motherAuthId: item.mother_auth_id,
                doulaAuthId: item.doula_auth_id,
                otherName: item.other_name,
              });
            }}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={COLORS.accent}
              style={{ marginRight: 10 }}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.other_name}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.last_text || ""}
              </Text>
            </View>

            {item.unread_count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.accent,
    padding: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    marginBottom: 10,
  },
  name: { fontWeight: "800", color: COLORS.text, marginBottom: 2 },
  preview: { color: COLORS.text, opacity: 0.7, fontSize: 13 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "white", fontWeight: "800", fontSize: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
