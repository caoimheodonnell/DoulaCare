
// Fom Youtube Video - FastAPI and React Full-stack Application: Filter Products | react routing, POST REQUEST
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function NavBarMobile() {
  const [search, setSearch] = useState("");
  const nav = useNavigation();

  const onSearch = () => {
    // Pass search term to the screen below
    nav.setParams({ search });
  };

  return (
    <View style={styles.nav}>
      <Text style={styles.brand}>DoulaCare</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search doulas..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.button} onPress={onSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: "#222",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  brand: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
