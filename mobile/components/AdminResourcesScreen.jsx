import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import api from "../api";

const COLORS = {
  background: "#FFF7F2",
  primary: "#F4A38C",
  accent: "#8C6A86",
  text: "#2F2A2A",
  white: "#FFFFFF",
  border: "#EBDAD2",
};

export default function AdminResourcesScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // form state (used for BOTH add and edit)
  const [editingId, setEditingId] = useState(null); // null = adding, number = editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [url, setUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("Read more");
  const [tags, setTags] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");

    setUrl("");
    setSourceLabel("Read more");
    setTags("");
  };

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await api.get("/resources");
      setItems(res.data || []);
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to load resources");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");


    setUrl(item.url || "");
    setSourceLabel(item.source_label || "Read more");
    setTags(item.tags || "");
  };

  const save = async () => {
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    const cleanUrl = url.trim();

    if (!cleanTitle || !cleanDesc || !cleanUrl) {
      Alert.alert("Missing data", "Title, description, and URL are required.");
      return;
    }

    try {
      if (editingId == null) {
        // ADD to POST /admin/resources
        await api.post("/admin/resources", {
  title: cleanTitle,
  description: cleanDesc,
  url: cleanUrl,
  source_label: sourceLabel.trim() || "Read more",
  tags: tags.trim() || "",
});

      } else {
        // EDIT -> PATCH /admin/resources/{id}
        await api.patch(`/admin/resources/${editingId}`, {
  title: cleanTitle,
  description: cleanDesc,
  url: cleanUrl,
  source_label: sourceLabel.trim() || "Read more",
  tags: tags.trim() || "",
});

      }

      resetForm();
      loadResources();
    } catch (e) {
      Alert.alert("Error", e?.message || "Save failed");
    }
  };

  const confirmDelete = (resourceId) => {
    Alert.alert("Delete resource?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/resources/${resourceId}`);
            loadResources();
            if (editingId === resourceId) resetForm();
          } catch (e) {
            Alert.alert("Error", e?.message || "Delete failed");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Resources</Text>

      {/* ADD/EDIT FORM (same form) */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>
          {editingId == null ? "Add resource" : "Edit resource"}
        </Text>

        <TextInput
          style={styles.input}
          value={title}
onChangeText={setTitle}
placeholder="Title"

        />
        <TextInput
          style={styles.input}
          value={description}
onChangeText={setDescription}

          placeholder="Description"
          multiline
        />
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="URL"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          value={sourceLabel}
          onChangeText={setSourceLabel}
          placeholder='Button label (e.g. "Read HSE guidance")'
        />
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder='Tags (comma separated, e.g. "sleep, feeding")'
          autoCapitalize="none"
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={save}>
            <Text style={styles.primaryBtnText}>
              {editingId == null ? "Add" : "Save"}
            </Text>
          </TouchableOpacity>

          {editingId != null && (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadResources} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={{ marginTop: 12, color: COLORS.text, opacity: 0.7 }}>
            No resources yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText} numberOfLines={2}>
              {item.description}

            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: COLORS.accent }]}
                onPress={() => startEdit(item)}
              >
                <Text style={styles.smallBtnText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: "#C94B4B" }]}
                onPress={() => confirmDelete(item.id)}
              >
                <Text style={styles.smallBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
    paddingTop: 48,
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.accent, marginBottom: 10 },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  formTitle: { fontWeight: "800", color: COLORS.accent, marginBottom: 10 },

  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: { color: COLORS.white, fontWeight: "800" },

  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: "center",
  },
  cancelBtnText: { color: COLORS.text, fontWeight: "800" },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontWeight: "800", color: COLORS.accent, marginBottom: 6 },
  cardText: { color: COLORS.text, opacity: 0.85 },

  smallBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  smallBtnText: { color: "white", fontWeight: "800" },
});
