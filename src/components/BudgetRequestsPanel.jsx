import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { budgetInbox, reviewBudgetRequest } from "../api/services";

const money = (n) =>
  "\u20B9" +
  Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const errText = (e, fallback) => e?.response?.data?.error || e?.message || fallback;

const confirmAsync = (title, message, okLabel) =>
  new Promise((resolve) => {
    if (Platform.OS === "web") {
      resolve(window.confirm(`${title}\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: okLabel, onPress: () => resolve(true) },
      ]);
    }
  });

const STATUS_STYLE = {
  PENDING: { bg: "#FFF4DB", fg: "#7A5600", label: "Pending" },
  APPROVED: { bg: "#E7F3EC", fg: "#1E6B43", label: "Approved" },
  REJECTED: { bg: "#FDECEA", fg: "#B3261E", label: "Rejected" },
};

/**
 * role STAFF / ADMIN: budget requests sent to them, with Approve / Reject buttons.
 * role STUDENT: the student's own requests with their status.
 */
export default function BudgetRequestsPanel({ role, refreshKey = 0 }) {
  const canReview = role === "STAFF" || role === "ADMIN";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await budgetInbox());
      setError("");
    } catch (e) {
      setError(errText(e, "Could not load budget requests"));
    } finally {
      setLoading(false);
    }
  }, []);

  // reload whenever the tab is focused or a new request was just sent
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshKey])
  );

  const review = async (item, approve) => {
    const ok = await confirmAsync(
      approve ? "Approve budget?" : "Reject budget?",
      `${item.title} - ${money(item.amount)}`,
      approve ? "Approve" : "Reject"
    );
    if (!ok) return;

    setBusyId(item.id);
    setError("");
    try {
      await reviewBudgetRequest(item.id, approve);
      await load();
    } catch (e) {
      setError(errText(e, "Could not save your decision"));
      await load(); // e.g. already reviewed -> refresh the list
    } finally {
      setBusyId(null);
    }
  };

  const pending = items.filter((i) => i.status === "PENDING");
  const reviewed = items.filter((i) => i.status !== "PENDING");

  const Card = ({ item, showButtons }) => {
    const st = STATUS_STYLE[item.status] || STATUS_STYLE.PENDING;
    const busy = busyId === item.id;
    return (
      <View style={styles.item}>
        <View style={styles.itemTop}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.eventName}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.clubName}
              {canReview ? `  |  from ${item.requestedByName}${item.requestedByRegisterNo ? ` (${item.requestedByRegisterNo})` : ""}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>{money(item.amount)}</Text>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Text style={[styles.badgeText, { color: st.fg }]}>{st.label}</Text>
            </View>
          </View>
        </View>

        {!!item.purpose && <Text style={styles.purpose}>{item.purpose}</Text>}

        {item.status !== "PENDING" && !!item.reviewedByName && (
          <Text style={styles.meta}>
            {st.label} by {item.reviewedByName}
            {item.reviewComment ? `: ${item.reviewComment}` : ""}
          </Text>
        )}

        {showButtons && (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.approve, busy && styles.disabled]}
              onPress={() => review(item, true)}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Approve</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.reject, busy && styles.disabled]}
              onPress={() => review(item, false)}
              disabled={busy}
            >
              <Text style={styles.btnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {canReview ? `Budget requests received${pending.length ? ` (${pending.length} pending)` : ""}` : "My budget requests"}
        </Text>
        {loading && <ActivityIndicator size="small" color="#3E5C50" />}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {!loading && items.length === 0 && (
        <Text style={styles.empty}>
          {canReview ? "No budget requests yet." : "You have not sent any budget requests yet."}
        </Text>
      )}

      {canReview && pending.map((i) => <Card key={i.id} item={i} showButtons />)}

      {canReview && reviewed.length > 0 && <Text style={styles.subHeader}>Reviewed</Text>}
      {canReview && reviewed.map((i) => <Card key={i.id} item={i} showButtons={false} />)}

      {!canReview && items.map((i) => <Card key={i.id} item={i} showButtons={false} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 18, fontWeight: "700", color: "#1C2321", flex: 1 },
  subHeader: { fontSize: 14, fontWeight: "700", color: "#777", marginTop: 16, marginBottom: 4 },
  empty: { color: "#777", fontSize: 14, marginTop: 8 },
  error: {
    backgroundColor: "#FDECEA",
    color: "#B3261E",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    fontSize: 13,
  },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#EEEDE7" },
  itemTop: { flexDirection: "row", justifyContent: "space-between" },
  eventName: { fontSize: 16, fontWeight: "700", color: "#1C2321" },
  meta: { fontSize: 13, color: "#666", marginTop: 3 },
  purpose: { fontSize: 13, color: "#555", marginTop: 8, lineHeight: 18 },
  amount: { fontSize: 18, fontWeight: "800", color: "#1C2321" },
  badge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, marginTop: 5 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  approve: { backgroundColor: "#1E6B43" },
  reject: { backgroundColor: "#B3261E" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
});
