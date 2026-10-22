import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function ClubManageScreen({ route, navigation }) {
  const { clubId } = route.params;

  const [club, setClub] = useState(null);
  const [memberCount, setMemberCount] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clubRes, membersRes, eventsRes] = await Promise.all([
        client.get(`/api/clubs/${clubId}`),
        client.get(`/api/clubs/${clubId}/members`),
        client.get(`/api/events/club/${clubId}`),
      ]);
      setClub(clubRes.data);
      setMemberCount(membersRes.data.length);
      setEvents(
        [...eventsRes.data].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
      );
    } catch (err) {
      setError("Couldn't load this club's details.");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1C2321" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 32 }}>
      <Text style={styles.clubName}>{club.name}</Text>
      {!!club.description && <Text style={styles.clubDesc}>{club.description}</Text>}
      <Text style={styles.metaText}>
        {memberCount}/{club.maxStudents} students registered
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate("CreateEvent", { clubId, clubName: club.name })}
      >
        <Text style={styles.primaryButtonText}>+ Create event</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Upcoming & past events</Text>

      {events.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No events yet for this club.</Text>
        </View>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventDate}>{formatDateTime(event.eventDate)}</Text>
            {!!event.description && <Text style={styles.eventDesc}>{event.description}</Text>}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F5F1" },
  clubName: { fontSize: 24, fontWeight: "700", color: "#1C2321" },
  clubDesc: { fontSize: 14, color: "#1C232199", marginTop: 6 },
  metaText: { fontSize: 13, color: "#3E5C50", fontWeight: "600", marginTop: 10 },
  primaryButton: {
    backgroundColor: "#3E5C50", borderRadius: 14, paddingVertical: 14,
    alignItems: "center", marginTop: 20,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: "#1C232199",
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 28, marginBottom: 10,
  },
  eventCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: "#1C232114",
  },
  eventTitle: { fontSize: 15, fontWeight: "700", color: "#1C2321" },
  eventDate: { fontSize: 12, color: "#3E5C50", fontWeight: "600", marginTop: 4 },
  eventDesc: { fontSize: 13, color: "#1C232199", marginTop: 6 },
  emptyBox: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#1C232114", borderStyle: "dashed",
  },
  emptyText: { color: "#1C232199" },
  errorText: { color: "#B3261E" },
});
