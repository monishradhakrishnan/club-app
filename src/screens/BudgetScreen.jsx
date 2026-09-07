import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, RefreshControl, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/services";

const statusStyle = {
  PENDING: { backgroundColor: "#B5834D22", color: "#B5834D" },
  APPROVED: { backgroundColor: "#3E5C5022", color: "#3E5C50" },
  REJECTED: { backgroundColor: "#A64B3F22", color: "#A64B3F" },
};

export default function BudgetScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ clubId: "", title: "", purpose: "", amount: "" });
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    setRefreshing(true);
    Promise.all([api.myBudgetRequests(), api.listClubs()])
      .then(([reqs, cl]) => {
        setRequests(reqs);
        setClubs(cl);
        if (!form.clubId && cl.length) setForm((f) => ({ ...f, clubId: String(cl[0].id) }));
      })
      .finally(() => setRefreshing(false));
  }, []);

  useEffect(load, [load]);

  const handleApply = async () => {
    try {
      await api.createBudgetRequest({ ...form, clubId: Number(form.clubId), amount: Number(form.amount) });
      setForm({ ...form, title: "", purpose: "", amount: "" });
      setMessage("Budget request submitted.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not submit request.");
    }
  };

  const handleReview = (id, approve) => {
    Alert.prompt(
      approve ? "Approval comment (optional)" : "Reason for rejection",
      "",
      async (comment) => {
        try {
          await api.reviewBudgetRequest(id, approve, comment || "");
          load();
        } catch (err) {
          setMessage(err.response?.data?.error || "Could not review request.");
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Budget requests</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}

      {user.role === "STUDENT" && clubs.length > 0 && (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Apply for budget</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={form.clubId} onValueChange={(v) => setForm({ ...form, clubId: v })}>
              {clubs.map((c) => <Picker.Item key={c.id} label={c.name} value={String(c.id)} />)}
            </Picker>
          </View>
          <TextInput style={styles.input} placeholder="Title" value={form.title}
            onChangeText={(v) => setForm({ ...form, title: v })} />
          <TextInput style={styles.input} placeholder="Purpose / justification" value={form.purpose}
            onChangeText={(v) => setForm({ ...form, purpose: v })} />
          <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="decimal-pad" value={form.amount}
            onChangeText={(v) => setForm({ ...form, amount: v })} />
          <TouchableOpacity style={styles.submitBtn} onPress={handleApply}>
            <Text style={styles.submitBtnText}>Submit request</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={requests}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.purpose}</Text>
              <Text style={styles.cardMeta}>{item.club?.name} · ₹{item.amount}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.badge, statusStyle[item.status]]}>{item.status}</Text>
              {(user.role === "STAFF" || user.role === "ADMIN") && item.status === "PENDING" && (
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => handleReview(item.id, true)}>
                    <Text style={{ color: "#3E5C50", fontWeight: "600", fontSize: 12 }}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleReview(item.id, false)}>
                    <Text style={{ color: "#A64B3F", fontWeight: "600", fontSize: 12 }}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No budget requests yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1", padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#1C2321", marginBottom: 12 },
  message: { color: "#3E5C50", marginBottom: 8 },
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#1C232114" },
  formLabel: { fontWeight: "600", marginBottom: 8 },
  pickerWrap: { borderWidth: 1, borderColor: "#1C232133", borderRadius: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#1C232133", borderRadius: 8, padding: 10, marginBottom: 8 },
  submitBtn: { backgroundColor: "#3E5C50", borderRadius: 8, padding: 10, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "600" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#1C232114", flexDirection: "row", justifyContent: "space-between",
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1C2321" },
  cardDesc: { fontSize: 13, color: "#1C232199", marginTop: 2 },
  cardMeta: { fontSize: 11, color: "#1C232166", marginTop: 6 },
  badge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, overflow: "hidden" },
  empty: { color: "#1C232166", textAlign: "center", marginTop: 40 },
});
