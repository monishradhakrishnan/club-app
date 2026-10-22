import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from "react-native";
import client from "../api/client";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function CreateEventScreen({ route, navigation }) {
  const { clubId, clubName } = route.params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:mm
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const valid = title.trim().length > 0 && DATE_RE.test(date) && TIME_RE.test(time);

  const submit = async () => {
    if (!valid) {
      setError("Enter a title, a date as YYYY-MM-DD, and a time as HH:mm.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await client.post("/api/events", {
        clubId,
        title: title.trim(),
        description: description.trim() || null,
        eventDate: `${date}T${time}:00`,
      });
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the event. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 32 }}>
        <Text style={styles.subtitle}>New event for {clubName}</Text>

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Annual Tech Fest"
          placeholderTextColor="#1C232166"
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="What's this event about?"
          placeholderTextColor="#1C232166"
          multiline
          numberOfLines={4}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#1C232166"
              keyboardType={Platform.OS === "web" ? "default" : "numbers-and-punctuation"}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="HH:mm"
              placeholderTextColor="#1C232166"
              keyboardType={Platform.OS === "web" ? "default" : "numbers-and-punctuation"}
            />
          </View>
        </View>

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.submitButton, (!valid || submitting) && { opacity: 0.6 }]}
          onPress={submit}
          disabled={!valid || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1" },
  subtitle: { color: "#1C232199", marginBottom: 20, fontSize: 14 },
  label: { fontSize: 13, fontWeight: "700", color: "#1C2321", marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: "#1C232122", color: "#1C2321", fontSize: 15,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  errorText: { color: "#B3261E", marginTop: 16 },
  submitButton: {
    backgroundColor: "#3E5C50", borderRadius: 14, paddingVertical: 14,
    alignItems: "center", marginTop: 24,
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
