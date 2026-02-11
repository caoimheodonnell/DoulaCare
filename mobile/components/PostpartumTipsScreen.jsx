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
*/import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
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

export default function PostpartumTipsScreen({ navigation }) {
  const [query, setQuery] = React.useState("");
  const [tips, setTips] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/resources");
        setTips(res.data || []);
      } catch (e) {
        console.warn("Failed to load resources", e?.message || e);
        setTips([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredTips = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tips;

    return tips.filter((t) => {
      const title = (t.title || "").toLowerCase();
      const desc = (t.description || "").toLowerCase();
      const tags = (t.tags || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim());

      return title.includes(q) || desc.includes(q) || tags.some((tag) => tag.includes(q));
    });
  }, [query, tips]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Postpartum Tips</Text>

      <Text style={styles.subtitle}>
        Search a topic like sleep, feeding, recovery, or wellbeing to find trusted guidance.
      </Text>

      <TouchableOpacity
        style={[styles.button, { marginBottom: 12 }]}
        onPress={() => navigation.navigate("CopingTools")}
      >
        <Text style={styles.buttonText}>Open Coping Tools</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search tips… (e.g., sleep)"
        autoCapitalize="none"
        returnKeyType="search"
      />

      {/* Helpful debug/empty states */}
      {loading && <Text style={styles.empty}>Loading resources…</Text>}

      {!loading && tips.length === 0 && (
        <Text style={styles.empty}>No resources found (database returned 0 rows).</Text>
      )}

      {!loading && tips.length > 0 && filteredTips.length === 0 && (
        <Text style={styles.empty}>
          No results for “{query}”. Try “sleep”, “feeding”, or “recovery”.
        </Text>
      )}

      {filteredTips.map((tip) => (
        <View key={String(tip.id ?? tip.title)} style={styles.card}>
          <Text style={styles.cardTitle}>{tip.title}</Text>
          <Text style={styles.cardText}>{tip.description}</Text>


          <TouchableOpacity style={styles.button} onPress={() => Linking.openURL(tip.url)}>
            <Text style={styles.buttonText}>{tip.source_label || "Read more"}</Text>
            {/* was tip.sourceLabel */}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

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
  cardText: { fontSize: 14, color: COLORS.text, marginBottom: 10 },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "700" },
});
