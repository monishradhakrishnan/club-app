import { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

// Small square club tile (three per row)
function ClubTile({ club, onPress, showCoordinator }) {
  return (
    <TouchableOpacity style={[styles.tile, styles.clubTile]} onPress={onPress}>
      <View>
        <Text style={styles.clubName} numberOfLines={3}>{club.name}</Text>
      </View>
      <Text style={styles.clubMeta}>
        {club.memberCount}/{club.maxStudents} students
      </Text>
    </TouchableOpacity>
  );
}

// Compact quick-access tile (three per row)
function QuickTile({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={[styles.quickTile]} onPress={onPress}>
      <Ionicons name={icon} size={20} color="#3E5C50" />
      <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const isStudent = user.role === "STUDENT";

  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [clubsError, setClubsError] = useState(null);

  const loadClubs = useCallback(async () => {
    setLoadingClubs(true);
    setClubsError(null);
    try {
      const endpoint = isStudent ? "/api/clubs/joined" : "/api/clubs/coordinating";
      const { data } = await client.get(endpoint);
      setClubs(data);
    } catch (err) {
      setClubsError("Couldn't load your clubs. Pull down or reopen this tab to retry.");
    } finally {
      setLoadingClubs(false);
    }
  }, [isStudent]);

  // Refresh every time Home comes into focus (e.g. after joining a club or creating an event)
  useFocusEffect(
    useCallback(() => {
      loadClubs();
    }, [loadClubs])
  );

  const openClub = (club) => {
    if (isStudent) {
      navigation.navigate("ClubProfile", { clubId: club.id, clubName: club.name });
    } else {
      navigation.navigate("ClubManage", { clubId: club.id, clubName: club.name });
    }
  };

  const quick = [
    { to: "Clubs", icon: "people-outline", label: "Clubs", desc: "Browse and join campus clubs." },
    {
      to: "Budget", icon: "cash-outline", label: "Budget",
      desc: isStudent ? "Apply for club funding." : "Review pending requests.",
    },
    {
      to: "Attendance", icon: "qr-code-outline", label: "Attendance",
      desc: isStudent ? "Enter OTP to mark present." : "Generate OTP for your session.",
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Hi {user.name.split(" ")[0]},</Text>
      <Text style={styles.subtitle}>Here's your campus ecosystem at a glance.</Text>

      <Text style={styles.sectionLabel}>
        {isStudent ? "Your clubs" : "Clubs you coordinate"}
      </Text>

      {loadingClubs && <ActivityIndicator color="#1C2321" style={{ marginBottom: 16 }} />}

      {!loadingClubs && clubsError && <Text style={styles.errorText}>{clubsError}</Text>}

      {!loadingClubs && !clubsError && clubs.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {isStudent
              ? "You haven't joined any clubs yet."
              : "You haven't created any clubs yet."}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Clubs")}>
            <Text style={styles.emptyLink}>
              {isStudent ? "Browse clubs to join one →" : "Create a club →"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!loadingClubs && !clubsError && clubs.length > 0 && (
        <View style={styles.grid}>
          {clubs.map((club) => (
            <ClubTile
              key={club.id}
              club={club}
              showCoordinator={isStudent}
              onPress={() => openClub(club)}
            />
          ))}
        </View>
      )}

      <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Quick access</Text>

      <View style={styles.grid}>
        {quick.map((q) => (
          <QuickTile
            key={q.to}
            icon={q.icon}
            label={q.label}
              onPress={() => navigation.navigate(q.to)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1" },
  content: { padding: 24, paddingTop: 40, paddingBottom: 60 },
  title: { fontSize: 26, fontWeight: "700", color: "#1C2321" },
  subtitle: { color: "#1C232199", marginTop: 4, marginBottom: 24 },
  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: "#1C232199",
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },

  // Club tiles: two per row, compact. Quick tiles: three per row.
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start", gap: 8 },
  tile: {
    width: "30%", aspectRatio: 2.1, borderRadius: 10, padding: 8,
    justifyContent: "space-between", backgroundColor: "#fff",
  },
  clubTile: { borderWidth: 1, borderColor: "#3E5C5033", borderTopWidth: 3, borderTopColor: "#3E5C50" },
  quickTile: {
    width: "30%", aspectRatio: 2.1, borderRadius: 10, padding: 6,
    alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#1C232114",
  },
  quickLabel: { fontSize: 10, fontWeight: "700", color: "#1C2321", marginTop: 2 },

  clubName: { fontSize: 12, fontWeight: "700", color: "#1C2321" },
  clubCoordinator: { fontSize: 11, color: "#1C232199", marginTop: 2 },
  clubMeta: { fontSize: 9, color: "#3E5C50", fontWeight: "600" },

  errorText: { color: "#B3261E", marginBottom: 16 },
  emptyBox: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: "#1C232114", borderStyle: "dashed",
  },
  emptyText: { color: "#1C232199", marginBottom: 8 },
  emptyLink: { color: "#3E5C50", fontWeight: "700" },
});