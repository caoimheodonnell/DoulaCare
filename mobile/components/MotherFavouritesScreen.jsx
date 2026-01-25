/*
   How this screen is similar to MotherBookingsScreen:
   - Both screens are mother-specific views that load data only for the
     currently logged-in mother.
   - Both retrieve the mother’s Supabase auth ID using supabase.auth.getSession().
   - Both fetch data from the FastAPI backend using Axios:
       - MotherBookingsScreen: GET /bookings/by-mother-auth/{mother_uuid}/details
       - MotherFavouritesScreen: GET /favourites/by-mother-auth/{mother_uuid}/details
   - Both use useEffect to trigger data loading once the mother ID is available.
   - Both display the fetched data in a FlatList and allow navigation to
     related doula details for follow-up actions.

  References:
   - React Native FlatList and TouchableOpacity:
     https://reactnative.dev/docs/flatlist
     https://reactnative.dev/docs/touchableopacity
   - Axios
     https://axios-http.com/docs/api_intro
   - Supabase Auth (getSession):
     https://supabase.com/docs/reference/javascript/auth-getsession
   - React Hooks (useState / useEffect):
     https://react.dev/reference/react
*/

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { supabase } from "../supabaseClient";
import api, { toAbsolute } from "../api";

// Placeholder image shown if a doula has not uploaded a photo
const PLACEHOLDER =
  "https://placehold.co/100x100/FFF7F2/8C6A86?text=Doula";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
};


export default function MotherFavouritesScreen({ navigation }) {
  // Stores the logged-in mother’s Supabase auth UUID
  // Same pattern used in MotherBookingsScreen
  const [motherAuthId, setMotherAuthId] = useState(null);

  // list of favourite doulas returned from the backend
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load logged-in mother UUID (Supabase)
  /*
    - Uses supabase.auth.getSession() to retrieve the current user
    - Only the auth UUID is required, as the backend resolves the mother internally
    - This mirrors the auth logic used in MotherBookingsScreen
     - Supabase Auth getSession():
       https://supabase.com/docs/reference/javascript/auth-getsession
  */
  useEffect(() => {
    const loadAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setMotherAuthId(data?.session?.user?.id || null);
    };
    loadAuth();
  }, []);

  //  Fetch favourites
  /*
    - Calls the FastAPI backend using Axios
    - Endpoint only returns favourites belonging to this mother
    - Very similar to:
        GET /bookings/by-mother-auth/{mother_uuid}/details
      used in MotherBookingsScreen
     - Axios GET requests:
       https://axios-http.com/docs/api_intro
  */
  const loadFavourites = async () => {
    if (!motherAuthId) return;

    try {
      setLoading(true);
      const res = await api.get(
        `/favourites/by-mother-auth/${motherAuthId}/details`
      );
      setFavourites(res.data || []);
    } catch (e) {
      console.warn("Failed to load favourites", e?.message || e);
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

   /*
    Trigger loading of favourites only AFTER motherAuthId exists
    - Same pattern as MotherBookingsScreen
  */
  useEffect(() => {
    if (motherAuthId) loadFavourites();
  }, [motherAuthId]);

    /*
    Loading state UI

    - Displays ActivityIndicator while data is being fetched
    - Same UX pattern used across other data-fetching screen
       https://reactnative.dev/docs/activityindicator
  */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading favourites…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Favourite Doulas</Text>

      <FlatList
        data={favourites}
        keyExtractor={(f) => String(f.favourite_id)}
        contentContainerStyle={{ padding: 12 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            You haven’t favourited any doulas yet.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("Details", { id: item.doula_id })
            }
          >
            <Image
              source={{
                uri: item.photo_url
                  ? toAbsolute(item.photo_url)
                  : PLACEHOLDER,
              }}
              style={styles.avatar}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.doula_name}</Text>
              <Text style={styles.meta}>{item.location}</Text>
              {item.verified && (
                <Text style={styles.verified}>Verified</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
//https://reactnative.dev/docs/stylesheet- Modified for favoruites
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.accent,
    textAlign: "center",
    marginVertical: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  name: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
  },
  meta: {
    color: COLORS.text,
    marginTop: 2,
  },
  verified: {
    marginTop: 4,
    color: "green",
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: COLORS.text,
  },
});
