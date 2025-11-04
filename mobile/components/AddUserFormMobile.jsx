/*
  Code adapted from my original React web form ("AddUserForm.jsx")
  and from ChatGPT conversation on React to React Native conversion (October 2025).

  How I adapted the code for DoulaCare:
   - Converted HTML React elements to React Native.
   - Replaced browser alerts with mobile-native Alert pop-ups for better UX.
   - Used KeyboardAvoidingView to stop the keyboard from covering input fields.
   - Connect my app with my FastAPI backend (http://<IP>:8000/users) using an axios instance (api.js).
   - Same POST request function as on the React web version.
   - Clears inputs and automatically refresh (onDoulaAdded) after successful POST/users addded.

*/
// Import React Native components needed for building and styling the mobile form UI.

import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import api, { uploadCertificate } from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

const AddUserFormMobile = ({ onDoulaAdded }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [priceBundle, setPriceBundle] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [email, setEmail] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [services, setServices] = useState("");
  const [bio, setBio] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [certificateUrl, setCertificateUrl] = useState("");
  const [verified, setVerified] = useState(false);

  const clearForm = () => {
    setName("");
    setLocation("");
    setPrice("");
    setPriceBundle("");
    setYearsExperience("");
    setPhotoUrl("");
    setEmail("");
    setQualifications("");
    setServices("");
    setBio("");
    setIntroVideoUrl("");
    setCertificateUrl("");
    setVerified(false);
  };

  const pickAndUploadCertificate = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset) return;

    try {
      const url = await uploadCertificate({
        uri: asset.uri,
        name: asset.name,
        mimeType: "application/pdf",
      });
      setCertificateUrl(url);
      Alert.alert("Uploaded", "Certificate uploaded and linked.");
    } catch (e) {
      console.error(e);
      Alert.alert("Upload failed", e?.message || "Unknown error");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !location.trim() || !price.trim()) {
      Alert.alert("Missing info", "Please fill in name, location and price.");
      return;
    }

    const priceNum = Number(price);
    const bundleNum = priceBundle ? Number(priceBundle) : null;
    const yearsNum = yearsExperience ? Number(yearsExperience) : null;

    if (Number.isNaN(priceNum) || priceNum < 0) {
      Alert.alert("Invalid price", "Please enter a valid numeric price.");
      return;
    }
    if (bundleNum !== null && (Number.isNaN(bundleNum) || bundleNum < 0)) {
      Alert.alert("Invalid bundle price", "Please enter a valid bundle price.");
      return;
    }
    if (yearsNum !== null && (Number.isNaN(yearsNum) || yearsNum < 0)) {
      Alert.alert("Invalid experience", "Enter years as a positive number.");
      return;
    }
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (introVideoUrl && !/^https?:\/\/.+/i.test(introVideoUrl)) {
      Alert.alert("Invalid URL", "Intro video must be a valid http(s) URL.");
      return;
    }
    if (photoUrl && !/^https?:\/\/.+/i.test(photoUrl)) {
      Alert.alert("Invalid URL", "Photo must be a valid http(s) URL.");
      return;
    }

    try {
      await api.post("/users", {
        name: name.trim(),
        location: location.trim(),
        price: priceNum,
        price_bundle: bundleNum,
        years_experience: yearsNum,
        photo_url: photoUrl.trim() || null,
        role: "doula",
        verified,
        email: email.trim() || null,
        qualifications: qualifications.trim() || null,
        services: services.trim() || null,
        bio: bio.trim() || null,
        intro_video_url: introVideoUrl.trim() || null,
        certificate_url: certificateUrl.trim() || null,
      });

      clearForm();
      onDoulaAdded?.();
      Alert.alert("Success", "Doula profile created.");
    } catch (err) {
      const msg = err?.response
        ? `${err.response.status} ${err.response.statusText}\n${JSON.stringify(
            err.response.data
          )}`
        : err?.message || "Unknown error";
      Alert.alert("Error adding doula", msg);
      console.error("POST /users error:", err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16, alignItems: "center" }}
      >
        <View style={styles.form}>
          {/* BASIC INFO */}
          <TextInput placeholder="Name *" value={name} onChangeText={setName} style={styles.input} autoCapitalize="words" />
          <TextInput placeholder="Location *" value={location} onChangeText={setLocation} style={styles.input} autoCapitalize="words" />
          <TextInput
            placeholder="Price (€) *"
            value={price}
            onChangeText={setPrice}
            style={styles.input}
            keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
          />

          {/* NEW FIELDS */}
          <TextInput
            placeholder="Bundle Price (€)"
            value={priceBundle}
            onChangeText={setPriceBundle}
            style={styles.input}
            keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
          />
          <TextInput
            placeholder="Years of Experience"
            value={yearsExperience}
            onChangeText={setYearsExperience}
            style={styles.input}
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
          />
          <TextInput placeholder="Photo URL (e.g. https://...)" value={photoUrl} onChangeText={setPhotoUrl} style={styles.input} autoCapitalize="none" />

          {/* VERIFIED SWITCH */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Verified</Text>
            <Switch value={verified} onValueChange={setVerified} />
          </View>

          {/* OPTIONAL FIELDS */}
          <TextInput
            placeholder="Email (optional)"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput placeholder="Qualifications (e.g. DONA, HypnoBirthing)" value={qualifications} onChangeText={setQualifications} style={styles.input} multiline />
          <TextInput placeholder="Services (comma-separated)" value={services} onChangeText={setServices} style={styles.input} multiline />
          <TextInput placeholder="Bio (short introduction)" value={bio} onChangeText={setBio} style={[styles.input, styles.multiline]} multiline />

          {/* CERTIFICATE: URL OR UPLOAD */}
          <TextInput placeholder="Certificate URL (optional)" value={certificateUrl} onChangeText={setCertificateUrl} style={styles.input} autoCapitalize="none" />

          <TouchableOpacity style={styles.secondaryBtn} onPress={pickAndUploadCertificate}>
            <Text style={styles.secondaryBtnText}>Upload Certificate (PDF)</Text>
          </TouchableOpacity>

          <TextInput placeholder="Intro video URL (optional)" value={introVideoUrl} onChangeText={setIntroVideoUrl} style={styles.input} autoCapitalize="none" />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Add Doula</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddUserFormMobile;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background, // full-screen peach
  },
  scroll: {
    flex: 1,
    backgroundColor: COLORS.background, // keep scroll bg peach too
  },
  form: {
    backgroundColor: COLORS.background, // matches app background
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    marginVertical: 10,
    alignSelf: "center",
    width: "90%",
    maxWidth: 500,
  },
  input: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    width: "100%",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  switchLabel: { color: COLORS.text, fontWeight: "600" },
  button: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 6 },
  buttonText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },
  secondaryBtn: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderWidth: 1.5, paddingVertical: 10, borderRadius: 10, alignItems: "center", marginBottom: 10 },
  secondaryBtnText: { color: COLORS.accent, fontWeight: "700" },
});

