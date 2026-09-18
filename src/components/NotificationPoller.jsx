import { useEffect, useRef } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { notificationsApi, eventsApi, chatApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useNotif } from "../lib/NotifContext";
import { useUpdate } from "../lib/UpdateContext";
import { useSettings } from "../lib/SettingsContext";
import { getVersion } from "@tauri-apps/api/app";

const POLL_INTERVAL   = 60_000;
const CHAT_INTERVAL   = 10_000;
const EVENT_INTERVAL  = 5 * 60_000;
const UPDATE_INTERVAL = 30 * 60_000;
const EVENT_THRESHOLDS = [60, 30, 10];

export default function NotificationPoller() {
  const { user } = useAuth();
  const { push, dismiss } = useNotif();
  const { settings } = useSettings();
  const { checkUpdate: ctxCheckUpdate, updateInfo } = useUpdate();
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const permRef      = useRef(false);
  const notifTimer   = useRef(null);
  const eventTimer   = useRef(null);
  const updateTimer  = useRef(null);
  const chatTimer    = useRef(null);
  const notifiedRef  = useRef(null);
  const chatBaselineRef = useRef(null);
  const chatToastRef = useRef({}); // user_id -> toast id

  // localStorage'dan oku, memory'de tut
  function getNotified() {
    if (!notifiedRef.current) {
      try { notifiedRef.current = new Set(JSON.parse(localStorage.getItem("notified_keys") || "[]")); }
      catch { notifiedRef.current = new Set(); }
    }
    return notifiedRef.current;
  }

  function markNotified(key) {
    const s = getNotified();
    s.add(key);
    localStorage.setItem("notified_keys", JSON.stringify([...s]));
  }

  useEffect(() => {
    if (!user) return;

    async function initPerm() {
      let granted = await isPermissionGranted();
      if (!granted) {
        const perm = await requestPermission();
        granted = perm === "granted";
      }
      permRef.current = granted;
    }

    // Yardımcı: bildirim gönder + logla
    async function notify(title, body, type, sourceLabel) {
      push(title, body, type);
      if (permRef.current) sendNotification({ title, body, icon: "icons/icon.png" });
      try { await notificationsApi.log(title, body, type, sourceLabel); } catch {}
    }

    // ── Chat mesaj bildirimi ──
    async function pollChat() {
      try {
        const res = await chatApi.conversations();
        const convs = res.data?.data || res.data || [];
        if (chatBaselineRef.current === null) {
          const baseline = {};
          convs.forEach(c => { baseline[c.user_id] = c.unread; });
          chatBaselineRef.current = baseline;
          return;
        }
        for (const c of convs) {
          const prev = chatBaselineRef.current[c.user_id] ?? 0;
          if (c.unread > prev) {
            // Önceki toast'u kapat
            if (chatToastRef.current[c.user_id] !== undefined) {
              dismiss(chatToastRef.current[c.user_id]);
            }
            const body = c.last_body ? (c.last_body.replace(/<[^>]+>/g, "").slice(0, 60) + (c.last_body.length > 60 ? "..." : "")) : "";
            const id = push(
              `💬 ${c.username}`,
              body,
              "info",
              () => {
                // C-ONE chat ekranını aç ve ilgili kişiye git
                window.dispatchEvent(new CustomEvent("open-chat", { detail: { userId: c.user_id, username: c.username, avatar: c.avatar, is_online: c.is_online } }));
              }
            );
            chatToastRef.current[c.user_id] = id;
            if (permRef.current) sendNotification({ title: c.username, body: body || "Yeni mesaj", icon: "icons/icon.png" });
          }
          chatBaselineRef.current[c.user_id] = c.unread;
        }
      } catch {}
    }

    // ── Admin bildirimleri polling ──
    async function pollNotifications() {
      if (!settingsRef.current.announcementNotif) return;
      try {
        const res = await notificationsApi.list();
        const notifications = res.data?.notifications ?? [];
        for (const n of notifications) {
          push(n.title, n.body ?? "", n.type ?? "info");
          if (permRef.current) sendNotification({ title: n.title, body: n.body ?? "", icon: "icons/icon.png" });
          await notificationsApi.read(n.id);
        }
      } catch {}
    }

    // ── Etkinlik bildirimleri ──
    async function pollEvents() {
      if (!settingsRef.current.eventReminder) return;
      try {
        const res = await eventsApi.list();
        const events = res.data?.events ?? res.data?.data ?? [];
        const now = Date.now();

        for (const ev of events) {
          if (ev.status === "past") continue;
          const evTime = new Date(ev.event_date).getTime();
          const diffMin = Math.floor((evTime - now) / 60000);

          // 2 saat kala özel banner
          const bannerKey = `${ev.id}_banner_120`;
          if (!getNotified().has(bannerKey) && diffMin <= 120 && diffMin > 0) {
            window.dispatchEvent(new CustomEvent("event-reminder", { detail: ev }));
            markNotified(bannerKey);
          }

          for (const threshold of EVENT_THRESHOLDS) {
            const key = `${ev.id}_${threshold}`;
            if (getNotified().has(key)) continue;
            if (diffMin <= threshold && diffMin > threshold - 3) {
              const msg = threshold >= 60
                ? `${ev.title} etkinliği 1 saat sonra başlıyor!`
                : `${ev.title} etkinliği ${threshold} dakika sonra başlıyor!`;
              await notify("🗓 Etkinlik Hatırlatıcı", msg, "event", `Etkinlik: ${ev.title}`);
              markNotified(key);
            }
          }

          const startKey = `${ev.id}_start`;
          if (!getNotified().has(startKey) && ev.status === "active") {
            await notify("🚀 Etkinlik Başladı!", `${ev.title} etkinliği şu an aktif!`, "success", `Etkinlik: ${ev.title}`);
            markNotified(startKey);
          }
        }
      } catch {}
    }

    // ── Güncelleme kontrolü ──
    async function pollUpdate() {
      await ctxCheckUpdate(); // context state'i günceller (AppLayout ikonu görünür olur)
      if (!updateInfo) return;
      const key = `update_${updateInfo.version}`;
      if (getNotified().has(key)) return;
      const msg = `Sürüm ${updateInfo.version} mevcut! Ayarlar sayfasından güncelleyebilirsiniz.`;
      await notify("🔄 Güncelleme Mevcut", msg, "warning", `v${await getVersion()} → v${updateInfo.version}`);
      markNotified(key);
    }

    initPerm().then(() => {
      pollNotifications();
      pollEvents();
      pollUpdate();
      pollChat();
    });

    notifTimer.current  = setInterval(pollNotifications, POLL_INTERVAL);
    eventTimer.current  = setInterval(pollEvents, EVENT_INTERVAL);
    updateTimer.current = setInterval(pollUpdate, UPDATE_INTERVAL);
    chatTimer.current   = setInterval(pollChat, CHAT_INTERVAL);

    return () => {
      clearInterval(notifTimer.current);
      clearInterval(eventTimer.current);
      clearInterval(updateTimer.current);
      clearInterval(chatTimer.current);
    };
  }, [user]);

  return null;
}
