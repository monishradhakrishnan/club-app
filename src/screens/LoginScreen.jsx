import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      // Navigation switches automatically once `user` is set in AuthContext
    } catch (err) {
      // TEMP DEBUG — remove once issue is fixed
      console.log("LOGIN ERROR MESSAGE:", err.message);
      console.log("LOGIN ERROR CODE:", err.code);
      console.log("LOGIN ERROR STATUS:", err.response?.status);
      console.log("LOGIN ERROR DATA:", err.response?.data);
      console.log("LOGIN ERROR CONFIG URL:", err.config?.baseURL, err.config?.url);

      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to your campus account.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? "Signing in…" : "Sign in"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 20 }}>
        <Text style={styles.link}>New here? Create an account</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: 28, backgroundColor: "#F6F5F1" },
  title: { fontSize: 28, fontWeight: "700", color: "#1C2321", marginBottom: 4 },
  subtitle: { color: "#1C232199", marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: "#1C232133", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, backgroundColor: "#fff",
  },
  button: { backgroundColor: "#1C2321", borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#F6F5F1", fontWeight: "600" },
  error: { color: "#A64B3F", marginBottom: 8 },
  link: { color: "#3E5C50", fontWeight: "600" },
});