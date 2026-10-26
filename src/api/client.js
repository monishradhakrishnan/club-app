import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NATIVE_LAN_IP = '192.168.137.1'; // <-- change this for physical device / Expo Go

function resolveBaseUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return `http://${window.location.hostname}:8080`;
  }
  return `http://${NATIVE_LAN_IP}:8080`;
}

export const BASE_URL = resolveBaseUrl();

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const getItem = (key) => AsyncStorage.getItem(key);
const setItem = (key, value) => AsyncStorage.setItem(key, value);
const clearAll = () => AsyncStorage.clear();

client.interceptors.request.use(async (config) => {
  const token = await getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];
const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await getItem("refreshToken");
      if (!refreshToken) {
        await clearAll();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        await setItem("accessToken", data.accessToken);
        await setItem("refreshToken", data.refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
