import client from "./client";

// ---- Auth ----
export const login = (email, password) =>
  client.post("/api/auth/login", { email, password }).then((r) => r.data);

export const register = (payload) =>
  client.post("/api/auth/register", payload).then((r) => r.data);

export const fetchMe = () => client.get("/api/auth/me").then((r) => r.data);

// ---- Clubs ----
export const listClubs = () => client.get("/api/clubs").then((r) => r.data);

export const createClub = (payload) => client.post("/api/clubs", payload).then((r) => r.data);

export const joinClub = (clubId) => client.post(`/api/clubs/${clubId}/join`).then((r) => r.data);

export const listMembers = (clubId) => client.get(`/api/clubs/${clubId}/members`).then((r) => r.data);

// ---- Budget requests ----
export const createBudgetRequest = (payload) =>
  client.post("/api/budget-requests", payload).then((r) => r.data);

export const reviewBudgetRequest = (id, approve, comment) =>
  client.patch(`/api/budget-requests/${id}/review`, { approve, comment }).then((r) => r.data);

export const myBudgetRequests = () => client.get("/api/budget-requests/mine").then((r) => r.data);

export const budgetRequestsByClub = (clubId) =>
  client.get(`/api/budget-requests/club/${clubId}`).then((r) => r.data);

// ---- Attendance (OTP) ----
export const generateOtp = (clubId, title) =>
  client.post("/api/attendance/sessions", { clubId, title }).then((r) => r.data);

export const closeSession = (sessionId) =>
  client.patch(`/api/attendance/sessions/${sessionId}/close`).then((r) => r.data);

export const verifyOtp = (otp) =>
  client.post("/api/attendance/verify", { otp }).then((r) => r.data);
export const sessionRecords = (sessionId) =>
  client.get(`/api/attendance/sessions/${sessionId}/records`).then((r) => r.data);

export const sessionsForClub = (clubId) =>
  client.get(`/api/attendance/club/${clubId}/sessions`).then((r) => r.data);
   