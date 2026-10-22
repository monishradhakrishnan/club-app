import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import * as api from "../api/services";

function StaffAttendance() {
  const [clubs, setClubs] = useState([]);
  const [clubId, setClubId] = useState("");
  const [title, setTitle] = useState("");
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.listClubs().then((cl) => {
      setClubs(cl);
      if (cl.length) setClubId(String(cl[0].id));
    });
  }, []);

  const handleGenerate = async () => {
    setMessage("");
    try {
      const s = await api.generateOtp(Number(clubId), title);
      setSession(s);
      setRecords([]);
    } catch (err) {
      setMessage(err.response?.data?.error || "Could not generate OTP.");
    }
  };

  const refreshRecords = async () => {
    if (!session) return;
    const r = await api.sessionRecords(session.id);
    setRecords(r);
  };

  const handleClose = async () => {
    if (!session) return;
    await api.closeSession(session.id);
    setSession({ ...session, active: false });
  };

  return (
    <View>
      <View style={styles.formCard}>
        <Text style={styles.formLabel}>Start attendance session</Text>
        {clubs.length > 0 && (
          <View style={styles.pickerWrap}>
            <Picker selectedValue={clubId} onValueChange={setClubId}>
              {clubs.map((c) => <Picker.Item key={c.id} label={c.name} value={String(c.id)} />)}
            </Picker>
          </View>
        )}
        <TextInput style={styles.input} placeholder="Session title (e.g. Weekly meeting - 12 Aug)"
          value={title} onChangeText={setTitle} />
        <TouchableOpacity style={styles.submitBtn} onPress={handleGenerate}>
          <Text style={styles.submitBtnText}>Generate OTP</Text>
        </TouchableOpacity>
        {message ? <Text style={{ color: "#A64B3F", marginTop: 6 }}>{message}</Text> : null}
      </View>

      {session && (
        <View style={styles.otpCard}>
          <Text style={styles.otpSubtitle}>{session.title}</Text>
          <Text style={styles.otpDigits}>{session.otp}</Text>
          <Text style={styles.otpExpiry}>
            Expires at {new Date(session.expiresAt).toLocaleTimeString()}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16 }}>
            <TouchableOpacity onPress={refreshRecords}>
              <Text style={styles.otpAction}>Refresh check-ins ({records.length})</Text>
            </TouchableOpacity>
            {session.active && (
              <TouchableOpacity onPress={handleClose}>
                <Text style={[styles.otpAction, { color: "#E08578" }]}>Close session</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {records.length > 0 && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.formLabel}>Present ({records.length})</Text>
          {records.map((r) => (
            <Text key={r.id} style={styles.recordRow}>
              {r.student?.name} — {new Date(r.markedAt).toLocaleTimeString()}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function StudentAttendance() {
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length < 4 || loading) return;
    setStatus(null);
    setLoading(true);
    try {
      const rec = await api.verifyOtp(otp);
      const clubName = rec?.session?.club?.name;
      const title = rec?.session?.title;
      setStatus({
        type: "success",
        text: `You're marked present${clubName ? ` for ${clubName}` : ""}${title ? ` — ${title}` : ""}. ✅`,
      });
      setOtp("");
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.error || "Could not verify OTP." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formLabel}>Mark attendance</Text>
      <Text style={{ color: "#1C232199", fontSize: 13, marginBottom: 10 }}>
        Enter the OTP shown on your coordinator's screen.
      </Text>
      <TextInput
        style={[styles.input, styles.otpInput]}
        placeholder="------"
        keyboardType="number-pad"
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/\D/g, ""))}
        maxLength={6}
        autoFocus
        onSubmitEditing={handleVerify}
      />
      <TouchableOpacity
        style={[styles.submitBtn, (otp.length < 4 || loading) && { opacity: 0.5 }]}
        onPress={handleVerify}
        disabled={otp.length < 4 || loading}
      >
        <Text style={styles.submitBtnText}>{loading ? "Verifying..." : "Verify & mark present"}</Text>
      </TouchableOpacity>
      {status && (
        <Text style={{ marginTop: 8, color: status.type === "success" ? "#3E5C50" : "#A64B3F" }}>
          {status.text}
        </Text>
      )}
    </View>
  );
}

export default function AttendanceScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={styles.title}>Attendance</Text>
      {user.role === "STUDENT" ? <StudentAttendance /> : <StaffAttendance />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1", padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: "700", color: "#1C2321", marginBottom: 16 },
  formCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#1C232114" },
  formLabel: { fontWeight: "600", marginBottom: 10, fontSize: 15 },
  pickerWrap: { borderWidth: 1, borderColor: "#1C232133", borderRadius: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#1C232133", borderRadius: 8, padding: 10, marginBottom: 8 },
  otpInput: { textAlign: "center", fontSize: 20, letterSpacing: 6 },
  submitBtn: { backgroundColor: "#1C2321", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 4 },
  submitBtnText: { color: "#F6F5F1", fontWeight: "600" },
  otpCard: { backgroundColor: "#1C2321", borderRadius: 14, padding: 28, marginTop: 20, alignItems: "center" },
  otpSubtitle: { color: "#F6F5F199", fontSize: 13, marginBottom: 6 },
  otpDigits: { color: "#F6F5F1", fontSize: 42, fontWeight: "700", letterSpacing: 8 },
  otpExpiry: { color: "#F6F5F166", fontSize: 12, marginTop: 8 },
  otpAction: { color: "#F6F5F1CC", textDecorationLine: "underline", fontSize: 13 },
  recordRow: { fontSize: 13, color: "#1C232199", paddingVertical: 3 },
});