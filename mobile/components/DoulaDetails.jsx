import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
  Platform,
} from "react-native";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
  muted: "#6b6b6b",
  success: "#2e7d32",
};

const PLACEHOLDER = "https://placehold.co/300x300/FFF7F2/8C6A86?text=No+Photo";

const formatEUR = (n) => (typeof n === "number" ? `€${Number(n).toFixed(0)}` : null);

export default function DoulaDetails({ route, navigation }) {
  const { id } = route.params || {};
  const [doula, setDoula] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/doulas/${id}`);
        setDoula(data);
        navigation.setOptions({ title: data?.name || "Profile" });
      } catch (e) {
        console.error("GET /doulas/:id failed", e?.message || e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!doula)
    return (
      <View style={styles.center}>
        <Text style={{ color: "crimson" }}>Doula not found.</Text>
      </View>
    );

  const open = (url) => url && Linking.openURL(url);
  const basePrice = formatEUR(doula.price);
  const bundlePrice = formatEUR(doula.price_bundle);
  const years = doula.years_experience;

  return (
    <ScrollView style={{ backgroundColor: COLORS.background }}>
      {/* ---------- Header Card ---------- */}
      <View style={styles.headerCard}>
        <Image
          source={{ uri: doula.photo_url || PLACEHOLDER }}
          style={styles.photo}
          resizeMode="cover"
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{doula.name}</Text>

          {doula.verified ? (
            <Text style={styles.verified}> Verified Doula</Text>
          ) : null}

          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}> Location</Text>
            <Text style={styles.value}>{doula.location}</Text>

            {basePrice && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}> Rate</Text>
                <Text style={styles.value}>
                  {basePrice}
                  {doula.price_caption ? (
                    <Text style={styles.caption}> — {doula.price_caption}</Text>
                  ) : null}
                </Text>
              </>
            )}

            {bundlePrice && (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}> Bundle Option</Text>
                <Text style={styles.value}>
                  {bundlePrice}
                  {doula.bundle_caption ? (
                    <Text style={styles.caption}> — {doula.bundle_caption}</Text>
                  ) : null}
                </Text>
              </>
            )}

            {years ? (
              <>
                <Text style={[styles.label, { marginTop: 8 }]}> Experience</Text>
                <Text style={styles.value}>
                  {years} {years === 1 ? "year" : "years"} of experience
                </Text>
              </>
            ) : null}
          </View>
        </View>
      </View>

      {/* ---------- Info Sections ---------- */}
      {doula.qualifications && (
        <Section title="Qualifications" text={doula.qualifications} />
      )}

      {doula.certificate_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificate</Text>
          {Platform.OS === "web" ? (
            <a
              href={doula.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.linkWeb}
            >
              View Certificate
            </a>
          ) : (
            <TouchableOpacity onPress={() => open(doula.certificate_url)}>
              <Text style={styles.linkNative}>View Certificate</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {doula.services && (
        <Section title="Services" text={doula.services} />
      )}

      {doula.bio && (
        <Section title="About" text={doula.bio} />
      )}

      {/* ---------- Buttons ---------- */}
      <View style={styles.actionsRow}>

        <TouchableOpacity
          style={styles.action}
          onPress={() => navigation.navigate("AddBooking", { presetDoulaId: doula.id })}
        >
          <Text style={styles.actionText}>Book Consultation</Text>
        </TouchableOpacity>

        {doula.email ? (
          <TouchableOpacity
            style={styles.action}
            onPress={() => open(`mailto:${doula.email}`)}
          >
            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>
        ) : null}

        {doula.intro_video_url ? (
          <TouchableOpacity
            style={styles.actionOutline}
            onPress={() => open(doula.intro_video_url)}
          >
            <Text style={[styles.actionText, { color: COLORS.accent }]}>
              Intro Video
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

/* ---------- Helper Section Component ---------- */
function Section({ title, text }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },

  headerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    margin: 16,
    gap: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#eee",
  },
  name: { fontSize: 24, fontWeight: "800", color: COLORS.accent },
  verified: { color: COLORS.success, fontWeight: "700", marginTop: 2 },

  label: { color: COLORS.accent, fontWeight: "600", fontSize: 14 },
  value: { color: COLORS.text, fontSize: 15, marginTop: 2 },
  caption: { color: COLORS.muted, fontWeight: "400", fontSize: 14 },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
  },
  sectionTitle: {
    fontWeight: "700",
    color: COLORS.accent,
    fontSize: 16,
    marginBottom: 6,
  },
  body: { color: COLORS.text, lineHeight: 20 },

  linkNative: {
    color: COLORS.accent,
    textDecorationLine: "underline",
    marginTop: 4,
  },
  linkWeb: {
    color: COLORS.accent,
    textDecoration: "underline",
    marginTop: 4,
    display: "inline-block",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginHorizontal: 16,
  },
  action: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionText: { color: COLORS.white, fontWeight: "700" },
  actionOutline: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
});
