/*
  LeaveReview.jsx

  Purpose:
   - Allows a mother to leave a rating and optional comment for a doula.
   - Review is sent to the FastAPI backend (POST /reviews).
   - Backend should enforce eligibility (only allow review after a paid booking).

  How I adapted this (similar patterns to AddUserFormMobile):
   - Uses controlled inputs with useState (same pattern as Add User form).
   - Uses axios instance (api.js) to POST to FastAPI.
   - Uses native alerts (Alert.alert) for feedback (same UX pattern).
   - Pulls doulaId/motherId from route.params (React Navigation pattern).

  References used:
   - React Native:
     - View/Text:           https://reactnative.dev/docs/view
                            https://reactnative.dev/docs/text
     - TextInput:           https://reactnative.dev/docs/textinput
     - TouchableOpacity:    https://reactnative.dev/docs/touchableopacity
     - Alert:               https://reactnative.dev/docs/alert
     - StyleSheet:          https://reactnative.dev/docs/stylesheet
   - React Navigation:
     - useRoute:            https://reactnavigation.org/docs/use-route/
     - useNavigation:       https://reactnavigation.org/docs/use-navigation/
*/

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

// Same cross-platform alert helper style as your AddUser form:
// - Native: Alert.alert
// - Web: window.alert fallback
function showMessage(title, message) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function LeaveReview() {
  // React Navigation:
  // route.params is where you receive doulaId/motherId from nav.navigate(...)
  const route = useRoute();
  const navigation = useNavigation();

  const bookingId = route.params?.bookingId;


  // Controlled form state (same idea as AddUserFormMobile)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Submit review to backend:
  // POST /reviews { doula_id, mother_id, rating, comment }
  // Backend should validate:
  // - rating is 1-5
  // - mother has a paid booking with that doula
  // only allowed make a review once the booking is paid for to prevent harmful/fake reviews
  const submitReview = async () => {
  if (!bookingId) {
    showMessage("Missing data", "bookingId is missing.");
    return;
  }

  if (rating < 1 || rating > 5) {
    showMessage("Invalid rating", "Rating must be between 1 and 5.");
    return;
  }

  try {
    setSubmitting(true);

    await api.post("/reviews", {
      booking_id: bookingId,
      rating,
      comment: comment.trim() || null,
    });

    showMessage("Thank you!", "Your review has been submitted.");
    navigation.goBack();
  } catch (err) {
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to submit review.";
    showMessage("Error", String(detail));
  } finally {
    setSubmitting(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leave a Review</Text>

      {/* Rating selector (simple 1–5 buttons) */}
      <Text style={styles.label}>Rating (1–5)</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.ratingButton,
              rating === n && styles.ratingSelected,
            ]}
            onPress={() => setRating(n)}
          >
            <Text style={styles.ratingText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Optional comment */}
      <Text style={styles.label}>Comment (optional)</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Write your experience..."
        multiline
        style={styles.input}
      />

      {/* Submit button */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={submitReview}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? "Submitting…" : "Submit Review"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

//https://reactnative.dev/docs/stylesheet- Modified for leavereview
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    color: COLORS.accent,
  },
  label: {
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: COLORS.text,
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  ratingButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  ratingSelected: {
    backgroundColor: COLORS.primary,
  },
  ratingText: {
    fontWeight: "700",
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    backgroundColor: COLORS.white,
    textAlignVertical: "top",
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: {
    color: COLORS.white,
    fontWeight: "700",
  },
});
