// components/ChatScreen.jsx
/*
  Simple community chat screen using WebSockets.

  React Native WebSocket reference (very similar pattern):
    - "WebSocket React Native: A Complete Guide to Real-Time Communication"
      (section: WebSocket Chat App React Native Example)
      https://www.videosdk.live/developer-hub/websocket/websocket-react-native#building-a-real-time-feature-websocket-chat-app-react-native-exampl

  How I adapted the refrence above
  Connects to my FastAPI backend WebSocket endpoint (ws://<IP>:8000/ws/chat)
    - Sends and receives JSON objects, not plain text:
         { sender: "Emma", text: "Hello!", time: "12:30" }
    - Supports nicknames so users are identified
    - Supports real chat between multiple users (broadcast)
    - Better UI (bubbles, alignment, timestamps)- flex box - https://reactnative.dev/docs/flexbox-
    - Handles WebSocket status (connected, disconnected, error)
    - Builds a community group chat, not an echo test

  This screen:
    - Lets the user pick a nickname.
    - Opens one shared WebSocket connection for the whole room.
    - Sends messages as JSON: { sender, text, time }
    - Shows new messages in real-time from everyone connected.
*/

import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

// Similar to VideoSDK setup, but my URL points to my FastAPI WebSocket
const LAN_IP = "172.20.10.2";
const WS_URL =
  Platform.OS === "web"
    ? "ws://127.0.0.1:8000/chat"
    : `ws://${LAN_IP}:8000/chat`;

export default function ChatScreen() {
  const [nickname, setNickname] = React.useState("");
  const [hasJoined, setHasJoined] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [status, setStatus] = React.useState("Connecting…");

  // WebSocket stored in a ref so re-renders don't recreate the socket
  const wsRef = React.useRef(null);

  /*
    WebSocket connection
    Based heavily on the VideoSDK example's pattern.

    What I changed:
      - Used my own FastAPI WebSocket URL
      - Handles JSON instead of plain strings
      - Tracks connection status
      - Receives chat history on connect
  */
  React.useEffect(() => {
    console.log("Connecting to:", WS_URL);

    const socket = new WebSocket(WS_URL);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WS opened");
      setStatus("Connected");
    };

    socket.onclose = (e) => {
      console.log("WS closed", e.code, e.reason);
      setStatus("Disconnected");
    };

    socket.onerror = (e) => {
      console.log("WS error", e);
      setStatus("Error");
    };

    // Message handler – inspired by VideoSDK tutorial
    socket.onmessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      // If server sends chat history (array)
      if (Array.isArray(payload)) {
        const history = payload.map((m) => ({
          id: `${Date.now()}-${Math.random()}`,
          sender: m.sender || "Someone",
          text: m.text || "",
          time: m.time || "",
        }));
        setMessages(history);
        return;
      }

      // Single incoming message
      const item = {
        id: `${Date.now()}-${Math.random()}`,
        sender: payload.sender || "Someone",
        text: payload.text || "",
        time: payload.time || "",
      };

      setMessages((prev) => [...prev, item]);
    };

    // Cleanup when leaving screen
    return () => {
      console.log("Closing WS");
      socket.close();
    };
  }, []);

  /*
    Send message logic
    - Sends JSON (sender, text, time)
    - Auto-clears input
    - Prevents sending while disconnected
    - Prevents blank messages
  */
  const sendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== 1) return;

    const now = new Date();
    const payload = {
      sender: nickname || "Anonymous",
      text: trimmed,
      time: now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    console.log("Sending", payload);
    wsRef.current.send(JSON.stringify(payload));
    setMessage("");
  };

  /*
    Message bubble logic
      - Right side for my messages
      - Left side for others
      - Uses flexbox alignment
  */
  const renderItem = ({ item }) => {
    const isMine = item.sender === (nickname || "Anonymous");

    return (
      <View
        style={[
          styles.msgRow,
          isMine ? styles.msgRowMine : styles.msgRowOther,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleOther,
          ]}
        >
          <Text style={styles.sender}>{item.sender}</Text>
          <Text style={styles.msgText}>{item.text}</Text>
          {!!item.time && <Text style={styles.time}>{item.time}</Text>}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Chat</Text>
        <Text style={styles.headerStatus}>{status}</Text>
      </View>

      {/* Nickname picker */}
      {!hasJoined && (
        <View style={styles.nicknameBox}>
          <Text style={styles.nicknameLabel}>
            Choose a nickname to join the chat:
          </Text>
          <TextInput
            style={styles.nicknameInput}
            placeholder="e.g. Emma, New Mum, Doula Mary"
            value={nickname}
            onChangeText={setNickname}
          />
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => {
              if (!nickname.trim()) return;
              setHasJoined(true);
            }}
          >
            <Text style={styles.joinBtnText}>Join Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <FlatList
        style={styles.list}
        contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 12 }}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />

      {/* Input bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={
            hasJoined ? "Type a message…" : "Enter a nickname above first…"
          }
          editable={hasJoined}
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!hasJoined || !message.trim()) && styles.sendBtnDisabled,
          ]}
          onPress={sendMessage}
          disabled={!hasJoined || !message.trim()}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.accent,
  },
  headerStatus: {
    fontSize: 12,
    color: COLORS.text,
    opacity: 0.7,
  },
  nicknameBox: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  nicknameLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: COLORS.text,
  },
  nicknameInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: COLORS.background,
  },
  joinBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  joinBtnText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  list: {
    flex: 1,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  msgRowMine: {
    justifyContent: "flex-end",
  },
  msgRowOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bubbleMine: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 0,
  },
  bubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sender: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 2,
  },
  msgText: {
    fontSize: 14,
    color: COLORS.text,
  },
  time: {
    fontSize: 10,
    color: COLORS.text,
    opacity: 0.6,
    marginTop: 4,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});