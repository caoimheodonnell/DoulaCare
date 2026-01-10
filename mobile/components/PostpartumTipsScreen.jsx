/*
  PostpartumTipsScreen – Postpartum Information & Guidance (React Native)

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
} from "react-native";

/*
  Colour palette reused from HelpScreen
  Ensures visual consistency across support-related screens
*/
const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

export default function PostpartumTipsScreen() {
  return (
    /*
      ScrollView allows content to be readable on smaller devices
      without overwhelming the user
    */
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>

      {/* Screen heading */}
      <Text style={styles.title}>Postpartum Tips</Text>

      {/* Short supportive introduction */}
      <Text style={styles.subtitle}>
        Gentle guidance and trusted information to support you in the weeks after birth.
      </Text>

      {/* Card 1 – Emotional wellbeing after birth
          Source: HSE Ireland – Postnatal mental health
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Emotional wellbeing after birth</Text>
        <Text style={styles.cardText}>
          Mood changes are common after childbirth. Learn what is normal, what
          may need support, and where to get help.
        </Text>

        {/* Opens HSE article in device browser */}
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Linking.openURL(
              "https://www.hse.ie/eng/services/list/4/mental-health-services/connecting-for-life/strategy-implementation/local-action-plans/post-birth-wellbeing-plan.pdf"
            )
          }
        >
          <Text style={styles.buttonText}>Read HSE guidance</Text>
        </TouchableOpacity>
      </View>

      {/* Card 2 – Physical recovery after birth
          Source: HSE Ireland– Recovery after childbirth
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Physical recovery</Text>
        <Text style={styles.cardText}>
          Understand bleeding, stitches, pain, and healing timelines after
          vaginal or caesarean birth.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Linking.openURL(
              "https://www2.hse.ie/pregnancy-birth/birth/health-after-birth/recovering/"
            )
          }
        >
          <Text style={styles.buttonText}>Read NHS advice</Text>
        </TouchableOpacity>
      </View>

      {/* Card 3 – Feeding support
          Source: HSE Ireland – Breastfeeding and infant feeding
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Feeding your baby</Text>
        <Text style={styles.cardText}>
          Whether breastfeeding or formula feeding, support is available.
          Learn about common challenges and where to get help.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Linking.openURL(
              "https://www.hse.ie/eng/health/child/breastfeeding/"
            )
          }
        >
          <Text style={styles.buttonText}>Feeding support (HSE)</Text>
        </TouchableOpacity>
      </View>

      {/* Card 4 - Sleep and exhaustion
          Source: Baby Center – Coping with tiredness after birth
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sleep and exhaustion</Text>
        <Text style={styles.cardText}>
          Extreme tiredness is common after birth. Find realistic strategies
          to cope safely during this time.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Linking.openURL(
              "https://www.babycenter.com/baby/postpartum-health/postpartum-fatigue-how-to-cope_1152217"
            )
          }
        >
          <Text style={styles.buttonText}>Managing tiredness</Text>
        </TouchableOpacity>
      </View>

      {/* Card 5 – When to seek urgent help
          Source: WHO – Postpartum care and safety
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>When to seek urgent help</Text>
        <Text style={styles.cardText}>
          Learn the warning signs that require urgent medical or emotional support.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            Linking.openURL(
              "https://www.who.int/publications/i/item/9789240045989"
            )
          }
        >
          <Text style={styles.buttonText}>WHO safety guidance</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/*
  Styles intentionally mirror HelpScreen
*/
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
    marginBottom: 16,
  },
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
  cardText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
