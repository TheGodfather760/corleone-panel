import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

const BASE_URL = "https://corleoneteam.com.tr/api";

const ALLOWED_ORIGINS = [
  "https://corleoneteam.com.tr",
  "https://www.corleoneteam.com.tr",
];

function buildUrl(url) {
  if (!url.startsWith("http")) return BASE_URL + url;
  if (ALLOWED_ORIGINS.some(o => url.startsWith(o))) return url;
  return BASE_URL + url;
}

const isTauri = typeof window !== "undefined" && window.__TAURI_INTERNALS__ !== undefined;

async function request(method, url, data = null, isFormData = false) {
  const token = localStorage.getItem("auth_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (data && !isFormData) headers["Content-Type"] = "application/json";

  const options = { method, headers };
  if (data) options.body = isFormData ? data : JSON.stringify(data);

  const fullUrl = buildUrl(url);

  let res;
  if (isTauri) {
    res = await tauriFetch(fullUrl, options);
  } else {
    res = await fetch(fullUrl, options);
  }

  const json = await res.json();
  return { data: json, status: res.status };
}

function xhrPost(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const token = localStorage.getItem("auth_token");
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "json";
    if (onProgress) xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => resolve({ data: xhr.response, status: xhr.status });
    xhr.onerror = () => reject(new Error("Baglanti hatasi."));
    xhr.send(formData);
  });
}

export const api = {
  get:  (url) => request("GET", url),
  post: (url, data, cfg) => request("POST", url, data, cfg?.headers?.["Content-Type"] === "multipart/form-data"),
  defaults: { baseURL: BASE_URL },
};

export const authApi = {
  login: (data) => request("POST", "/auth/login.php", data),
  logout: () => request("POST", "/auth/logout.php"),
  me: () => request("GET", "/auth/me.php"),
  loginWithDiscord: (pollKey) => `${BASE_URL}/auth/discord-login.php?desktop=1&poll_key=${pollKey}`,
  loginWithGoogle:  (pollKey) => `${BASE_URL}/auth/google-login.php?desktop=1&poll_key=${pollKey}`,
  loginWithSteam:   (pollKey) => `${BASE_URL}/auth/steam-login.php?desktop=1&poll_key=${pollKey}`,
  pollOAuth: (key) => request("GET", `/auth/oauth-poll.php?action=get&key=${key}`),
  linkGoogle:  () => `${BASE_URL}/auth/google-login.php?link=1`,
  linkDiscord: () => `${BASE_URL}/auth/discord-login.php?link=1`,
  linkSteam:   () => `${BASE_URL}/auth/steam-login.php?link=1`,
};

export const eventsApi = {
  list: () => request("GET", "/auth/events-list.php"),
  attend: (event_id, status) => request("POST", "/auth/attendance.php", { event_id, status }),
  attendees: (event_id) => request("GET", `/auth/attendance-list.php?event_id=${event_id}`),
};

export const dashboardApi = {
  get: () => request("GET", "/auth/dashboard.php"),
};

export const downloadsApi = {
  list: () => request("GET", "/auth/downloads-list.php"),
  download: (id, version_id) => `${BASE_URL}/auth/download-file.php?id=${id}${version_id ? `&version=${version_id}` : ""}`,
};

export const mediaApi = {
  list: () => request("GET", "/auth/media-list.php"),
  upload: (formData) => request("POST", "/auth/user-media-upload.php", formData, true),
  delete: (id) => request("POST", "/auth/user-media-manage.php", { action: "delete", id }),
  update: (id, data) => request("POST", "/auth/user-media-manage.php", { action: "update", id, ...data }),
};

export const profileApi = {
  getInfo: () => request("GET", "/auth/profile-info.php"),
  saveInfo: (data) => request("POST", "/auth/profile-info.php", data),
  getAvatars: () => request("GET", "/auth/avatar.php?action=list"),
  uploadAvatar: (formData) => request("POST", "/auth/avatar.php?action=upload", formData, true),
  setAvatar: (url) => request("POST", "/auth/avatar.php?action=set", { url }),
  deleteAvatar: (id) => request("POST", "/auth/avatar.php?action=delete", { id }),
  getSocials: () => request("GET", "/auth/user-socials.php?action=list"),
  saveSocial: (platform, value) => request("POST", "/auth/user-socials.php?action=save", { platform, value }),
  deleteSocial: (platform) => request("POST", "/auth/user-socials.php?action=delete", { platform }),
  changePassword: (data) => request("POST", "/auth/profile-settings.php?action=change_password", data),
  requestEmailChange: (email) => request("POST", "/auth/profile-settings.php?action=request_email_change", { email }),
  saveNotifications: (data) => request("POST", "/auth/profile-settings.php?action=save_notifications", data),
  savePrivacy: (data) => request("POST", "/auth/profile-settings.php?action=save_privacy", data),
  listSessions: () => request("GET", "/auth/profile-settings.php?action=list_sessions"),
  revokeOtherSessions: () => request("POST", "/auth/profile-settings.php?action=revoke_other_sessions", {}),
  deleteAccount: (confirm) => request("POST", "/auth/profile-settings.php?action=delete_account", { confirm }),
};

export const steamApi = {
  getPlaytime:      (appId) => request("GET", `/auth/steam-playtime.php?appid=${appId}`),
  getLibrary:       () => request("GET", "/auth/steam-playtime.php"),
  getAchievements:  (appId) => request("GET", `/auth/steam-achievements.php?appid=${appId}`),
};

export const chatApi = {
  online:        () => request("GET", "/auth/users-online.php"),
  conversations: () => request("GET", "/auth/chat-conversations.php"),
  messages:      (withId, since) => request("GET", `/auth/chat-messages.php?with=${withId}${since ? `&since=${encodeURIComponent(since)}` : ""}`),
  send:          (to_id, body) => request("POST", "/auth/chat-messages.php", { to_id, body }),
};

export const heartbeatApi = {
  ping: (version) => request("POST", "/auth/app-heartbeat.php", { version }),
};

export const notificationsApi = {
  list:    () => request("GET", "/auth/app-notifications.php?action=list"),
  read:    (id) => request("POST", "/auth/app-notifications.php?action=read", { id }),
  readAll: () => request("POST", "/auth/app-notifications.php?action=read_all"),
  log:     (title, body, type, source_label) => request("POST", "/auth/app-notifications.php?action=log", { title, body, type, source_label }),
};

export const routesApi = {
  list:            ()           => request("GET",  "/auth/routes.php?action=list"),
  images:          (routeId)   => request("GET",  `/auth/routes.php?action=images&route_id=${routeId}`),
  save:            (data)      => request("POST", "/auth/routes.php?action=save", data),
  update:          (data)      => request("POST", "/auth/routes.php?action=update", data),
  delete:          (id)        => request("POST", "/auth/routes.php?action=delete", { id }),
  toggleVerify:    (id)        => request("POST", "/auth/routes.php?action=toggle_verify", { id }),
  eventsForAssign: ()          => request("GET",  "/auth/routes.php?action=events_for_assign"),
  assignEvent:     (routeId, eventId) => request("POST", "/auth/routes.php?action=assign_event", { route_id: routeId, event_id: eventId }),
  unassignEvent:   (eventId)   => request("POST", "/auth/routes.php?action=unassign_event", { event_id: eventId }),
  deleteImage:     (id)        => request("POST", "/auth/routes.php?action=delete_image", { id }),
  updateImageType: (id, type)  => request("POST", "/auth/routes.php?action=update_image_type", { id, type }),
  uploadPoolImage: (formData)  => request("POST", "/auth/routes.php?action=upload_pool_image", formData, true),
  uploadRouteImage:(formData)  => request("POST", "/auth/routes.php?action=upload_route_image", formData, true),
  imageUrl:        (path)      => `https://corleoneteam.com.tr/assets/uploads/routes/${path}`,
};

export const promodsApi = {
  load: (game) => request("GET", `/auth/promods.php?game=${game}`),
};

export const logisticsApi = {
  market:     (category = "is_bul") => request("GET",  `/logistics/data.php?type=market&category=${category}`),
  garage:     ()                    => request("GET",  "/logistics/data.php?type=garage"),
  finance:    ()                    => request("GET",  "/logistics/data.php?type=finance"),
  activeJobs: ()                    => request("GET",  "/logistics/active-jobs.php"),
  claimJob:   (job_id)              => request("POST", "/logistics/claim-job.php",  { job_id }),
  startJob:   (data)                => request("POST", "/logistics/start-job.php",  data),
  onboarding: ()                    => request("GET",  "/logistics/onboarding.php"),
  setupSeed:  ()                    => request("POST", "/logistics/setup-seed.php", {}),
};

export const adminPromodsApi = {
  load:             (game)  => request("GET",  `/auth/admin-promods.php?action=load&game=${game}`),
  saveGameVersion:  (data)  => request("POST", "/auth/admin-promods.php?action=save_game_version",  data),
  savePkgVersion:   (data)  => request("POST", "/auth/admin-promods.php?action=save_pkg_version",   data),
  deletePkgVersion: (id)    => request("POST", "/auth/admin-promods.php?action=delete_pkg_version", { id }),
  togglePublish:    (id)    => request("POST", "/auth/admin-promods.php?action=toggle_publish",     { id }),
  saveFile:         (data)  => request("POST", "/auth/admin-promods.php?action=save_file",          data),
  deleteFile:       (id)    => request("POST", "/auth/admin-promods.php?action=delete_file",        { id }),
};

export const adminFleetApi = {
  list:          ()       => request("GET",  "/auth/admin-fleet.php?action=list"),
  updateTruck:   (fd)     => request("POST", "/auth/admin-fleet.php?action=update_truck",   fd, true),
  updateTrailer: (fd)     => request("POST", "/auth/admin-fleet.php?action=update_trailer", fd, true),
};

export const adminNotificationsApi = {
  list:      ()     => request("GET",  "/auth/admin-notifications.php?action=list"),
  users:     ()     => request("GET",  "/auth/admin-notifications.php?action=users"),
  send:      (data) => request("POST", "/auth/admin-notifications.php?action=send", data),
  delete:    (id)   => request("POST", "/auth/admin-notifications.php?action=delete", { id }),
  deleteAll: ()     => request("POST", "/auth/admin-notifications.php?action=delete_all", {}),
};

export const adminPointsApi = {
  load:       ()       => request("GET",  "/auth/admin-points.php?action=load"),
  savePoints: (rules)  => request("POST", "/auth/admin-points.php?action=save_points", { rules }),
  saveRanks:  (ranks)  => request("POST", "/auth/admin-points.php?action=save_ranks",  { ranks }),
  saveTasks:  (tasks)  => request("POST", "/auth/admin-points.php?action=save_tasks",  { tasks }),
};

export const adminMediaApi = {
  summary:   ()           => request("GET",  "/auth/admin-media.php?action=summary"),
  userMedia: (userId)     => request("GET",  `/auth/admin-media.php?action=user_media&user_id=${userId}`),
  delete:    (id)         => request("POST", "/auth/admin-media.php?action=delete", { id }),
  setQuota:  (userId, mb) => request("POST", "/auth/admin-media.php?action=set_quota", { user_id: userId, quota_mb: mb }),
  mediaUrl:  (userId, filename) => `https://corleoneteam.com.tr/assets/user-media/${userId}/${filename}`,
};

export const eventMediaApi = {
  upload: (formData, onProgress) => xhrPost("https://corleoneteam.com.tr/api/auth/event-media.php?action=upload", formData, onProgress),
};

export const adminApi = {
  getUsers:       () => request("GET", "/auth/admin-users.php?action=list"),
  updateUser:     (data) => request("POST", "/auth/admin-users.php?action=update", data),
  mailUser:       (userId, action) => request("POST", "/auth/admin-users.php?action=mail", { user_id: userId, action }),

  getEts2ProfileFiles: () => request("GET", "/auth/ets2-profile-files.php"),
  getAtsProfileFiles:  () => request("GET", "/auth/ats-profile-files.php"),

  getNews:        () => request("GET", "/auth/news.php?action=list"),
  createNews:     (data) => request("POST", "/auth/news.php?action=create", data, true),
  updateNews:     (data) => request("POST", "/auth/news.php?action=update", data),
  toggleNews:     (id) => request("POST", "/auth/news.php?action=toggle", { id }),
  deleteNews:     (id) => request("POST", "/auth/news.php?action=delete", { id }),

  getEvents:        () => request("GET", "/auth/admin-events.php?action=list"),
  createEvent:      (data) => request("POST", "/auth/admin-events.php?action=create", data, true),
  updateEvent:      (data) => request("POST", "/auth/admin-events.php?action=update", data, true),
  deleteEvent:      (id) => request("POST", "/auth/admin-events.php?action=delete", { id }),
  getEventAttendees:(id) => request("GET", `/auth/admin-events.php?action=attendees&event_id=${id}`),
  getEventMedia:    (id) => request("GET", `/auth/admin-events.php?action=media&event_id=${id}`),
  approveMedia:     (id) => request("POST", "/auth/admin-events.php?action=approve_media", { id }),
  deleteMedia:      (id) => request("POST", "/auth/admin-events.php?action=delete_media", { id }),
  uploadEventMedia: (formData) => request("POST", "/auth/event-media.php?action=upload", formData, true),

  getInvites:          () => request("GET", "/auth/invites.php?action=list"),
  createInvite:        (data) => request("POST", "/auth/invites.php?action=create", data),
  deleteInvite:        (id) => request("POST", "/auth/invites.php?action=delete", { id }),
  getInviteRequests:   (status) => request("GET", `/auth/invites.php?action=requests${status ? "&status="+status : ""}`),
  updateInviteRequest: (id, status) => request("POST", "/auth/invites.php?action=update_request", { id, status }),
  deleteInviteRequest: (id) => request("POST", "/auth/invites.php?action=delete_request", { id }),

  getDownloads:   () => request("GET", "/auth/downloads-list.php?admin=1"),
  uploadDownload: (formData) => xhrPost("https://corleoneteam.com.tr/api/auth/download-upload.php", formData),
  uploadFile:     (formData, onProgress) => xhrPost("https://corleoneteam.com.tr/api/auth/download-file-manager.php", formData, onProgress),
  listFiles:      () => request("GET", "/auth/download-file-manager.php?action=list"),
  deleteFile:     (name) => request("POST", "/auth/download-file-manager.php?action=delete", { name }),
  updateDownload: (data) => request("POST", "/auth/download-edit.php?action=update", data),
  addVersion:     (downloadId, version, changelog, profileZipUrl, file) => {
    return new Promise((resolve, reject) => {
      const token = localStorage.getItem("auth_token");
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://corleoneteam.com.tr/api/auth/download-edit.php?action=add_version");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.responseType = "json";
        xhr.onload = () => resolve({ data: xhr.response, status: xhr.status });
        xhr.onerror = () => reject(new Error("Baglanti hatasi."));
        xhr.send(JSON.stringify({ download_id: downloadId, version, changelog, profile_zip_url: profileZipUrl, file_base64: base64, file_name: file.name }));
      };
      reader.onerror = () => reject(new Error("Dosya okunamadi."));
      reader.readAsDataURL(file);
    });
  },
  updateVersion:  (data) => request("POST", "/auth/download-edit.php?action=update_version", data),
  deleteVersion:  (version_id) => request("POST", "/auth/download-edit.php?action=delete_version", { version_id }),
  deleteDownload: (id) => request("POST", "/auth/download-edit.php?action=delete", { id }),

  getRoutes: () => request("GET", "/auth/users-list.php?action=routes"),
};
