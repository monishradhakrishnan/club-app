import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api/client";

// Bar turns red below this attendance percentage. Change to whatever your college requires.
const ATTENDANCE_THRESHOLD = 75;

function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function ClubProfileScreen({ route, navigation }) {
  const { clubId } = route.params;

  const [club, setClub] = useState(null);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clubRes, summaryRes, eventsRes] = await Promise.all([
        client.get(`/api/clubs/${clubId}`),
        client.get(`/api/attendance/club/${clubId}/summary`),
        client.get(`/api/events/club/${clubId}`),
      ]);
      setClub(clubRes.data);
      setSummary(summaryRes.data);
      // Soonest event first
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

  const good = summary.percentage >= ATTENDANCE_THRESHOLD;
  const barColor = summary.totalSessions === 0 ? "#1C232133" : good ? "#3E5C50" : "#B3261E";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 32, paddingBottom: 60 }}>
      <Text style={styles.clubName}>{club.name}</Text>
      {!!club.description && <Text style={styles.clubDesc}>{club.description}</Text>}
      {club.coordinator && (
        <Text style={styles.coordinatorText}>
          Coordinator: {club.coordinator.name}
          {club.coordinator.registerNo ? ` (${club.coordinator.registerNo})` : ""}
        </Text>
      )}

      <Text style={styles.sectionLabel}>Your attendance</Text>

      <View style={styles.summaryCard}>
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <Text style={styles.summaryBig}>{summary.attendedSessions}</Text>
          <Text style={styles.summaryOf}> / {summary.totalSessions} sessions attended</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${summary.percentage}%`, backgroundColor: barColor }]} />
        </View>
        <Text style={[styles.summaryPct, { color: barColor }]}>
          {summary.totalSessions === 0
            ? "No sessions held yet"
            : `${summary.percentage}%${good ? "" : ` · below ${ATTENDANCE_THRESHOLD}%`}`}
        </Text>
        <TouchableOpacity style={styles.markBtn} onPress={() => navigation.navigate("Attendance")}>
          <Text style={styles.markBtnText}>Mark attendance with OTP</Text>
        </TouchableOpacity>
      </View>

      {summary.sessions.length > 0 &&
        summary.sessions.map((s) => (
          <View key={s.id} style={styles.sessionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sessionTitle}>{s.title || "Session"}</Text>
              <Text style={styles.sessionDate}>{formatDateTime(s.date)}</Text>
            </View>
            <Text style={[styles.badge, s.attended ? styles.badgeYes : styles.badgeNo]}>
              {s.attended ? "Present" : "Absent"}
            </Text>
          </View>
        ))}

      <Text style={styles.sectionLabel}>Events</Text>

      {events.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No events posted for this club yet.</Text>
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
  coordinatorText: { fontSize: 13, color: "#3E5C50", fontWeight: "600", marginTop: 10 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: "#1C232199",
    textTransform: "uppercase", letterSpacing: 0.5, marginTop: 28, marginBottom: 10,
  },

  summaryCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 14,
    borderWidth: 1, borderColor: "#1C232114",
  },
  summaryBig: { fontSize: 40, fontWeight: "700", color: "#1C2321", lineHeight: 44 },
  summaryOf: { fontSize: 14, color: "#1C232199", marginBottom: 6 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: "#1C232111", marginTop: 12, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  summaryPct: { fontSize: 13, fontWeight: "700", marginTop: 8 },
  markBtn: { backgroundColor: "#1C2321", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 14 },
  markBtnText: { color: "#F6F5F1", fontWeight: "600" },

  sessionRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#1C232114",
  },
  sessionTitle: { fontSize: 14, fontWeight: "700", color: "#1C2321" },
  sessionDate: { fontSize: 12, color: "#1C232199", marginTop: 2 },
  badge: { fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, overflow: "hidden" },
  badgeYes: { color: "#3E5C50", backgroundColor: "#3E5C5018" },
  badgeNo: { color: "#B3261E", backgroundColor: "#B3261E14" },

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