/*
  UsersMobile.jsx

  Adapted for DoulaCare from YouTube tutorial "React Native tutorial #56 - List with API data"
  and ChatGPT React to React Native conversion guidance.

  What this file does:
   - Fetches doulas from FastAPI backend (/doulas endpoint, which supports filtering & sorting)
   - Implements navbar-style search bar (like YouTube video)
   - Allows server-side filtering with ?q=term, ?location, ?min_price, ?max_price
   - Integrates AddUserFormMobile (POST new doula)
   - Provides reload and reset functionality
   - Adds a navbar-like search bar (search state, updateSearch, filterUsers)
   - Adds compact side-by-side price sliders (works on iOS + Web)
   - "Reset" restores original list from backend (similar to resetting context)
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
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import api from "../api";
import Slider from "@react-native-community/slider";

const PLACEHOLDER = "https://placehold.co/100x100/FFF7F2/8C6A86?text=Doula";

export default function UsersMobile() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const route = useRoute();
  const nav = useNavigation();

  // 🔹 Price slider state
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(250);
  const PRICE_MIN = 0;
  const PRICE_MAX = 250;
  const PRICE_STEP = 5;

  const onChangeMin = (v) => setMinPrice(Math.min(v, maxPrice));
  const onChangeMax = (v) => setMaxPrice(Math.max(v, minPrice));

  // Header "Add" button
  useEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => nav.navigate("AddDoula")}
          style={{
            backgroundColor: "#F4A38C",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            Create Doula Profile
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [nav]);

  const fetchUsers = async (params = {}) => {
    try {
      const { data } = await api.get("/doulas", { params });
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching doulas:", error?.message || error);
      setUsers([]);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // React to header search param
  useEffect(() => {
    const headerTerm = route.params?.search ?? "";
    if (headerTerm === "") fetchUsers();
    else fetchUsers({ q: headerTerm });
  }, [route.params?.search]);

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

  // 🔹 Apply/Clear price filters
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DoulaCare</Text>

      {/* Search bar */}
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

      {/* 🔹 Compact Price Sliders (side-by-side) 🔹 */}
      <View
        style={{
          marginVertical: 8,
          width: "100%",
          alignItems: "center",
          paddingVertical: 6,
          backgroundColor: "rgba(255,255,255,0.5)",
          borderRadius: 8,
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
            <Slider
              style={{ width: "90%", height: 28 }}
              minimumValue={PRICE_MIN}
              maximumValue={PRICE_MAX}
              step={PRICE_STEP}
              value={minPrice}
              onValueChange={onChangeMin}
              minimumTrackTintColor={COLORS.primary}
              maximumTrackTintColor={COLORS.border}
              thumbTintColor={
                Platform.OS === "web" ? undefined : COLORS.accent
              }
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
              thumbTintColor={
                Platform.OS === "web" ? undefined : COLORS.accent
              }
            />
          </View>
        </View>

        {/* Buttons */}
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

      {/* User list */}
      <FlatList
        data={users}
        keyExtractor={(u) => String(u.id)}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item: u }) => (
          <TouchableOpacity
            onPress={() => nav.navigate("Details", { id: u.id })}
            style={styles.userRow}
          >
            <Image
              source={{ uri: u.photo_url || PLACEHOLDER }}
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
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ marginTop: 8, color: "#2F2A2A" }}>No users found.</Text>
        }
      />
    </View>
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

