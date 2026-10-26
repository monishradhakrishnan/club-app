import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../context/AuthContext";
import {
  extractBill,
  saveBill,
  listBills,
  deleteBill,
  clubsForBills,
  downloadBillsExcel,
  apiError,
} from "../api/billService";

const CATEGORIES = [
  "Food & Refreshments",
  "Printing & Stationery",
  "Certificates & Prizes",
  "Equipment & Hardware",
  "Venue & Decoration",
  "Travel & Transport",
  "Other",
];

const EMPTY_FORM = {
  vendor: "",
  billNumber: "",
  billDate: "",
  category: "Other",
  subtotal: "",
  tax: "",
  total: "",
  clubId: "",
};

const fmt = (n) =>
  n === null || n === undefined || n === ""
    ? "-"
    : Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const confirmAsync = (title, message) =>
  new Promise((resolve) => {
    if (Platform.OS === "web") {
      resolve(window.confirm(`${title}\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
      ]);
    }
  });

export default function BillsScreen() {
  const { user } = useAuth();

  const [asset, setAsset] = useState(null); // picked PDF
  const [extracting, setExtracting] = useState(false);
  const [preview, setPreview] = useState(null); // ML result
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [bills, setBills] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lastSavedId, setLastSavedId] = useState(null); // newest saved bill -> its own Excel

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      setBills(await listBills());
    } catch (e) {
      setError(apiError(e, "Could not load bills"));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  useEffect(() => {
    if (!user?.role) return;
    clubsForBills(user.role)
      .then(setClubs)
      .catch(() => setClubs([]));
  }, [user?.role]);

  const pickPdf = async () => {
    setError("");
    setSuccess("");
    setLastSavedId(null);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const picked = res.assets[0];
      if (!/\.pdf$/i.test(picked.name || "") && picked.mimeType !== "application/pdf") {
        setError("Please choose a PDF file.");
        return;
      }
      setAsset(picked);
      setPreview(null);
      setForm(EMPTY_FORM);
    } catch (e) {
      setError(apiError(e, "Could not open the file picker"));
    }
  };

  const runExtract = async () => {
    if (!asset) return;
    setError("");
    setSuccess("");
    setExtracting(true);
    try {
      const data = await extractBill(asset);
      setPreview(data);
      setForm({
        vendor: data.vendor || "",
        billNumber: data.bill_number || "",
        billDate: data.bill_date || "",
        category: data.category || "Other",
        subtotal: data.subtotal != null ? String(data.subtotal) : "",
        tax: data.tax != null ? String(data.tax) : "",
        total: data.total != null ? String(data.total) : "",
        clubId: "",
      });
    } catch (e) {
      setPreview(null);
      setError(apiError(e, "Could not read this bill"));
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    setError("");
    setSuccess("");

    const total = Number(form.total);
    if (!form.total || Number.isNaN(total) || total <= 0) {
      setError("Enter a valid total amount greater than 0.");
      return;
    }
    if (form.billDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.billDate)) {
      setError("Bill date must look like 2026-10-22 (YYYY-MM-DD).");
      return;
    }
    const optionalNumber = (v, label) => {
      if (v === "") return null;
      const n = Number(v);
      if (Number.isNaN(n) || n < 0) throw new Error(`${label} must be a number.`);
      return n;
    };

    let subtotal, tax;
    try {
      subtotal = optionalNumber(form.subtotal, "Subtotal");
      tax = optionalNumber(form.tax, "Tax");
    } catch (e) {
      setError(e.message);
      return;
    }

    setSaving(true);
    try {
      const saved = await saveBill({
        clubId: form.clubId ? Number(form.clubId) : null,
        vendor: form.vendor.trim() || null,
        billNumber: form.billNumber.trim() || null,
        billDate: form.billDate || null,
        currency: preview?.currency || "INR",
        subtotal,
        taxAmount: tax,
        totalAmount: total,
        category: form.category,
        fileName: asset?.name || null,
        confidence: preview?.confidence ?? null,
        items: preview?.items || [],
      });
      setLastSavedId(saved.id);
      setSuccess(`Saved: ${fmt(total)}. A new Excel file with only this bill is downloading. If it did not start, tap "Download Excel for this bill".`);
      setAsset(null);
      setPreview(null);
      setForm(EMPTY_FORM);
      refresh();
      download([saved.id]); // new Excel each time: only the bill just saved
    } catch (e) {
      setError(apiError(e, "Could not save the bill"));
    } finally {
      setSaving(false);
    }
  };

  // ids = [billId] -> new Excel with just that bill; no ids -> all bills
  const download = async (ids) => {
    setError("");
    setDownloading(true);
    try {
      await downloadBillsExcel(ids);
    } catch (e) {
      setError(apiError(e, "Could not download the Excel file"));
    } finally {
      setDownloading(false);
    }
  };

  const remove = async (bill) => {
    const ok = await confirmAsync("Delete bill?", `${bill.vendor || "Bill"} - ${fmt(bill.totalAmount)}`);
    if (!ok) return;
    try {
      await deleteBill(bill.id);
      refresh();
    } catch (e) {
      setError(apiError(e, "Could not delete the bill"));
    }
  };

  const grandTotal = bills.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const lowConfidence = preview && preview.confidence != null && preview.confidence < 0.6;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bills</Text>
      <Text style={styles.subtitle}>
        Upload a bill as a PDF. The details are read automatically, you confirm them, and they are added to
        your Excel sheet.
      </Text>

      {!!error && <Text style={styles.errorBox}>{error}</Text>}
      {!!success && <Text style={styles.successBox}>{success}</Text>}
      {!!lastSavedId && (
        <TouchableOpacity
          style={[styles.primaryBtn, styles.thisBillBtn, downloading && styles.disabled]}
          onPress={() => download([lastSavedId])}
          disabled={downloading}
        >
          <Text style={styles.primaryBtnText}>Download Excel for this bill</Text>
        </TouchableOpacity>
      )}

      {/* 1. Upload */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Upload bill</Text>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickPdf} disabled={extracting}>
          <Text style={styles.secondaryBtnText}>{asset ? "Choose a different PDF" : "Choose PDF"}</Text>
        </TouchableOpacity>
        {!!asset && <Text style={styles.fileName}>{asset.name}</Text>}

        <TouchableOpacity
          style={[styles.primaryBtn, (!asset || extracting) && styles.disabled]}
          onPress={runExtract}
          disabled={!asset || extracting}
        >
          {extracting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Read bill</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Review & save */}
      {!!preview && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Check the details</Text>

          {lowConfidence && (
            <Text style={styles.warnBox}>Low confidence read - please check every field carefully.</Text>
          )}
          {(preview.warnings || []).map((w, i) => (
            <Text key={i} style={styles.warnBox}>
              {w}
            </Text>
          ))}

          <Text style={styles.label}>Vendor</Text>
          <TextInput style={styles.input} value={form.vendor} onChangeText={(v) => setField("vendor", v)} />

          <Text style={styles.label}>Bill number</Text>
          <TextInput
            style={styles.input}
            value={form.billNumber}
            onChangeText={(v) => setField("billNumber", v)}
          />

          <Text style={styles.label}>Bill date (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            value={form.billDate}
            onChangeText={(v) => setField("billDate", v)}
            placeholder="2026-10-22"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, form.category === c && styles.chipActive]}
                onPress={() => setField("category", c)}
              >
                <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Subtotal</Text>
              <TextInput
                style={styles.input}
                value={form.subtotal}
                onChangeText={(v) => setField("subtotal", v)}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Tax</Text>
              <TextInput
                style={styles.input}
                value={form.tax}
                onChangeText={(v) => setField("tax", v)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <Text style={styles.label}>Total amount *</Text>
          <TextInput
            style={[styles.input, styles.totalInput]}
            value={form.total}
            onChangeText={(v) => setField("total", v)}
            keyboardType="decimal-pad"
          />

          {clubs.length > 0 && (
            <>
              <Text style={styles.label}>Club (optional)</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={form.clubId} onValueChange={(v) => setField("clubId", v)}>
                  <Picker.Item label="No club" value="" />
                  {clubs.map((c) => (
                    <Picker.Item key={c.id} label={c.name} value={String(c.id)} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {(preview.items || []).length > 0 && (
            <>
              <Text style={styles.label}>Line items found</Text>
              {preview.items.slice(0, 6).map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemDesc} numberOfLines={1}>
                    {it.description}
                    {it.quantity ? `  x${it.quantity}` : ""}
                  </Text>
                  <Text style={styles.itemAmt}>{fmt(it.amount)}</Text>
                </View>
              ))}
              {preview.items.length > 6 && (
                <Text style={styles.muted}>+ {preview.items.length - 6} more (all saved to the sheet)</Text>
              )}
            </>
          )}

          <TouchableOpacity style={[styles.primaryBtn, saving && styles.disabled]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save to Excel sheet</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Saved bills */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Saved bills</Text>
          {loadingList && <ActivityIndicator size="small" color="#3E5C50" />}
        </View>

        {bills.length === 0 && !loadingList && <Text style={styles.muted}>No bills yet.</Text>}

        {bills.map((b) => (
          <View key={b.id} style={styles.billRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.billVendor} numberOfLines={1}>
                {b.vendor || "Unknown vendor"}
              </Text>
              <Text style={styles.muted}>
                {[b.billDate, b.category, b.clubName].filter(Boolean).join("  |  ")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.billAmount}>{fmt(b.totalAmount)}</Text>
              <View style={{ flexDirection: "row", gap: 14 }}>
                <TouchableOpacity onPress={() => download([b.id])}>
                  <Text style={styles.linkText}>Excel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => remove(b)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {bills.length > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({bills.length} bills)</Text>
            <Text style={styles.totalValue}>{fmt(grandTotal)}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.secondaryBtn, { marginTop: 18 }, (bills.length === 0 || downloading) && styles.disabled]}
          onPress={() => download()}
          disabled={bills.length === 0 || downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#3E5C50" />
          ) : (
            <Text style={styles.secondaryBtnText}>Download ALL saved bills together (old + new)</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F5F1" },
  content: { padding: 20, paddingBottom: 50 },
  title: { fontSize: 28, fontWeight: "700", color: "#1C2321", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#666", marginBottom: 16, lineHeight: 22 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1C2321", marginBottom: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, fontWeight: "600", color: "#1C2321", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#D9D7CF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1C2321",
    backgroundColor: "#FBFAF7",
  },
  totalInput: { fontSize: 20, fontWeight: "700" },
  row: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  pickerWrap: { borderWidth: 1, borderColor: "#D9D7CF", borderRadius: 10, backgroundColor: "#FBFAF7" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D9D7CF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FBFAF7",
  },
  chipActive: { backgroundColor: "#3E5C50", borderColor: "#3E5C50" },
  chipText: { fontSize: 13, color: "#1C2321" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  primaryBtn: {
    backgroundColor: "#3E5C50",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 18,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#3E5C50",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#3E5C50", fontSize: 15, fontWeight: "600" },
  disabled: { opacity: 0.45 },
  fileName: { marginTop: 10, color: "#1C2321", fontSize: 14 },
  muted: { color: "#777", fontSize: 13, marginTop: 4 },
  errorBox: {
    backgroundColor: "#FDECEA",
    color: "#B3261E",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: "#E7F3EC",
    color: "#1E6B43",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    lineHeight: 20,
  },
  warnBox: {
    backgroundColor: "#FFF4DB",
    color: "#7A5600",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemDesc: { flex: 1, color: "#1C2321", fontSize: 14, paddingRight: 8 },
  itemAmt: { color: "#1C2321", fontSize: 14, fontWeight: "600" },
  billRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEDE7",
  },
  billVendor: { fontSize: 15, fontWeight: "600", color: "#1C2321" },
  billAmount: { fontSize: 16, fontWeight: "700", color: "#1C2321" },
  deleteText: { color: "#B3261E", fontSize: 12, marginTop: 4 },
  linkText: { color: "#3E5C50", fontSize: 12, marginTop: 4, fontWeight: "600" },
  thisBillBtn: { marginTop: 0, marginBottom: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 12 },
  totalLabel: { fontSize: 15, fontWeight: "600", color: "#1C2321" },
  totalValue: { fontSize: 17, fontWeight: "700", color: "#3E5C50" },
});
