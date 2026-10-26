import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import client, { BASE_URL } from "./client";

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Pull a readable message out of our API's { error: "..." } responses
export const apiError = (e, fallback = "Something went wrong") =>
  e?.response?.data?.error ||
  e?.response?.data?.message ||
  (e?.message === "Network Error" ? "Cannot reach the server. Is the backend running?" : e?.message) ||
  fallback;

// Step 1: send the PDF to the backend -> ML service. Nothing is saved yet.
export async function extractBill(asset) {
  const form = new FormData();
  if (Platform.OS === "web") {
    // expo-document-picker gives a real File on web
    const file = asset.file || (await (await fetch(asset.uri)).blob());
    form.append("file", file, asset.name || "bill.pdf");
  } else {
    form.append("file", {
      uri: asset.uri,
      name: asset.name || "bill.pdf",
      type: "application/pdf",
    });
  }

  const { data } = await client.post("/api/bills/extract", form, {
    headers: { "Content-Type": "multipart/form-data" },
    transformRequest: (d) => d, // don't let axios JSON-ify FormData on native
    timeout: 60000,
  });
  return data;
}

// Step 2: save the confirmed details
export const saveBill = (payload) => client.post("/api/bills", payload).then((r) => r.data);

export const listBills = () => client.get("/api/bills").then((r) => r.data);

export const deleteBill = (id) => client.delete(`/api/bills/${id}`);

// Clubs the current user may attach a bill to
export const clubsForBills = (role) => {
  const url =
    role === "STUDENT" ? "/api/clubs/joined" : role === "STAFF" ? "/api/clubs/coordinating" : "/api/clubs";
  return client.get(url).then((r) => r.data);
};

// Download an Excel sheet. ids = [5] -> a new file with only that bill; omit -> all your bills.
export async function downloadBillsExcel(ids) {
  const single = ids && ids.length === 1;
  const date = new Date().toISOString().slice(0, 10);
  const filename = single ? `bill-${ids[0]}-${date}.xlsx` : `club-bills-${date}.xlsx`;
  const query = ids && ids.length ? `?ids=${ids.join(",")}` : "";

  if (Platform.OS === "web") {
    const res = await client.get(`/api/bills/export${query}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: XLSX_MIME }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return;
  }

  const FileSystem = await import("expo-file-system/legacy");
  const Sharing = await import("expo-sharing");
  const token = await AsyncStorage.getItem("accessToken");
  const target = FileSystem.cacheDirectory + filename;

  const res = await FileSystem.downloadAsync(`${BASE_URL}/api/bills/export${query}`, target, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 200) throw new Error(`Download failed (${res.status})`);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(res.uri, {
      mimeType: XLSX_MIME,
      dialogTitle: "Save or open the bills sheet",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });
  } else {
    throw new Error("Sharing is not available on this device");
  }
}
