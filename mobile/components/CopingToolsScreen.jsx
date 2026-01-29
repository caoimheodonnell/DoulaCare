/*
  CopingToolsScreen

  What this screen does:
  - Gives mothers quick coping exercises they can do immediately in-app
    (breathing, grounding, journaling prompts, sleep wind-down tips).
  - Includes a search/filter so users can type “sleep” or “panic” and
    instantly see the relevant coping tools.
  - Adds navigation shortcuts to - this helps connect other useful resources in the app:
    - HelpScreen (helplines)
    - CommunityChat (peer support)


  How this differs from PostpartumTipsScreen:
  - PostpartumTips = external health articles opened with Linking.openURL
  - CopingTools = practical exercises inside the app

  References used:
  - TextInput (search bar): https://reactnative.dev/docs/textinput
  - TouchableOpacity (expand tool and navigation buttons): https://reactnative.dev/docs/touchableopacity
  - Flexbox layout (button rows, alignment): https://reactnative.dev/docs/flexbox
  - useState (UI state: query, expanded card): https://react.dev/reference/react/useState
*/
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

// Coping tools live inside the app
/*
  TOOLS data is stored as an array (like  TIPS array in PostpartumTipsScreen).
  Difference from PostpartumTips:
  - PostpartumTips opens external links (Linking.openURL)
  - CopingTools stays fully inside the app: each tool has "steps" displayed on screen.
*/
const TOOLS = [
  {
    id: "breathing",
    title: "Box Breathing (1 minute)",
    preview: "A quick breathing pattern to calm your nervous system.",
    tags: ["anxiety", "panic", "stress", "breathing", "calm"],
    steps: [
      "Inhale for 4 seconds.",
      "Hold for 4 seconds.",
      "Exhale for 4 seconds.",
      "Hold for 4 seconds.",
      "Repeat 4 rounds.",
    ],
  },
  {
    id: "grounding",
    title: "5–4–3–2–1 Grounding",
    preview: "Helps when you feel overwhelmed or disconnected.",
    tags: ["panic", "overwhelm", "grounding", "anxiety"],
    steps: [
      "Name 5 things you can see.",
      "Name 4 things you can feel.",
      "Name 3 things you can hear.",
      "Name 2 things you can smell.",
      "Name 1 thing you can taste (or 1 slow breath).",
    ],
  },
  {
    id: "sleepreset",
    title: "Sleep Reset (when you’re exhausted)",
    preview: "A tiny wind-down plan that works even with broken sleep.",
    tags: ["sleep", "tired", "fatigue", "rest"],
    steps: [
      "Drink water (even a few sips).",
      "Lower the room light / screen brightness.",
      "One small snack if you haven’t eaten.",
      "Lie down and do 10 slow breaths.",
      "Tell yourself: “Rest is still helpful, even if I don’t sleep.”",
    ],
  },
  {
    id: "reframe",
    title: "Kind Self-talk Reframe",
    preview: "Swap harsh thoughts for supportive ones in 30 seconds.",
    tags: ["guilt", "shame", "confidence", "mood"],
    steps: [
      "Notice the thought: “I’m failing.”",
      "Replace with: “I’m having a hard moment, and I’m still a good mum.”",
      "Ask: “What would I say to a friend in this situation?”",
    ],
  },
  {
    id: "journal",
    title: "2-Minute Journal Prompt",
    preview: "Helps you reminding thoughts when your mind won’t stop.",
    tags: ["mood", "anxiety", "stress", "journal"],
    steps: [
      "Write: “Right now I’m feeling…”",
      "Write: “One thing that is hard is…”",
      "Write: “One tiny thing that could help is…”",
      "Write: “One thing I did today (even small) was…”",
    ],
  },
];

 /*
    Controlled input state (same pattern as UsersMobile and PostpartumTipsScreen):
    - query holds what the user typed
    - setQuery updates it
    Reference: https://reactnative.dev/docs/textinput
  */
export default function CopingToolsScreen({ navigation }) {
  const [query, setQuery] = React.useState("");
   /*
    expandedId tracks which tool card is "open".
    This is the key difference from PostpartumTips:
    - PostpartumTips just shows cards and link buttons
    - This screen expands/collapses a tool to show steps inside the app
  */
  const [expandedId, setExpandedId] = React.useState(null);

  /*
    Filter tools when the query changes (same idea as your PostpartumTips filter).
    useMemo keeps filtering efficient by only re-running when query changes.
    Reference: https://react.dev/reference/react/useMemo
  */
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;

    return TOOLS.filter((t) => {
      const inTitle = t.title.toLowerCase().includes(q);
      const inPreview = t.preview.toLowerCase().includes(q);
      const inTags = (t.tags || []).some((tag) => tag.includes(q));
      return inTitle || inPreview || inTags;
    });
  }, [query]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Coping Tools</Text>

      <Text style={styles.subtitle}>
        Quick, practical tools you can do right now. Search “sleep”, “panic”, or “stress”.
      </Text>

      {/* Search bar (controlled TextInput like PostpartumTips / UsersMobile) */}
       {/*
        Search bar:
        - value={query} makes it controlled by state
        - onChangeText updates state which triggers filtered list to update
      */}
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search coping tools… (e.g., sleep)"
        autoCapitalize="none"
      />

      {filtered.length === 0 && (
        <Text style={styles.empty}>
          No tools found for “{query}”. Try “sleep” or “panic”.
        </Text>
      )}

      {/* Tool cards */}
      {/*
        Tool cards:
        - Similar layout to PostpartumTips cards (title,text, button)
        - Instead of Linking.openURL, the "Start" button toggles step visibility
        - Collapsible content (same pattern as showPriceFilters && (...) in UsersMobile):
        -  steps only render when this card is expanded.

        Reference for TouchableOpacity: https://reactnative.dev/docs/touchableopacity
        Refrence for Map: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
      */}
      {filtered.map((tool) => {
        const isOpen = expandedId === tool.id;

        return (
          <View key={tool.id} style={styles.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{tool.title}</Text>
                <Text style={styles.cardText}>{tool.preview}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.smallBtn,
                  { backgroundColor: isOpen ? COLORS.accent : COLORS.primary },
                ]}
                onPress={() => setExpandedId(isOpen ? null : tool.id)}
              >
                <Text style={styles.smallBtnText}>{isOpen ? "Hide" : "Start"}</Text>
              </TouchableOpacity>
            </View>

            {/* Expandable steps */}
            {/*
              Steps are only shown if the card is expanded.
              This makes the screen feel less overwhelming (one tool at a time).
              - same as the price filter in users mobile
              -Show a coping tool card for each tool in the list
              -map() is used to display the tools on screen
              -idx starts at 0, so add 1 to display steps starting from 1


            */}
            {isOpen && (
              <View style={styles.stepsBox}>
                {tool.steps.map((s, idx) => (
                  <Text key={idx} style={styles.stepText}>
                    {idx + 1}. {s}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {/*  Community support box  - uses dashed border to help seperate from other cards */}
      <View style={[styles.card, { borderStyle: "dashed" }]}>
        <Text style={styles.cardTitle}>If you need to talk to people</Text>
        <Text style={styles.cardText}>
          You’re not alone. Join the Community Chat to speak with other mothers and doulas.
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.accent }]}
          onPress={() => navigation.navigate("CommunityChat")}
        >
          <Text style={styles.buttonText}>Open Community Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Helplines box  */}
      <View style={[styles.card, { borderStyle: "dashed" }]}>
        <Text style={styles.cardTitle}>If you feel unsafe or overwhelmed</Text>
        <Text style={styles.cardText}>
          If you’re at risk of harming yourself or feel you can’t cope, please use the helplines screen
          or call emergency services.
        </Text>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Help")}>
          <Text style={styles.buttonText}>Open Helplines</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
//https://reactnative.dev/docs/stylesheet- Modified for coping tools
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.accent, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.text, opacity: 0.9, marginBottom: 12 },

  search: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },

  empty: { color: COLORS.text, opacity: 0.8, marginBottom: 12 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.accent, marginBottom: 6 },
  cardText: { fontSize: 14, color: COLORS.text, marginBottom: 0 },

  smallBtn: { alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  smallBtnText: { color: "white", fontWeight: "800" },

  stepsBox: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  stepText: { color: COLORS.text, marginBottom: 6 },

  button: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "700" },
});
