/*
  Private Chat Screen (Mother to Doula)

  What this screen does:
  - Displays a private 1-to-1 message thread between a mother and a doula.
  - Fetches the full message history for a specific conversation using
    GET /messages/thread (mother_auth_id and doula_auth_id).
  - Allows the logged-in user to send messages using POST /messages/send.
  - Marks messages as read for the current user when the screen is opened
    using POST /messages/mark-read.
  - Updates the UI immediately after sending a message.

  How this differs from CommunityChat:
  - This screen is private (only one mother and one doula).
  - Messages are persisted in the SQL database (messages table).
  - Message visibility is role-based (read_by_mother / read_by_doula).
  - Uses REST API calls instead of WebSockets.

  Similar patterns to CommunityChat:
  - Uses FlatList to render a scrolling list of messages.
  - Aligns message bubbles left/right depending on sender.
  - Uses controlled TextInput for composing messages.

  References used:
  - React Native FlatList:
    https://reactnative.dev/docs/flatlist
  - React Native TextInput:
    https://reactnative.dev/docs/textinput
  - React Native TouchableOpacity:
    https://reactnative.dev/docs/touchableopacity
  - React hooks (useEffect / useState):
    https://react.dev/reference/react/useEffect
    https://react.dev/reference/react/useState
  - Chat UI patterns (bubble alignment with Flexbox):
    https://reactnative.dev/docs/flexbox
  - REST-based message APIs:
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
*/
import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
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

export default function PrivateChatScreen({ route }) {
  const { role, motherAuthId, doulaAuthId, otherName } = route.params;

   // Local state for auth identity, loading state, message list, and input text
  // Reference: useState hook
  const [myAuthId, setMyAuthId] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [messages, setMessages] = React.useState([]);
  const [text, setText] = React.useState("");

  // Load the currently authenticated user's auth UUID from Supabase
  // Reference: Supabase auth.getSession()
  React.useEffect(() => {
    const loadMe = async () => {
      const { data } = await supabase.auth.getSession();
      setMyAuthId(data?.session?.user?.id || null);
    };
    loadMe();
  }, []);

  // Fetch the full message history for this mother to doula pair
  // REST GET pattern adapted

  const loadThread = async () => {
    try {
      setLoading(true);

       // GET /messages/thread retrieves all messages ordered by timestamp
      const res = await api.get("/messages/thread", {
        params: {
          mother_auth_id: motherAuthId,
          doula_auth_id: doulaAuthId,
        },
      });

      setMessages(res.data || []);


       // Mark messages as read for the current role after loading
      // POST /messages/mark-read updates read_by_mother / read_by_doula
      await api.post("/messages/mark-read", {
        mother_auth_id: motherAuthId,
        doula_auth_id: doulaAuthId,
        role,
      });
    } catch (e) {
      console.warn("Thread load failed", e?.message || e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

   // Load the conversation when both participant IDs are available
  React.useEffect(() => {
    if (motherAuthId && doulaAuthId) loadThread();
  }, [motherAuthId, doulaAuthId]);

    // Send a new message using a REST POST request
  // Server determines sender role
  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !myAuthId) return;

    const receiverAuthId = role === "mother" ? doulaAuthId : motherAuthId;

    try {
      await api.post(
        "/messages/send",
        { receiver_auth_id: receiverAuthId, text: trimmed },
        { params: { sender_auth_id: myAuthId, sender_role: role } }
      );

      setText("");
      // Reload thread so UI reflects the new message immediately
      await loadThread(); // reload after send
    } catch (e) {
      console.warn("Send failed", e?.message || e);
    }
  };

   // Loading indicator while fetching message history
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading…</Text>
      </View>
    );
  }

  // FlatList renders the full message thread efficiently
// Reference: https://reactnative.dev/docs/flatlist

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chat with {otherName || "User"}</Text>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender_role === role ? styles.mine : styles.other,
            ]}
          >
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 12,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "80%",
  },
  mine: { alignSelf: "flex-end", backgroundColor: COLORS.primary },
  other: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  msgText: { color: COLORS.text },
  inputRow: {
    flexDirection: "row",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  sendText: { color: "white", fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
