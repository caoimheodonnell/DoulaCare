// components/UsersMobile.jsx
/*
  UsersMobile.jsx - DoulaCare list screen

  Sources / References:
  - YouTube: "React Native tutorial #56 - List with API data" (list + API fetch pattern) https://www.youtube.com/watch?v=242Tc1ezWm0&t=262s
    - Same ideas: FlatList over fetched data, initial fetch in useEffect, simple item row tap to details.
  - YouTube: "FastAPI & React Full-stack: Filter Products" (navbar search pattern)
    https://www.youtube.com/watch?v=9Gmbqb7mXWs
    -React Native Tutorial 53 - React Native Slider Example - https://www.youtube.com/watch?v=BR2rrnTavmY&t=24s
    - Same ideas: controlled search input, explicit Search button, submit handler, route/state-driven filtering
  - ChatGPT guidance (React to React Native conversion; price slider collapsible UI; safe-area; param-reactivity):
    https://chatgpt.com/c/68f40a4c-6598-8325-9399-b695370996ed
  - Understanding IOS/android for voice navigation- https://www.youtube.com/watch?v=jUvFNIw53i8&t=282s
  - Understanding WEB for voice navigation (media recorder) - https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
  -CHatGPT help navigation get key word and ignore fillers - https://chatgpt.com/c/69187d0d-a4a8-832c-8bdb-ec780650ba4d

  What I changed / added for DoulaCare:
  - Kept your compact side-by-side price sliders (iOS and Web), but made them collapsible under a Switch (hidden by default)
  - Integrated Safe Area (SafeAreaProvider/SafeAreaView) to match your screenshots and avoid notch overlap
  - Search bar mirrors the YouTube navbar pattern (controlled input and Search/Reset) but uses nav params so other screens can react
  - Server-side filters supported: ?q, ?min_price, ?max_price (wired to Apply/Clear)
*/
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Switch, // React native component for toggle -https://reactnative.dev/docs/switch
} from "react-native";

import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import api, { toAbsolute } from "../api";
import { supabase } from "../supabaseClient";
// YouTube #56 vibe (list and API): still using a separate slider lib for React native/Expo
import Slider from "@react-native-community/slider";
// Voice navigation mic icon
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";



// Very simple helper to turn a sentence like
// "find doulas in cork under 500 euro" to "cork"
// helped do this by chatgpt - https://chatgpt.com/c/69187d0d-a4a8-832c-8bdb-ec780650ba4d
const extractVoiceKeyword = (raw) => {
  if (!raw) return "";

  // 1. Lowercase + trim
  let lower = raw.toLowerCase().trim();

  // 2. Remove ALL punctuation and symbols
  // Removes: . , ! ? ; : - _ ( ) [ ] / \ ' " etc.
  lower = lower.replace(/[^\w\s]/g, "");

  // Special case: “doulas in cork”
  if (lower.startsWith("doulas in ")) {
    return lower.replace("doulas in ", "").trim();
  }

  // Basic stop words we want to ignore
  const stopwords = [
    "find",
    "search",
    "look",
    "for",
    "me",
    "a",
    "an",
    "some",
    "doulas",
    "doula",
      "doola",
    "near",
    "in",
    "please",
    "under",
    "around",
  ];

  const words = lower
    .split(/\s+/)
    .filter((w) => w && !stopwords.includes(w));

  // Use the first “meaningful” word, or fallback to the whole thing
  return words[0] || lower;
};

// Local bundled logo used as a clickable Home button
const LOGO = require("../assets/doulacare-logo.png");

const PLACEHOLDER = "https://placehold.co/100x100/FFF7F2/8C6A86?text=Doula";




//If the value should update the UI=	useState
// If the value is just stored and not shown=	useRef
export default function UsersMobile() {
const [motherId, setMotherId] = useState(null);
  const [users, setUsers] = useState([]);
    // YouTube-https://www.youtube.com/watch?v=9Gmbqb7mXWs navbar pattern: controlled search value in state
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const route = useRoute();
  const nav = useNavigation();


const [canReviewMap, setCanReviewMap] = useState({});
// Voice recording

  const [recording, setRecording] = useState(null);      // native Recording object
  const [isRecording, setIsRecording] = useState(false); // shared flag (web and native)
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Web-only recording
  const mediaRecorderRef = useRef(null);
  const webChunksRef = useRef([]);

  // Favourite Section
  const [motherAuthId, setMotherAuthId] = useState(null); // Supabase UUID string
const [favMap, setFavMap] = useState({});               // { [doulaId]: true }
const [togglingFav, setTogglingFav] = useState({});     // { [doulaId]: true }


  //  Price slider state - https://www.youtube.com/watch?v=BR2rrnTavmY&t=24s*/}
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250);
  const PRICE_MIN = 0;
  const PRICE_MAX = 250;
  const PRICE_STEP = 5;

  //  Collapsible state like the youtube video
  const [showPriceFilters, setShowPriceFilters] = useState(false);

  const onChangeMin = (v) => setMinPrice(Math.min(v, maxPrice));
  const onChangeMax = (v) => setMaxPrice(Math.max(v, minPrice));

  //  YouTube https://www.youtube.com/watch?v=242Tc1ezWm0&t=262s idea: fetch list on mount
  const fetchUsers = async (params = {}) => {
  try {
    const { data } = await api.get("/doulas", { params });
    const list = data || [];
    setUsers(list);

    // Check which doulas this mother is allowed to review
    const checks = await Promise.all(
      list.map(async (u) => {
        try {
          const res = await api.get("/reviews/can-review", {
            params: {
              mother_id: motherId,
              doula_id: u.id,
            },
          });
          return [
  u.id,
  {
    canReview: res.data?.can_review,
    bookingId: res.data?.booking_id,
  }
];
        } catch {
  return [u.id, { canReview: false, bookingId: null }];
}
      })
    );

    setCanReviewMap(Object.fromEntries(checks));
  } catch (error) {
    console.error("Error fetching doulas:", error?.message || error);
    setUsers([]);
    setCanReviewMap({});
  }
};

  // Initial load
  useEffect(() => {
  if (motherId) fetchUsers();
}, [motherId]);


//Favourites
useEffect(() => {
  const loadAuth = async () => {
    const { data } = await supabase.auth.getSession();
    setMotherAuthId(data?.session?.user?.id || null);
  };
  loadAuth();
}, []);

  //favourites
const loadFavourites = async () => {
  if (!motherAuthId) return;
  try {
    const res = await api.get(`/favourites/by-mother-auth/${motherAuthId}/details`);
    const list = res.data || [];
    const map = {};
    list.forEach((f) => {
      map[f.doula_id] = true;
    });
    setFavMap(map);
  } catch (e) {
    console.warn("Failed to load favourites", e?.message || e);
    setFavMap({});
  }
};

useEffect(() => {
  if (motherAuthId) loadFavourites();
}, [motherAuthId]);

const toggleFavourite = async (doulaId) => {
  if (!motherAuthId) {
    alert("Please log in as a mother to favourite a doula.");
    return;
  }

  try {
    setTogglingFav((p) => ({ ...p, [doulaId]: true }));

    const res = await api.post(`/favourites/by-mother-auth/${motherAuthId}/toggle`, {
      doula_id: doulaId,
    });

    const nowFav = !!res.data?.favourited;

    setFavMap((prev) => {
      const next = { ...prev };
      if (nowFav) next[doulaId] = true;
      else delete next[doulaId];
      return next;
    });
  } catch (e) {
    console.warn("Toggle favourite failed", e?.message || e);
    alert("Could not update favourites.");
  } finally {
    setTogglingFav((p) => ({ ...p, [doulaId]: false }));
  }
};

  // React to header search param
  // ChatGPT: https://chatgpt.com/c/68f40a4c-6598-8325-9399-b695370996ed react to header/route search param (navbar passes search via nav params)
  useEffect(() => {
  if (!motherId) return;
  const headerTerm = route.params?.search ?? "";
  if (headerTerm === "") fetchUsers();
  else fetchUsers({ q: headerTerm });
}, [route.params?.search, motherId]);

  // From YouTube navbar video https://www.youtube.com/watch?v=242Tc1ezWm0&t=262s : controlled input and submit handler
  const updateSearch = (v) => setSearch(v);
  const filterUsers = async () => {
    const term = search.trim();
    await fetchUsers(term ? { q: term } : {});
  };
  const resetSearch = async () => {
    setSearch("");
    inputRef.current?.focus();
    await fetchUsers();
    nav.setParams({ search: undefined });
  };

  // Apply/Clear price filters
  const applyPriceFilter = async () => {
    await fetchUsers({
      q: search.trim() || undefined,
      min_price: minPrice,
      max_price: maxPrice,
    });
  };
  const clearPriceFilter = async () => {
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    await fetchUsers({ q: search.trim() || undefined });
  };



// Web recording logic inspired by a basic MediaRecorder example -https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API
// Web recording (MediaRecorder):
// - inspired by simple MediaRecorder examples (start/stop button and chunks array)
// - getUserMedia - MediaRecorder - collect ondataavailable chunks
// - on stop: Blob -File - send to /voice-search and update search results

// Native recording (expo-av):
// - request mic permission, configure Audio mode
// - use Audio.Recording.createAsync(HIGH_QUALITY)
// - on stop: recording.stopAndUnloadAsync(), getURI(), send to /voice-search


  // startRecording():
//   - Requests microphone access
//   - Creates a MediaRecorder
//   - Collects audio chunks in ondataavailable
//   - Starts the recording
 const startRecording = async () => {
  try {
    setLoadingVoice(true);

    // Check if the browser even supports microphone access
    if (Platform.OS === "web") {
      // ---- WEB: use browser MediaRecorder ----
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser doesn't support microphone recording.");
        return;
      }
      // Ask the browser for access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Create a MediaRecorder object — this handles START/STOP audio recording on web
      const mediaRecorder = new MediaRecorder(stream);

      // Reset any previous small piece of recorded audio
      webChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      // Whenever the browser has a chunk of audio, save it into the array
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          webChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      return;
    }

    // ---- NATIVE (iOS / Android) with expo-av ----
    // use this youtube video to understand what to do for IOS - https://www.youtube.com/watch?v=jUvFNIw53i8&t=282s
    // What I changed from the tutorial:
    // - They create `new Audio.Recording()` manually, call `prepareToRecordAsync`,
    //   `startAsync`, then later `stopAndUnloadAsync()` and save the file with expo file system
    //I use the shorter helper `Audio.Recording.createAsync(
    //    Audio.RecordingOptionsPresets.HIGH_QUALITY
    //  )` so I don’t need manual prepare/start calls.
    // - Instead of saving the file locally, I take `recording.getURI()` and send it
    //  straight to my FastAPI `/voice-search` endpoint for transcription.
    const { status } = await Audio.requestPermissionsAsync();
    // Ask phone for microphone permissions
    if (status !== "granted") {
      alert("Microphone permission is required for voice search.");
      return;
    }

    // Configure audio settings for recording on mobile
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    // Create a high quality audio recording using expo-av
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(recording);
    setIsRecording(true);
  } catch (err) {
    console.error("Failed to start recording", err);
    alert("Could not start recording.");
  } finally {
    setLoadingVoice(false);
  }
};



  //stop recording, send to /voice-search, update search and results
  // same to start recording accept for
  // stopRecordingAndSearch():
//   - Stops the MediaRecorder
//   - Waits for the onstop event
//   - Combines all recorded chunks into a Blob to File
//   - Sends the audio file to FastAPI /voice-search
//   - Extracts the keyword from the transcription
//   - Updates the search bar and triggers the filter logic
  const stopRecordingAndSearch = async () => {
  try {
    setLoadingVoice(true);

    if (Platform.OS === "web") {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder) return;

      // Wait for the MediaRecorder to actually finish
      await new Promise((resolve) => {
        mediaRecorder.onstop = async () => {
          try {
            // Combine all the audio chunks into one Blob
            const blob = new Blob(webChunksRef.current, {
              type: "audio/webm",
            });
            // Reset data so next recording starts fresh
            webChunksRef.current = [];
            mediaRecorderRef.current = null;

            // Convert Blob to File so it can be sent in FormData
            const file = new File([blob], "voice.webm", {
              type: "audio/webm",
            });

            // Send recording to FastAPI backend
            const form = new FormData();
            form.append("file", file);

            const { data } = await api.post("/voice-search", form, {
              headers: { "Content-Type": "multipart/form-data" },
            });

            // Transcribed text returned from API
            const text = data?.text || "";
            if (!text) {
              alert("Sorry, I couldn't understand that.");
              resolve();
              return;
            }

            // Extract the main keyword from the sentence
            const keyword = extractVoiceKeyword(text);
            if (!keyword) {
              alert("I heard you, but couldn’t pick out a keyword.");
              resolve();
              return;
            }
            // Put the keyword in the search bar
            setSearch(keyword);
            // Trigger normal search filtering
            await fetchUsers({ q: keyword });
          } catch (err) {
            console.error("Voice search error (web)", err);
            alert("Voice search failed. Please try again.");
          } finally {
            resolve();
          }
        };

        mediaRecorder.stop();
        // Turn the microphone off so the browser/phone can stop using it
        mediaRecorder.stream?.getTracks().forEach((t) => t.stop());
      });
    } else {
      // ---- NATIVE PATH (what was working before) ----
      if (!recording) return;
      // Stop native recording and load the audio file from device
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

// Voice upload uses the exact same FormData pattern as my
// certificate/photo uploads. The only difference is that
// the FastAPI backend does not save the audio file  it
// sends it to OpenAI Whisper for transcription and gets rid of it

      const form = new FormData();
      form.append("file", {
        uri,
        name: "voice.m4a",
        type: "audio/m4a",
      });

      const { data } = await api.post("/voice-search", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const text = data?.text || "";
      if (!text) {
        alert("Sorry, I couldn't understand that.");
        return;
      }

      const keyword = extractVoiceKeyword(text);
      if (!keyword) {
        alert("I heard you, but couldn’t pick out a keyword.");
        return;
      }

      setSearch(keyword);
      await fetchUsers({ q: keyword });
    }
  } catch (err) {
    console.error("Voice search error", err);
    alert("Voice search failed. Please try again.");
  } finally {
    setIsRecording(false);
    setLoadingVoice(false);
  }
};


// Mic button: acts as start/stop toggle for voice recording and search.

const handleMicPress = async () => {
  if (!isRecording) {
    await startRecording();
  } else {
    await stopRecordingAndSearch();
  }
};


useEffect(() => {
  const loadMotherId = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const authId = sessionData?.session?.user?.id;
    if (!authId) return;

    const { data } = await api.get("/users");
    const me = (data || []).find(
      (u) => u.role === "mother" && String(u.auth_id) === String(authId)
    );

    if (me) setMotherId(me.id);
    else setMotherId(null);
  };

  loadMotherId();
}, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Clickable logo that takes you Home */}
        <TouchableOpacity onPress={() => nav.navigate("Home")}>
          <Image
            source={LOGO}
            style={{ width: 80, height: 80, alignSelf: "center", marginBottom: 8 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.title}>DoulaCare</Text>

        {/* Search bar */}
        {/* From YouTube navbar video https://www.youtube.com/watch?v=242Tc1ezWm0&t=262s: search bar row (controlled input + Search/Reset) */}
        <View style={styles.navRow}>
          <TextInput
            ref={inputRef}
            value={search}
            onChangeText={updateSearch}
            placeholder="Search by name, location, qualifications…"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={filterUsers}
          />
          {/* mic button for voice search */}
          <TouchableOpacity
            style={styles.micBtn}
            onPress={handleMicPress}

          >
            {loadingVoice ? (
              <Text style={{ color: COLORS.accent }}>…</Text>
            ) : (
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={20}
                color={COLORS.accent}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchBtn} onPress={filterUsers}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetBtn} onPress={resetSearch}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Reload button */}
        <TouchableOpacity style={styles.reloadBtn} onPress={() => fetchUsers()}>
          <Text style={styles.reloadText}>Reload Users</Text>
        </TouchableOpacity>

        {/*  Collapsible Price Filter (Switch)  */}
        <View
          style={{
            width: "100%",
            marginVertical: 8,
            backgroundColor: "rgba(255,255,255,0.5)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Header with Switch - price slider- uses the same switch operation-  https://www.youtube.com/watch?v=BR2rrnTavmY&t=24s*/}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontWeight: "700", color: COLORS.accent, fontSize: 16 }}>
              Price Filters
            </Text>

            <Switch
              value={showPriceFilters}
              onValueChange={setShowPriceFilters}
              trackColor={{ false: "#767577", true: COLORS.border }}
              thumbColor={showPriceFilters ? COLORS.primary : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              accessibilityLabel="Toggle price filters"
            />
          </View>

          {/* Collapsible content - price slider -  https://www.youtube.com/watch?v=BR2rrnTavmY&t=24s*/}
          {showPriceFilters && (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 8,
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
              }}
            >
              <Text
                style={{
                  fontWeight: "700",
                  color: COLORS.accent,
                  marginBottom: 6,
                }}
              >
                Price Range: €{minPrice} – €{maxPrice}
              </Text>

              {/* Sliders side-by-side */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-around",
                  width: "100%",
                  marginVertical: 6,
                }}
              >
                <View style={{ flex: 1, alignItems: "center" }}>

                  <Text style={{ fontSize: 12, color: COLORS.text }}>Min</Text>
                  {/* FRom youtube video  price slider -  https://www.youtube.com/watch?v=BR2rrnTavmY&t=24s*/}
                  <Slider
                    style={{ width: "90%", height: 28 }}
                    minimumValue={PRICE_MIN}
                    maximumValue={PRICE_MAX}
                    step={PRICE_STEP}
                    value={minPrice}
                    onValueChange={onChangeMin}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={Platform.OS === "web" ? undefined : COLORS.accent}
                  />
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: COLORS.text }}>Max</Text>
                  <Slider
                    style={{ width: "90%", height: 28 }}
                    minimumValue={PRICE_MIN}
                    maximumValue={PRICE_MAX}
                    step={PRICE_STEP}
                    value={maxPrice}
                    onValueChange={onChangeMax}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={Platform.OS === "web" ? undefined : COLORS.accent}
                  />
                </View>
              </View>

              {/* Apply / Clear buttons */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                <TouchableOpacity
                  style={[styles.searchBtn, { paddingVertical: 8, paddingHorizontal: 10 }]}
                  onPress={applyPriceFilter}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                    Apply
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resetBtn, { paddingVertical: 8, paddingHorizontal: 10 }]}
                  onPress={clearPriceFilter}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* User list */}
        {/* YouTube #56 pattern  https://www.youtube.com/watch?v=242Tc1ezWm0&t=262s: FlatList bound to fetched array, row to details */}
   <FlatList
  data={users}
  keyExtractor={(u) => String(u.id)}
  ItemSeparatorComponent={() => <View style={styles.separator} />}
  renderItem={({ item: u }) => {
    const isFav = !!favMap[u.id];
    const isBusy = !!togglingFav[u.id];

    return (
      <View style={styles.userRow}>
        {/* LEFT: tap opens details */}
        <TouchableOpacity
          style={{ flexDirection: "row", flex: 1, alignItems: "center" }}
          onPress={() => nav.navigate("Details", { id: u.id })}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: toAbsolute(u.photo_url) || PLACEHOLDER }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{u.name}</Text>

            <Text style={styles.userMeta}>
              {u.location} — €{u.price}
            </Text>

            <Text
              style={[
                styles.verifiedText,
                { color: u.verified ? "green" : "gray" },
              ]}
            >
              {u.verified ? "Verified" : "Not verified"}
            </Text>

            {/* Review button (unchanged) */}
            {canReviewMap[u.id]?.canReview && (
              <TouchableOpacity
                style={[
                  styles.searchBtn,
                  { alignSelf: "flex-start", marginTop: 8 },
                ]}
                onPress={() =>
                  nav.navigate("LeaveReview", {
                    bookingId: canReviewMap[u.id].bookingId,
                  })
                }
              >
                <Text style={styles.searchBtnText}>Leave a Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {/* RIGHT: icons (message + favourite) */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Message icon */}
          <TouchableOpacity
            onPress={() =>
              nav.navigate("PrivateChat", {
                doulaId: u.id,
                doulaAuthId: u.auth_id,
                doulaName: u.name,
              })
            }
            style={{ padding: 10 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={COLORS.accent}
            />
          </TouchableOpacity>

          {/* Heart icon */}
          <TouchableOpacity
            onPress={() => toggleFavourite(u.id)}
            disabled={isBusy}
            style={{ padding: 10 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={22}
              color={isFav ? COLORS.primary : COLORS.accent}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }}
  ListEmptyComponent={
    <Text style={{ marginTop: 8, color: "#2F2A2A" }}>
      No users found.
    </Text>
  }
/>




      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};
//https://reactnative.dev/docs/stylesheet- Modified for  user mobile
const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 10, color: COLORS.accent },
  navRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  micBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
    paddingHorizontal: 12,
  },
  searchBtnText: { color: "white", fontWeight: "600" },
  resetBtn: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetBtnText: { color: "white", fontWeight: "600" },
  reloadBtn: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  reloadText: { color: COLORS.white, fontWeight: "700" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  avatar: { width: 56, height: 56, borderRadius: 10, backgroundColor: "#eee" },
  userName: { fontWeight: "700", fontSize: 16, color: COLORS.text },
  userMeta: { color: COLORS.text, marginTop: 2 },
  verifiedText: { marginTop: 2, fontWeight: "600" },
  separator: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
});


