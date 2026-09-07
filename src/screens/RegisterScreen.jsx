import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";

const ROLES = ["STUDENT", "STAFF"];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "", email: "", password: "", registerNo: "", role: "STUDENT", department: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key, val) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    setError("");
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Join the campus ecosystem.</Text>

      <TextInput style={styles.input} placeholder="Full name" value={form.name} onChangeText={(v) => update("name", v)} />
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address"
        value={form.email} onChangeText={(v) => update("email", v)} />
      <TextInput style={styles.input} placeholder="Register / Staff No." value={form.registerNo}
        onChangeText={(v) => update("registerNo", v)} />
      <TextInput style={styles.input} placeholder="Department" value={form.department}
        onChangeText={(v) => update("department", v)} />

      <Text style={styles.label}>I am a</Text>
      <View style={styles.roleRow}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleChip, form.role === r && styles.roleChipActive]}
            onPress={() => update("role", r)}
          >
            <Text style={[styles.roleChipText, form.role === r && styles.roleChipTextActive]}>
              {r === "STUDENT" ? "Student" : "Staff / Coordinator"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Password (min 8 chars)" secureTextEntry
        value={form.password} onChangeText={(v) => update("password", v)} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Creating…" : "Create account"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")} style={{ marginTop: 20, alignItems: "center" }}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 28, paddingVertical: 60, backgroundColor: "#F6F5F1" },
  title: { fontSize: 28, fontWeight: "700", color: "#1C2321", marginBottom: 4 },
  subtitle: { color: "#1C232199", marginBottom: 24 },
  label: { fontSize: 13, fontWeight: "600", color: "#1C2321", marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: "#1C232133", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, backgroundColor: "#fff",
  },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  roleChip: { borderWidth: 1, borderColor: "#1C232133", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  roleChipActive: { backgroundColor: "#3E5C50", borderColor: "#3E5C50" },
  roleChipText: { color: "#1C2321", fontSize: 13 },
  roleChipTextActive: { color: "#fff", fontWeight: "600" },
  button: { backgroundColor: "#1C2321", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#F6F5F1", fontWeight: "600" },
  error: { color: "#A64B3F", marginBottom: 8 },
  link: { color: "#3E5C50", fontWeight: "600" },
});
