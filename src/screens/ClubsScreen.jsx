import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/services";

export default function ClubsScreen() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", coordinatorId: String(user.id) });
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setRefreshing(true);
    api.listClubs().then(setClubs).finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const handleJoin = async (clubId) => {
    try {
      await api.joinClub(clubId);
      setMessage("Joined club successfully.");
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not join club.");
    }
  };

  const handleCreate = async () => {
    try {
      await api.createClub({ ...form, coordinatorId: Number(form.coordinatorId) });
      setShowForm(false);
      setForm({ name: "", description: "", coordinatorId: String(user.id) });
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not create club.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Clubs</Text>
        {(user.role === "STAFF" || user.role === "ADMIN") && (
          <TouchableOpacity onPress={() => setShowForm(!showForm)} style={styles.newButton}>
            <Text style={styles.newButtonText}>{showForm ? "Cancel" : "+ New club"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      {showForm && (
        <View style={styles.formCard}>
          <TextInput style={styles.input} placeholder="Club name" value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })} />
          <TextInput style={styles.input} placeholder="Description" value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })} />
          <TextInput style={styles.input} placeholder="Coordinator user ID" value={form.coordinatorId}
            onChangeText={(v) => setForm({ ...form, coordinatorId: v })} keyboardType="number-pad" />
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
            <Text style={styles.submitBtnText}>Create club</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={clubs}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardDesc}>{item.description || "No description provided."}</Text>
            <Text style={styles.cardMeta}>Coordinator: {item.coordinator?.name}</Text>
            {user.role === "STUDENT" && (
              <TouchableOpacity onPress={() => handleJoin(item.id)}>
                <Text style={styles.joinLink}>Join club →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No clubs yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1", padding: 20, paddingTop: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#1C2321" },
  newButton: { backgroundColor: "#1C2321", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  newButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  message: { color: "#3E5C50", marginBottom: 8 },
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#1C232114" },
  input: { borderWidth: 1, borderColor: "#1C232133", borderRadius: 8, padding: 10, marginBottom: 8 },
  submitBtn: { backgroundColor: "#3E5C50", borderRadius: 8, padding: 10, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "600" },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#1C232114" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1C2321" },
  cardDesc: { fontSize: 13, color: "#1C232199", marginTop: 2 },
  cardMeta: { fontSize: 11, color: "#1C232166", marginTop: 8 },
  joinLink: { color: "#3E5C50", fontWeight: "600", marginTop: 10, fontSize: 13 },
  empty: { color: "#1C232166", textAlign: "center", marginTop: 40 },
});
