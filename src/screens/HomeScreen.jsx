import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const cards = [
    { to: "Clubs", label: "Clubs", desc: "Browse and join campus clubs." },
    { to: "Budget", label: "Budget requests", desc: user.role === "STUDENT" ? "Apply for club funding." : "Review pending requests." },
    { to: "Attendance", label: "Attendance", desc: user.role === "STUDENT" ? "Enter OTP to mark present." : "Generate OTP for your session." },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi {user.name.split(" ")[0]},</Text>
      <Text style={styles.subtitle}>Here's your campus ecosystem at a glance.</Text>

      {cards.map((c) => (
        <TouchableOpacity key={c.to} style={styles.card} onPress={() => navigation.navigate(c.to)}>
          <Text style={styles.cardTitle}>{c.label}</Text>
          <Text style={styles.cardDesc}>{c.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1", padding: 24, paddingTop: 40 },
  title: { fontSize: 26, fontWeight: "700", color: "#1C2321" },
  subtitle: { color: "#1C232199", marginTop: 4, marginBottom: 24 },
  card: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 12,
    borderWidth: 1, borderColor: "#1C232114",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1C2321", marginBottom: 4 },
  cardDesc: { fontSize: 13, color: "#1C232199" },
});
