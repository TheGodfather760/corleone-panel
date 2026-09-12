import { useEffect, useRef } from "react";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { notificationsApi, eventsApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { useNotif } from "../lib/NotifContext";
import { useUpdate } from "../lib/UpdateContext";
import { useSettings } from "../lib/SettingsContext";
import { getVersion } from "@tauri-apps/api/app";

const POLL_INTERVAL   = 60_000;
const EVENT_INTERVAL  = 5 * 60_000;
const UPDATE_INTERVAL = 30 * 60_000; // 30dk
const EVENT_THRESHOLDS = [60, 30, 10];

export default function NotificationPoller() {
  const { user } = useAuth();
  const { push } = useNotif();
  const { settings } = useSettings();
  const { checkUpdate: ctxCheckUpdate, updateInfo } = useUpdate();
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  const permRef      = useRef(false);
  const notifTimer   = useRef(null);
  const eventTimer   = useRef(null);
  const updateTimer  = useRef(null);
  const notifiedRef  = useRef(null);

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
        const events = res.data?.events ?? [];
        const now = Date.now();

        for (const ev of events) {
          if (ev.status === "past") continue;
          const evTime = new Date(ev.event_date).getTime();
          const diffMin = Math.floor((evTime - now) / 60000);

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
    });

    notifTimer.current  = setInterval(pollNotifications, POLL_INTERVAL);
    eventTimer.current  = setInterval(pollEvents, EVENT_INTERVAL);
    updateTimer.current = setInterval(pollUpdate, UPDATE_INTERVAL);

    return () => {
      clearInterval(notifTimer.current);
      clearInterval(eventTimer.current);
      clearInterval(updateTimer.current);
    };
  }, [user]);

  return null;
}
