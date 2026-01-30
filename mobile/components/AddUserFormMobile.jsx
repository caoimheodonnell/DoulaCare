/*
   from ChatGPT conversation on React to React Native conversion (October 2025)- https://chatgpt.com/c/68f40a4c-6598-8325-9399-b695370996ed

  How I adapted the code for DoulaCare:
   - Converted HTML React elements to React Native.
   - Replaced browser alerts with mobile-native Alert pop-ups for better UX.
   - Used KeyboardAvoidingView to stop the keyboard from covering input fields.
   - Connect my app with my FastAPI backend using an axios instance (api.js).
   - Clears inputs and automatically refresh (onDoulaAdded) after successful POST/users added.
   - Allows certificate pdf uploads
   -Allows image jpg/jpeg uploads

   What this screen does:
   - Presents a mobile-friendly form (React Native) to create a new Doula user.
   - Uploads optional certificate PDFs and images to the FastAPI backend (multipart/form-data).
   - POSTs a new user to /users, then clears the form.

   References used:
   React Native component docs (official site):
     - TouchableOpacity (pressable button): https://reactnative.dev/docs/touchableopacity
     - TextInput (form fields):              https://reactnative.dev/docs/textinput
     - ScrollView (scroll container):        https://reactnative.dev/docs/scrollview
     - KeyboardAvoidingView (avoid keyboard overlap): https://reactnative.dev/docs/keyboardavoidingview
     - Switch (toggle control):              https://reactnative.dev/docs/switch
     - Image (display local logo):           https://reactnative.dev/docs/image
     - Alert (native alerts):                https://reactnative.dev/docs/alert
    - How to Create a FastAPI & React Project - Python Backend + React Frontend- https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s
   - Expo Document Picker (for PDFs): https://docs.expo.dev/versions/latest/sdk/document-picker/
   -isNAN function: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
   - React Navigation (navigation hook):    https://reactnavigation.org/docs/use-navigation
   - From ChatGPT conversation on React to React Native conversion (October 2025)- https://chatgpt.com/c/68f40a4c-6598-8325-9399-b695370996ed
   - YouTube: "Python FastAPI Tutorial #12 - How to Serve Static Files in FastAPI" https://www.youtube.com/watch?v=nylnxFn1_U0
   - Youtube: Email Validation in JavaScript using Regular Expressions https://www.youtube.com/watch?v=4Hi5GoEp5U8
   This explained how to expose uploaded files via FastAPI’s StaticFiles middleware,
    making them accessible under /static/certificates/.
*/

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
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import api, { uploadCertificate, uploadPhoto } from "../api";
import { supabase } from "../supabaseClient";


// Bundeled Logo
const LOGO = require("../assets/doulacare-logo.png");

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

// Cross-platform alert helper
// - Native: uses Alert.alert (RN docs: https://reactnative.dev/docs/alert)
// - Web:    falls back to window.alert so messages show in the browser
function showMessage(title, message) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}
//https://reactnavigation.org/docs/use-navigation - shows the function and use navogation underneath
// Skeleton of this from chatgpt chat -  https://chatgpt.com/c/68f40a4c-6598-8325-9399-b695370996ed
const AddUserFormMobile = ({ onDoulaAdded }) => {
  const navigation = useNavigation();

// Controlled input state
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

  //Resets after a succesfully added doula
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

  // Pick and upload a PDF certificate and image Jpeg/Jpg:
  // Uses Expo DocumentPicker to select a PDF and Jpg/jpeg
  // Calls uploadCertificate and uploadPhoto (axios helper) to POST to FastAPI /upload/certificate
  // Stores the returned /static path in certificateUrl and image jpg
  // helped with certificate upload and image - https://stackoverflow.com/questions/65715043/how-to-implement-an-image-and-pdf-picker-in-one-single-upload-button-in-expo
  // helped wiht the concept of document picker - https://docs.expo.dev/versions/latest/sdk/document-picker/
  // Adapted from Expo DocumentPicker examples:
  //  - changed type to only accept PDFs/images
  //  - used the new assets[0] result format
  // - added upload to FastAPI + success/error alerts
  const pickAndUploadCertificate = async () => {
    // limit to PDF
    // https://docs.expo.dev/versions/latest/sdk/document-picker/- Docoument picker and asset uri
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
        // return a local file object from the mobile file system.
        // string that identifies the location of a resource
        uri: asset.uri,
        name: asset.name,
        mimeType: "application/pdf",
      });
      setCertificateUrl(url);
      // - Alert using showmessage function (native alerts): https://reactnative.dev/docs/alert to ensure the certifcate was uploaded correctyl
      showMessage("Uploaded", "Certificate uploaded and linked.");
    } catch (e) {
      console.error(e);
      showMessage("Upload failed", e?.message || "Unknown error");
    }
  };

 // Pick and upload a JPG/PNG photo (similar to certificate upload)
  // also used this to help-https://docs.expo.dev/versions/latest/sdk/document-picker/-
const pickAndUploadPhoto = async () => {
  const res = await DocumentPicker.getDocumentAsync({
    type: ["image/jpeg", "image/png", "image/webp", "image/*"],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return;

  const asset = res.assets?.[0];
  if (!asset) return;

  try {
    const url = await uploadPhoto(asset);

    setPhotoUrl(url);
    showMessage("Uploaded", "Photo uploaded and linked.");
  } catch (e) {
    console.error(e);
    showMessage("Upload failed", e?.message || "Unknown error");
  }
};


  //  Validate and POST the new doula user to FastAPI and alert if missing info
  const handleSubmit = async () => {
    if (!name.trim() || !location.trim() || !price.trim()) {
      showMessage("Missing info", "Please fill in name, location and price.");
      return;
    }
    // Convert user-entered text input into actual numbers that the backend (FastAPI) can understand and store properly. fields empty optional fields become null.
    const priceNum = Number(price);
    const bundleNum = priceBundle ? Number(priceBundle) : null;
    const yearsNum = yearsExperience ? Number(yearsExperience) : null;

    // no negatives must be numbers
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN- isNAN
    // isNAN is used to check if a value is not a valid number
    if (Number.isNaN(priceNum) || priceNum < 0) {
      showMessage("Invalid price", "Please enter a valid numeric price.");
      return;
    }
    if (bundleNum !== null && (Number.isNaN(bundleNum) || bundleNum < 0)) {
      showMessage("Invalid bundle price", "Please enter a valid bundle price.");
      return;
    }
    if (yearsNum !== null && (Number.isNaN(yearsNum) || yearsNum < 0)) {
      showMessage("Invalid experience", "Enter years as a positive number.");
      return;
    }
    // Basic email structure (no spaces, must include @ and .)
    //  https://www.youtube.com/watch?v=4Hi5GoEp5U8 email validiation using .test also used in video and photo
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      showMessage("Invalid email", "Please enter a valid email address.");
      return;
    }
    // Must start with http:// or https://
    // the i before the test just ignores capitalisation
    if (introVideoUrl && !/^https?:\/\/.+/i.test(introVideoUrl)) {
      showMessage("Invalid URL", "Intro video must be a valid http(s) URL.");
      return;
    }



      //post to FastAPI
      //https://www.youtube.com/watch?v=aSdVU9-SxH4&t=648s - undesrtadning const and await and get
      try {
  // Get logged-in user auth ID
  const { data } = await supabase.auth.getSession();
  const authId = data?.session?.user?.id;

  if (!authId) {
    showMessage("Error", "No logged in user session found.");
    return;
  }

  // Update this user's profile (not create a new user)
  await api.patch(`/users/by-auth/${authId}`, {
    name: name.trim(),
    location: location.trim(),
    price: priceNum,
    price_bundle: bundleNum,
    years_experience: yearsNum,
    photo_url: photoUrl.trim() || null,

    //Admin controls this
    verified: false,

    email: email.trim() || null,
    qualifications: qualifications.trim() || null,
    services: services.trim() || null,
    bio: bio.trim() || null,
    intro_video_url: introVideoUrl.trim() || null,
    certificate_url: certificateUrl.trim() || null,
  });

      clearForm();
      onDoulaAdded?.();
      showMessage("Request Submitted", "Your doula profile has been submitted. An admin must approve it.");
    } catch (err) {
      const msg = err?.response
        ? `${err.response.status} ${err.response.statusText}\n${JSON.stringify(
            err.response.data
          )}`
        : err?.message || "Unknown error";
      showMessage("Error adding doula", msg);
      console.error("POST /users error:", err);
    }
  };
//https://reactnavigation.org/docs/use-navigation shows what returns from the navigation
  return (
      //KeyboardAvoidingView prevents the keyboard from overlapping inputs on iOS- https://reactnative.dev/docs/keyboardavoidingview
    // On Android/Web, behavior undefined is fine; ScrollView ensures content remains reachable.
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
          // so mobiles can see the full screen https://reactnative.dev/docs/scrollview
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 16, alignItems: "center" }}
      >
         {/* Clickable Logo (Home)
            React Native docs: Image and  TouchableOpacity usage patterns:
            - Image: https://reactnative.dev/docs/image
            - TouchableOpacity: https://reactnative.dev/docs/touchableopacity
        */}

        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Image
            source={LOGO}
            style={{ width: 100, height: 100, marginBottom: 8 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: COLORS.accent,
            marginBottom: 10,
          }}
        >
          Create a Doula Profile
        </Text>
        <TouchableOpacity
  onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}
  style={{ alignSelf: "flex-start", marginBottom: 10 }}
>
  <Text style={{ color: COLORS.accent, fontWeight: "700" }}>← Back</Text>
</TouchableOpacity>

        {/* Where the user inputs information in the text box
        */}
        <View style={styles.form}>
          <TextInput placeholder="Name *" value={name} onChangeText={setName} style={styles.input} autoCapitalize="words" />
          <TextInput placeholder="Location *" value={location} onChangeText={setLocation} style={styles.input} autoCapitalize="words" />
          <TextInput
            placeholder="Price (€) *"
            value={price}
            onChangeText={setPrice}
            style={styles.input}
            keyboardType={Platform.select({ ios: "decimal-pad", android: "numeric" })}
          />
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
            // cant have decimals in years so has to be number pad
            keyboardType={Platform.select({ ios: "number-pad", android: "numeric" })}
          />

          {/* Switch component — React Native Docs: https://reactnative.dev/docs/switch */}
          <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>
          Member of Doula Association of Ireland
        </Text>

        <Switch value={verified} onValueChange={setVerified} />
      </View>
        {/* Changed this from verified to this from Doula feedback */}
      <Text style={styles.helperText}>
        Enable this only if you are a registered DAI member.
      </Text>

          <TextInput placeholder="Email (optional)" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
          <TextInput placeholder="Qualifications (e.g. DONA, HypnoBirthing)" value={qualifications} onChangeText={setQualifications} style={styles.input} multiline />
          <TextInput placeholder="Services (comma-separated)" value={services} onChangeText={setServices} style={styles.input} multiline />
          <TextInput placeholder="Bio (short introduction)" value={bio} onChangeText={setBio} style={[styles.input, styles.multiline]} multiline />

          {/* Upload profile photo to saves URL to photoUrl */}
<TouchableOpacity style={styles.secondaryBtn} onPress={pickAndUploadPhoto}>
  <Text style={styles.secondaryBtnText}>Upload Profile Picture (JPG/PNG)</Text>
</TouchableOpacity>

          <TextInput placeholder="Certificate URL (optional)" value={certificateUrl} onChangeText={setCertificateUrl} style={styles.input} autoCapitalize="none" />
          <TouchableOpacity style={styles.secondaryBtn} onPress={pickAndUploadCertificate}>
            <Text style={styles.secondaryBtnText}>Upload Certificate (PDF)</Text>
          </TouchableOpacity>

          <TextInput placeholder="Intro video URL (optional)" value={introVideoUrl} onChangeText={setIntroVideoUrl} style={styles.input} autoCapitalize="none" />

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddUserFormMobile;
//https://reactnative.dev/docs/stylesheet- Modified for add user
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1, backgroundColor: COLORS.background },
  form: {
    backgroundColor: COLORS.background,
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
  helperText: {
  fontSize: 12,
  color: COLORS.text,
  opacity: 0.6,
  marginBottom: 12,
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


