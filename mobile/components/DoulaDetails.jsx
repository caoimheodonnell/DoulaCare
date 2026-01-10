
/*
  DoulaDetails — profile screen for a single doula

  What this screen does:
   - Fetches one doula by id and shows profile info.
   - Opens external links (mailto:, intro video, certificate) safely.
   - Renders a platform-appropriate “View Certificate” control:
       Web  : anchor <a> to open the file in a new tab
       Native: TouchableOpacity + Linking.openURL
   - Navigates to AddBooking with the current doula preselected.

  Where the certificate comes from:
   - Another screen (AddUserFormMobile) uploads a PDF to FastAPI using
     UploadFile on the backend, which saves to /static/certificates/* and
     returns a URL like "/static/certificates/<uuid>.pdf".
   - This screen simply takes that `certificate_url` and opens it.

  References:
   -FastAPI file uploads (UploadFile):
     https://fastapi.tiangolo.com/tutorial/request-files/#file-parameters-with-uploadfile
   -React Native – Linking (open URLs/mailto):
     https://reactnative.dev/docs/linking
   -React Native – Image:
     https://reactnative.dev/docs/image
   -React Native – ScrollView:
     https://reactnative.dev/docs/scrollview
   -React Navigation – setOptions (update header title):
     https://reactnavigation.org/docs/headers#setting-the-header-title
   -General components:
     View/Text/TouchableOpacity/ActivityIndicator/Platform/StyleSheet
     https://reactnative.dev/docs/components-and-apis
   -Youtube:React Native Tutorial 72 - setOptions | React Navigation: How To Set Screen Options-
   https://www.youtube.com/watch?v=fVwwDLwKV9c&t=439s

   - Youtube: Email Validation in JavaScript using Regular Expressions
   https://www.youtube.com/watch?v=4Hi5GoEp5U8
*/

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
import { Ionicons } from "@expo/vector-icons";
import api from "../api";
// Used to retrieve and display images and PDFs correctly from the FastAPI backend.
// The fixUrl() helper replaces localhost/relative URLs with the full BASE_URL,
// so files load properly on Expo Go, Android, iOS, and web
import { toAbsolute } from "../api"

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

// Placeholder if a doula hasn’t uploaded a photo yet
const PLACEHOLDER = "https://placehold.co/300x300/FFF7F2/8C6A86?text=No+Photo";

// Helper: format numbers as whole-euro strings (e.g. €120)
const formatEUR = (n) => (typeof n === "number" ? `€${Number(n).toFixed(0)}` : null);

export default function DoulaDetails({ route, navigation }) {
  const { id } = route.params || {};
  const [doula, setDoula] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);


  // Youtube video- https://www.youtube.com/watch?v=fVwwDLwKV9c&t=439s
  // Similar to React Navigation “setOptions” tutorials, but instead of updating
  // the header from a local prompt, we fetch the doula by id, then set the title
  // to the loaded doulas name. This keeps the header in sync with server data.
  // Use Effect - https://react.dev/reference/react/useEffect
  //The profile screen uses React Hooks (useEffect) to retrieve data from the FastAPI backend whenever the selected doula’s ID changes.
  useEffect(() => {
  (async () => {
    try {
      // Fetch doula profile
      const { data } = await api.get(`/doulas/${id}`);
      setDoula(data);

      // Set header title
      navigation.setOptions({ title: data?.name || "Profile" });

      // Fetch reviews for this doula
      try {
        const r = await api.get(`/reviews/by-doula/${id}`);
        setReviews(r.data || []);
      } catch (e) {
        console.warn("No reviews found", e?.message || e);
        setReviews([]);
      }

    } catch (e) {
      console.error("GET /doulas/:id failed", e?.message || e);
    } finally {
      setLoading(false);
    }
  })();
}, [id]);


  // Simple loading and not-found states
  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (!doula)
    return (
      <View style={styles.center}>
        <Text style={{ color: "crimson" }}>Doula not found.</Text>
      </View>
    );
    // ensuring photo is retrieved correctly
  // ?. = optional chaining (safe access)
// ?? = use next value if previous is null or undefined
// This finds the first available photo field, cleans it, and returns a full URL or a placeholder

   const resolvePhoto = (u) => {
    const raw =
      u?.photo_url ??
      u?.photo ??
      u?.photoUrl ??
      null;
    const trimmed = typeof raw === "string" ? raw.trim() : raw;
    return trimmed ? toAbsolute(trimmed)  : PLACEHOLDER;
  };
   const photoUri = resolvePhoto(doula);

  // fixUrl() converts short URLs like "/static/image.jpg" into full URLs so they work on web
  const open = (url) => url && Linking.openURL(toAbsolute(url)); //  use fixUrl for all opens
  const basePrice = formatEUR(doula.price);
  const bundlePrice = formatEUR(doula.price_bundle);
  const years = doula.years_experience;

  return (
      // Scrollable container- lets the details grow without overflowing the scree
    <ScrollView style={{ backgroundColor: COLORS.background }}>
      {/* ---------- Header Card ---------- */}
      <View style={styles.headerCard}>
        <Image
            // uri - return a local file object from the mobile file system- used this video from add user for email to understand it better
            // string that identifies the location of a resource
            source={{ uri: photoUri }}
            onError={() =>
              console.warn("Image failed for doula:", doula?.id, "value:", doula?.photo_url)
            }
            style={styles.photo}
            resizeMode="cover"
          />


        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{doula.name}</Text>

          {doula.verified ? (
            <Text style={styles.verified}> Member, Doula Association of Ireland</Text>
          ) : null}

          <View style={{ marginTop: 10 }}>
            <Text style={styles.label}> Location</Text>
            <Text style={styles.value}>{doula.location}</Text>
          {/* Only show the base and bundle price if one exists if not it skips this section form the &&*/}
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

        {/* Certificate link:
         - Web  - <a> so users can right-click/open in a new tab and download.
         - Native- TouchableOpacity and Linking.openURL
         This URL is produced by the FastAPI UploadFile endpoint
         - https://fastapi.tiangolo.com/tutorial/request-files/#file-parameters-with-uploadfile
         -nopener and noreferrer avoid giving new page access- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#noreferrer

      */}
      {doula.certificate_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Certificate</Text>
          {Platform.OS === "web" ? (
            <a
              href={toAbsolute(doula.certificate_url)} // certificate donwload for web
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
{reviews?.length > 0 ? (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Reviews</Text>

    {reviews.map((r) => (
      <View
        key={r.id}
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
  {[1, 2, 3, 4, 5].map((n) => (
    <Ionicons
      key={n}
      name={n <= r.rating ? "star" : "star-outline"}
      size={18}
      color={COLORS.primary}
      style={{ marginRight: 2 }}
    />
  ))}
</View>


        <Text style={{ marginTop: 4, fontWeight: "600", color: COLORS.text }}>
          Anonymous
        </Text>

        {!!r.comment && (
          <Text style={{ marginTop: 6, color: COLORS.text }}>
            {r.comment}
          </Text>
        )}
      </View>
    ))}
  </View>
) : (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Reviews</Text>
    <Text style={styles.body}>No reviews yet.</Text>
  </View>
)}

      {/* ---------- Buttons ---------- */}
      {/* Book button: navigate to AddBooking and prefill doula id via parameters */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.action}
          onPress={() => navigation.navigate("AddBooking", { presetDoulaId: doula.id, presetDoulaName: doula.name })}
        >
          <Text style={styles.actionText}>Book Consultation</Text>
        </TouchableOpacity>

        {doula.email ? (
          <TouchableOpacity
            style={styles.action}
            // automatically opens email and sends email to the doulas stored email
              // malito for email :https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a#noreferrer
            onPress={() => Linking.openURL(`mailto:${doula.email}`)}
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
      {/* Spacer so the last button isn’t jammed against the screen edge */}
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
//https://reactnative.dev/docs/stylesheet- Modified for douladetails
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

