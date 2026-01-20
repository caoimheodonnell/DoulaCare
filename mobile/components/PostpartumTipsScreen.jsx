/*
  PostpartumTipsScreen – Postpartum Information and Guidance

  What this screen does:
  - Provides mothers with calm, reliable postpartum information
  - Uses trusted, up-to-date health sources (HSE, NHS, WHO)
  - Uses the same colour palette and layout as HelpScreen for consistency
  - Opens external articles using the Linking API

  Information sources:
  -https://www.hse.ie/eng/services/list/4/mental-health-services/connecting-for-life/strategy-implementation/local-action-plans/post-birth-wellbeing-plan.pdf
  -https://www2.hse.ie/pregnancy-birth/birth/health-after-birth/recovering/
  -https://www.hse.ie/eng/health/child/breastfeeding/
  -https://www.babycenter.com/baby/postpartum-health/postpartum-fatigue-how-to-cope_1152217
  -https://www.who.int/publications/i/item/9789240045989

  React Native references used:
  - ScrollView (scrollable content):
    https://reactnative.dev/docs/scrollview
  - Linking API (open external websites):
    https://reactnative.dev/docs/linking
  - TouchableOpacity (tappable buttons):
    https://reactnative.dev/docs/touchableopacity
  - StyleSheet (consistent styling):
    https://reactnative.dev/docs/stylesheet
*/
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
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

// Centralised list of postpartum cards so  can filter/search easily
// found reliable sources to ensure good information
const TIPS = [
  {
    title: "Emotional wellbeing after birth",
    desc:
      "Mood changes are common after childbirth. Learn what is normal, what may need support, and where to get help.",
    url:
      "https://www.hse.ie/eng/services/list/4/mental-health-services/connecting-for-life/strategy-implementation/local-action-plans/post-birth-wellbeing-plan.pdf",
    sourceLabel: "Read HSE guidance",
    tags: ["emotional", "mental", "mood", "anxiety", "depression", "wellbeing"],
  },
  {
    title: "Physical recovery",
    desc:
      "Understand bleeding, stitches, pain, and healing timelines after vaginal or caesarean birth.",
    url: "https://www2.hse.ie/pregnancy-birth/birth/health-after-birth/recovering/",
    sourceLabel: "Read HSE advice",
    tags: ["recovery", "physical", "healing", "pain", "stitches", "bleeding"],
  },
  {
    title: "Feeding your baby",
    desc:
      "Whether breastfeeding or formula feeding, support is available. Learn about common challenges and where to get help.",
    url: "https://www.hse.ie/eng/health/child/breastfeeding/",
    sourceLabel: "Feeding support (HSE)",
    tags: ["feeding", "breastfeeding", "formula", "latching", "milk"],
  },
  {
    title: "Sleep and exhaustion",
    desc:
      "Extreme tiredness is common after birth. Find realistic strategies to cope safely during this time.",
    url:
      "https://www.babycenter.com/baby/postpartum-health/postpartum-fatigue-how-to-cope_1152217",
    sourceLabel: "Managing tiredness",
    tags: ["sleep", "tired", "exhaustion", "fatigue", "rest"],
  },
  {
    title: "When to seek urgent help",
    desc:
      "Learn the warning signs that require urgent medical or emotional support.",
    url: "https://www.who.int/publications/i/item/9789240045989",
    sourceLabel: "WHO safety guidance",
    tags: ["urgent", "danger", "warning", "help", "safety"],
  },
];

// Controlled input state: same pattern as UsersMobile search bar (useState and onChangeText)
export default function PostpartumTipsScreen({ navigation }) {
  const [query, setQuery] = React.useState("");

  // Filters the tips list by title OR tags
   // Filter the list when query changes (search “sleep” to show sleep article)
  // useMemo keeps filtering fast by re running only when query changes.
  //  https://react.dev/reference/react/useMemo
  const filteredTips = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TIPS;

    return TIPS.filter((t) => {
      // Search across multiple fields so users can type natural words like “tired” or “milk”
      const inTitle = t.title.toLowerCase().includes(q);
      const inDesc = t.desc.toLowerCase().includes(q);
      const inTags = (t.tags || []).some((tag) => tag.includes(q));
      return inTitle || inDesc || inTags;
    });
  }, [query]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Postpartum Tips</Text>

      <Text style={styles.subtitle}>
        Search a topic like sleep, feeding, recovery, or wellbeing to find trusted guidance.
      </Text>

      {/* Quick navigation: if user wants in-app coping exercises instead of reading articles */}
<TouchableOpacity
  style={[styles.button, { marginBottom: 12 }]}
  onPress={() => navigation.navigate("CopingTools")}
>
  <Text style={styles.buttonText}>Open Coping Tools</Text>
</TouchableOpacity>

       {/* Search input (controlled TextInput):
          - value comes from state
          - onChangeText updates state and triggers the filtered list UI
          Reference: https://reactnative.dev/docs/textinput
      */}
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search tips… (e.g., sleep)"
        autoCapitalize="none"
        returnKeyType="search"
      />

      {/* If search returns no matches, show a helpful empty state */}
      {filteredTips.length === 0 && (
        <Text style={styles.empty}>
          No results for “{query}”. Try “sleep”, “feeding”, or “recovery”.
        </Text>
      )}

      {/* Render only the filtered cards */}
      {filteredTips.map((tip) => (
        <View key={tip.title} style={styles.card}>
          <Text style={styles.cardTitle}>{tip.title}</Text>
          <Text style={styles.cardText}>{tip.desc}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => Linking.openURL(tip.url)}
          >
            <Text style={styles.buttonText}>{tip.sourceLabel}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.accent,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.9,
    marginBottom: 12,
  },

  // Search bar styling matches your palette
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
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 6,
  },
  cardText: { fontSize: 14, color: COLORS.text, marginBottom: 10 },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "700" },
});