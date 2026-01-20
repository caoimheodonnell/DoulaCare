

/*
  HelpScreen – Helplines and Support (React Native)

  What this screen does:
  - Shows a scrollable list of Irish mental health / parenting supports
  - Lets the user tap a button to open the phone dialer or a website
  - Simple, low-stress layout for when a mother feels overwhelmed

  Content references (for the helpline information):
  - Parentline (postnatal depression support info):
    https://parentline.ie/postnatal-depression/
  - Mental Health Ireland – Need Help Now:
    https://www.mentalhealthireland.ie/need-help-now/
    -Anxiety and Depression Support-https://www.aware.ie/
    -Specialised in postnatal depression, birth trauma, anxiety and maternal mental health
    https://nurturehealth.ie/
    -Breastfeeding support
    https://www.lalecheleagueireland.com/

  React Native references used:
  - ScrollView (for vertical scrolling content):
    https://reactnative.dev/docs/scrollview
  - Linking API (to open phone dialer / websites):
    https://reactnative.dev/docs/linking
  - TouchableOpacity (tappable button-style component):
    https://reactnative.dev/docs/touchableopacity
  - View / Text basics:
    https://reactnative.dev/docs/view
    https://reactnative.dev/docs/text
  - StyleSheet for styling:
    https://reactnative.dev/docs/stylesheet
*/

import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from "react-native";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

export default function HelpScreen({ navigation }) {
  return (
      // ScrollView so all support cards are scrollable on smaller phones
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Helplines & Support</Text>
      <Text style={styles.subtitle}>
        If you ever feel overwhelmed, you don't have to cope alone. Here are some supports you can reach out to:
      </Text>
        {/* Navigation so users can go into coping mechanisms  */}
<View style={styles.quickRow}>
  <TouchableOpacity
    style={[styles.quickBtn, { backgroundColor: COLORS.primary }]}
    onPress={() => navigation.navigate("CopingTools")}
  >
    <Text style={styles.quickBtnText}>Coping Tools</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[styles.quickBtn, { backgroundColor: COLORS.accent }]}
    onPress={() => navigation.navigate("PostpartumTips")}
  >
    <Text style={styles.quickBtnText}>Postpartum Tips</Text>
  </TouchableOpacity>
</View>

  {/* Card 1 – Mental Health Ireland / emergency support
          The text is adapted from Mental Health Ireland "Need Help Now" page:
          https://www.mentalhealthireland.ie/need-help-now/
          https://reactnative.dev/docs/linking - used to link the URL
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mental Health Ireland</Text>
        <Text style={styles.cardText}>Call 999 or 112 to reach emergency services and request an ambulance.</Text>
        <Text
    style={styles.linkText}
    onPress={() => Linking.openURL("https://www.mentalhealthireland.ie/")}
  >
    Visit Mental Health Ireland Website
  </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("tel:116123")}
        >
          <Text style={styles.buttonText}>Call Mental Health Ireland</Text>
        </TouchableOpacity>
      </View>
      {/* Card 2 – Parentline support for parents/postnatal depression
          Information source:
          https://parentline.ie/postnatal-depression/
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parentline</Text>
        <Text style={styles.cardText}>Phone: 01 873 3500 / 1890 927 277</Text>
         {/* Clickable Website Link */}
  <Text
    style={styles.linkText}
    onPress={() => Linking.openURL("https://parentline.ie/postnatal-depression/")}
  >
    Visit Parentline Website
  </Text>
        {/* Call Parentline – uses Linking to open the dialer with the number pre–filled */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("tel:018733500")}
        >
          <Text style={styles.buttonText}>Call Parentline</Text>
        </TouchableOpacity>
      </View>
{/* Card 3 – Aware
          Information source:https://www.aware.ie/

      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Aware</Text>
        <Text style={styles.cardText}>Phone: 1800 80 48 48</Text>
         {/* Clickable Website Link */}
  <Text
    style={styles.linkText}
    onPress={() => Linking.openURL("https://www.aware.ie/")}
  >
    Visit Aware Website
  </Text>
        {/* Call Aware – uses Linking to open the dialer with the number pre–filled */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("tel:01 661 7211")}
        >
          <Text style={styles.buttonText}>Call Aware</Text>
        </TouchableOpacity>
      </View>

         {/* Card 4 – Nurture- Specialised in postnatal depression, birth trauma and maternal mental health:
          https://nurturehealth.ie/
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nurture- Specialised in postnatal depression, birth trauma and maternal mental health</Text>
        <Text style={styles.cardText}>Phone: +353 85 861 9585</Text>
         {/* Clickable Website Link */}
  <Text
    style={styles.linkText}
    onPress={() => Linking.openURL("https://nurturehealth.ie/")}
  >
    Visit Nurture Health Website
  </Text>
        {/* Call Nurture Health– uses Linking to open the dialer with the number pre–filled */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("tel:353 85 861 95851")}
        >
          <Text style={styles.buttonText}>Call Nurture Health</Text>
        </TouchableOpacity>
      </View>
{/* Card 5 – La Leche League Ireland – Breastfeeding Support
          https://www.lalecheleagueireland.com/breastfeeding-information
      */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>La Leche League Ireland – Breastfeeding Support</Text>
        <Text style={styles.cardText}>Phone: 01 442 0995</Text>
         {/* Clickable Website Link */}
  <Text
    style={styles.linkText}
    onPress={() => Linking.openURL("https://www.lalecheleagueireland.com/breastfeeding-information")}
  >
    Visit La Leche League Ireland Website
  </Text>
        {/* Call La Leche League Ireland – uses Linking to open the dialer with the number pre–filled */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => Linking.openURL("tel:01 442 0995")}
        >
          <Text style={styles.buttonText}>Call La Leche League Ireland</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

//https://reactnative.dev/docs/stylesheet- Modified for helpscreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
    quickRow: {
  flexDirection: "row",
  gap: 10,
  marginBottom: 16,
},
quickBtn: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: "center",
},
quickBtnText: {
  color: "white",
  fontWeight: "800",
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
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  linkText: {
  fontSize: 14,
  color: COLORS.primary,
  textDecorationLine: "underline",
  marginBottom: 8,
},

  button: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: COLORS.white, fontWeight: "700" },
});
