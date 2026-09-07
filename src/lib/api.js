import axios from "axios";

const BASE_URL = "https://corleoneteam.com.tr/api";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Her istekte token varsa Authorization header ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (data) => api.post("/auth/login.php", data),
  logout: () => api.post("/auth/logout.php"),
  me: () => api.get("/auth/me.php"),
  loginWithDiscord: (pollKey) => `${BASE_URL}/auth/discord-login.php?desktop=1&poll_key=${pollKey}`,
  loginWithGoogle:  (pollKey) => `${BASE_URL}/auth/google-login.php?desktop=1&poll_key=${pollKey}`,
  loginWithSteam:   (pollKey) => `${BASE_URL}/auth/steam-login.php?desktop=1&poll_key=${pollKey}`,
  pollOAuth: (key) => api.get(`/auth/oauth-poll.php?action=get&key=${key}`),
};

export const eventsApi = {
  list: () => api.get("/auth/events-list.php"),
  attend: (event_id, status) => api.post("/auth/attendance.php", new URLSearchParams({ event_id, status }), { headers: { "Content-Type": "application/x-www-form-urlencoded" } }),
  attendees: (event_id) => api.get(`/auth/attendance-list.php?event_id=${event_id}`),
};

export const dashboardApi = {
  get: () => api.get("/auth/dashboard.php"),
};

export const downloadsApi = {
  list: () => api.get("/auth/downloads-list.php"),
  download: (id, version_id) => `${api.defaults.baseURL}/auth/download-file.php?id=${id}${version_id ? `&version=${version_id}` : ""}`,
};

export const mediaApi = {
  list: () => api.get("/auth/media-list.php"),
  upload: (formData) => api.post("/auth/user-media-upload.php", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id) => api.post("/auth/user-media-manage.php", { action: "delete", id }),
  update: (id, data) => api.post("/auth/user-media-manage.php", { action: "update", id, ...data }),
};

export const profileApi = {
  getInfo: () => api.get("/auth/profile-info.php"),
  saveInfo: (data) => api.post("/auth/profile-info.php", data),
  getAvatars: () => api.get("/auth/avatar.php?action=list"),
  uploadAvatar: (formData) => api.post("/auth/avatar.php?action=upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  setAvatar: (url) => api.post("/auth/avatar.php?action=set", { url }),
  deleteAvatar: (id) => api.post("/auth/avatar.php?action=delete", { id }),
  getSocials: () => api.get("/auth/user-socials.php?action=list"),
  saveSocial: (platform, value) => api.post("/auth/user-socials.php?action=save", { platform, value }),
  deleteSocial: (platform) => api.post("/auth/user-socials.php?action=delete", { platform }),
};
